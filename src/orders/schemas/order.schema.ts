import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OrderDocument = HydratedDocument<Order>;

@Schema({ _id: false })
class OrderItem {
  @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
  productId: Types.ObjectId;

  @Prop({ required: true })
  productName: string;

  @Prop()
  imageUrl: string;

  @Prop({ required: true })
  color: string;

  @Prop({ required: true, min: 1 })
  quantity: number;

  @Prop({ required: true, min: 0 })
  priceAtPurchase: number;
}

@Schema({ _id: false })
class OrderHistory {
  @Prop({ default: 'Pending' })
  status: string;

  @Prop({ default: Date.now })
  updatedAt: Date;

  @Prop()
  note: string;
}

@Schema({ timestamps: true })
export class Order {
  //  Order Number อัตโนมัติ (เช่น ORD-20260301-5678)
  @Prop({ unique: true, index: true })
  orderNumber: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
  userId: Types.ObjectId;

  @Prop({ required: true })
  userEmail: string;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop({ 
    type: String, 
    required: [true, 'กัปตันต้องระบุเบอร์โทรผู้รับด้วยครับ!'],
    trim: true,
    match: [
      /^0[1-9][0-9]{8}$|^0[1-9][0-9]{7}$/, 
      'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องขึ้นต้นด้วย 0 และมี 9-10 หลักเท่านั้น'
    ]
  })
  phone: string;

  @Prop({ index: true })
  trackingNumber: string;

  @Prop({ required: true })
  paymentMethod: string;

  //  รองรับสินค้าหลายชิ้น (ตะกร้าสินค้า)
  @Prop({ type: [OrderItem], required: true })
  items: OrderItem[];

  //  สรุปยอดเงิน
  @Prop({ required: true, min: 0 })
  totalPrice: number; // ราคารวมก่อนหักส่วนลด

  //  ระบบโค้ดส่วนลด (Promo Code) 
  @Prop()
  promoCode?: string;

  @Prop({ default: 0, min: 0 })
  discountAmount: number;

  @Prop({ required: true, min: 0 })
  netPrice: number; //  ยอดชำระสุทธิที่ต้องจ่ายจริง

  //  แก้ไขแล้ว: เพิ่ม 'Paid' และ 'Refunded' เข้าไปใน Enum ครับ!
  @Prop({ 
    default: 'Pending', 
    enum: ['Pending', 'Paid', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Completed', 'Refunded'],
    index: true 
  })
  status: string;

  @Prop({ type: [OrderHistory], default: [] })
  history: OrderHistory[];

  @Prop()
  paymentProofUrl?: string;
}

export const OrderSchema = SchemaFactory.createForClass(Order);

/**
 *  Masterpiece Middleware:
 * 1. สร้าง Order Number
 * 2. คำนวณ netPrice อัตโนมัติ (totalPrice - discountAmount)
 * 3. บันทึกประวัติสถานะ
 */
OrderSchema.pre('save', async function (this: OrderDocument) {
  if (this.isNew) {
    // สร้าง orderNumber
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${date}-${random}`;

    //  คำนวณราคาสุทธิที่ฝั่ง Server เพื่อความปลอดภัย (ป้องกันการแก้ราคาจากหน้าบ้าน)
    this.netPrice = Math.max(0, this.totalPrice - (this.discountAmount || 0));

    // บันทึกประวัติสถานะเริ่มต้น
    this.history.push({
      status: this.status || 'Pending',
      updatedAt: new Date(),
      note: 'ออเดอร์ถูกสร้างเรียบร้อยแล้ว เตรียมรอรับความเทพครับกัปตัน! 🐊',
    });
  }
});