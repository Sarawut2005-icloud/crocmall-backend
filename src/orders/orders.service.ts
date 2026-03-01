import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { ProductsService } from '../products/products.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
    private readonly productsService: ProductsService,
  ) {}

  /**
   * 🛒 สร้างออเดอร์ใหม่ (รองรับหลายรายการสินค้า + โค้ดส่วนลด)
   * 🛠️ แก้ไข: คำนวณ netPrice ส่งไปเลยเพื่อแก้ปัญหา ValidationError
   */
  async createOrder(userId: string, userEmail: string, createOrderDto: CreateOrderDto) {
    let totalPrice = 0;
    const orderItems: any[] = [];

    // --- STEP 1: DRY RUN (ตรวจสอบสต็อกและราคาจาก DB จริง) ---
    for (const item of createOrderDto.items) {
      const product = await this.productsService.findOne(item.productId);
      if (!product) throw new NotFoundException(`ไม่พบสินค้าไอดี ${item.productId}`);
      
      const variant = product.variants.find(v => v.color === item.color);
      if (!variant) throw new BadRequestException(`สินค้า ${product.name} ไม่มีสี ${item.color}`);
      
      if (variant.stock < item.quantity) {
        throw new BadRequestException(`สินค้า ${product.name} สี ${item.color} สต็อกไม่พอ`);
      }

      const price = product.discountPrice || product.price;
      totalPrice += price * item.quantity;

      orderItems.push({
        productId: product._id,
        productName: product.name,
        imageUrl: item.imageUrl || (product.images && product.images[0]) || '', 
        color: item.color,
        quantity: item.quantity,
        priceAtPurchase: price,
      });
    }

    // --- STEP 2: คำนวณส่วนลด (Promo Code Logic) ---
    let discountAmount = 0;
    const promoCode = createOrderDto.promoCode?.toUpperCase();

    if (promoCode === 'CROC2026') {
      discountAmount = 500; 
    } else if (promoCode === 'MASTERPIECE') {
      discountAmount = totalPrice * 0.1;
    }

    // --- STEP 3: COMMIT (ตัดสต็อกจริงทุกรายการ) ---
    for (const item of orderItems) {
      await this.productsService.decreaseStock(item.productId.toString(), item.quantity, item.color);
    }

    // --- STEP 4: PERSIST (บันทึกลง Database) ---
    // ✅ คำนวณราคาสุทธิที่นี่เพื่อแก้ปัญหา ValidatorError: Path netPrice is required
    const netPrice = Math.max(0, totalPrice - discountAmount);

    const newOrder = new this.orderModel({
      userId,
      userEmail,
      shippingAddress: createOrderDto.shippingAddress,
      paymentMethod: createOrderDto.paymentMethod,
      phone: createOrderDto.phone,
      items: orderItems,
      totalPrice: totalPrice,
      discountAmount: discountAmount,
      promoCode: promoCode,
      netPrice: netPrice, // 👈 ส่งค่าที่คำนวณแล้วไปเลย
      status: 'Pending',
    });

    const savedOrder = await newOrder.save();
    console.log(`📡 Order Created: ${savedOrder.orderNumber} | Net: ฿${netPrice}`);
    
    return savedOrder;
  }

  /**
   * 🚚 อัปเดตสถานะ (พร้อมระบบ Rollback สต็อกอัตโนมัติ)
   */
  async updateOrderStatus(orderId: string, status: string, note?: string) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('ไม่พบออเดอร์ครับกัปตัน!');

    // 🚩 Logic พิเศษ: ถ้าสถานะเปลี่ยนเป็น Cancelled ให้คืนสต็อกสินค้าทุกชิ้น
    if (status === 'Cancelled' && order.status !== 'Cancelled') {
      for (const item of order.items) {
        if (item.productId) {
          await this.productsService.increaseStock(item.productId.toString(), item.quantity, item.color || 'Standard');
        }
      }
    }

    order.status = status;
    order.history.push({
      status,
      updatedAt: new Date(),
      note: note || `ระบบเปลี่ยนสถานะเป็น ${status} เรียบร้อยแล้ว`,
    });

    // 🛡️ Legacy Support: เติมข้อมูลจำลองให้ออเดอร์รุ่นเก่า
    if (!order.phone) order.phone = "0000000000";
    if (!order.paymentMethod) order.paymentMethod = "COD";
    if (order.netPrice === undefined) order.netPrice = order.totalPrice;

    return await order.save();
  }

  /**
   * 📊 ข้อมูลสำหรับ Dashboard แอดมิน
   */
  async getSalesDashboard() {
    const stats = await this.orderModel.aggregate([
      { $match: { status: { $ne: 'Cancelled' } } }, 
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$netPrice' },
          totalOrders: { $sum: 1 },
        },
      },
    ]);
    return stats[0] || { totalRevenue: 0, totalOrders: 0 };
  }

  async getUserOrders(userId: string) {
    return await this.orderModel.find({ userId }).sort({ createdAt: -1 }).exec();
  }

  async getAllOrdersForAdmin() {
    return await this.orderModel.find()
      .populate('userId', 'nickname email')
      .sort({ createdAt: -1 })
      .exec();
  }

  async deleteOrder(orderId: string) {
    try {
      const result = await this.orderModel.findByIdAndDelete(orderId).exec();
      if (!result) throw new NotFoundException('ไม่พบรายการครับ');
      return { message: 'กวาดล้างออเดอร์สำเร็จครับกัปตัน! 🚮' };
    } catch (error) {
      await this.orderModel.deleteOne({ _id: orderId as any }).exec();
      return { message: 'ลบออเดอร์รุ่นเก่าเรียบร้อยแล้วครับ! 🚮' };
    }
  }
}