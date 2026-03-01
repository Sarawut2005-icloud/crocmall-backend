import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

@Injectable()
export class CartService {
  constructor(
    //  1. Inject Product Model เข้ามาเพื่อใช้ตัดสต็อก
    // ตรวจสอบชื่อ 'Product' ให้ตรงกับที่กัปตันตั้งใน ProductModule นะครับ
    @InjectModel('Product') private readonly productModel: Model<any>,
    
    //  2. ถ้ากัปตันมี Cart Schema แล้ว ให้ปลดคอมเมนต์ด้านล่างนี้
    // @InjectModel('Cart') private readonly cartModel: Model<any> 
  ) {}

  //  ฟังก์ชันหลักที่หน้าบ้านเรียกใช้ (axios.post /cart/add)
  async addToCart(userId: string, productId: string, quantity: number) {
    console.log(`[CrocMall Log] User: ${userId} กำลังสั่งซื้อ Product: ${productId} จำนวน ${quantity}`);

    // ---  STEP 1: ตรวจสอบสินค้าใน MongoDB Atlas ---
    const product = await this.productModel.findById(productId);
    
    if (!product) {
      throw new NotFoundException('ไม่พบสินค้าตัวนี้ในระบบครับกัปตัน! ❌');
    }

    if (product.stock < quantity) {
      throw new BadRequestException(`สินค้าไม่พอ! เหลือแค่ ${product.stock} ชิ้นเท่านั้นครับ 🐊`);
    }

    // ---  STEP 2: ตัดสต็อกจริงใน MongoDB Atlas ---
    // ใช้ $inc: -quantity เพื่อลดค่าใน Database ทันที
    const updatedProduct = await this.productModel.findByIdAndUpdate(
      productId,
      { $inc: { stock: -quantity } },
      { new: true } // ให้ return ค่าที่อัปเดตแล้วกลับมา
    );

    // ---  STEP 3: บันทึกลงตะกร้า (Logic ของกัปตัน) ---
    // ตรงนี้ถ้ากัปตันมี Cart Model ให้เขียนคำสั่ง save ลง cartModel ต่อได้เลยครับ
    // ตัวอย่าง: await this.cartModel.create({ userId, productId, quantity });

    return {
      status: 'success',
      message: 'ตัดสต็อกใน Database และเพิ่มลงตะกร้าเรียบร้อย!',
      remainingStock: updatedProduct.stock, // ส่งค่าสต็อกล่าสุดกลับไปให้หน้าบ้านโชว์ด้วย
      data: { userId, productId, quantity }
    };
  }

  //  CRUD มาตรฐาน (ปรับเป็น string ID)
  create(createCartDto: CreateCartDto) {
    return 'This action adds a new cart to Atlas';
  }

  findAll() {
    return `This action returns all cart items from Atlas`;
  }

  findOne(id: string) {
    return `This action returns a #${id} cart`;
  }

  update(id: string, updateCartDto: UpdateCartDto) {
    return `This action updates a #${id} cart`;
  }

  remove(id: string) {
    return `This action removes a #${id} cart`;
  }
}