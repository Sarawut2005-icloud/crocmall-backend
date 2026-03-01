import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Schema as MongooseSchema } from 'mongoose';

export type ProductDocument = HydratedDocument<Product>;

// ✅ 1. Sub-Schema สำหรับตัวเลือกสินค้า (Variants - สีและสต็อกแยกกัน)
@Schema({ _id: false })
export class ProductVariant {
  @Prop({ type: String, required: true })
  color: string;

  @Prop({ type: String, default: '' })
  colorCode: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  stock: number;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ type: String, required: true, trim: true, index: true })
  name: string;

  @Prop({ type: String, required: true, trim: true })
  description: string;

  @Prop({ type: Number, required: true, min: 0 })
  price: number;

  @Prop({ type: Number, default: null })
  discountPrice: number | null;

  @Prop({ type: [String], required: true })
  images: string[];

  // ✅ Category ปล่อยเป็น String ไว้ถูกแล้วครับ เดี๋ยวหน้าบ้านเราจะดึงค่าที่ไม่ซ้ำกันมาทำเป็น Dynamic Category เอง
  @Prop({ type: String, required: true, default: 'Uncategorized' })
  category: string;

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ type: [ProductVariant], default: [] })
  variants: ProductVariant[];

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  totalStock: number;

  @Prop({ type: Boolean, default: true })
  isActive: boolean;

  @Prop({ type: Boolean, default: false })
  isHot: boolean;

  @Prop({ type: MongooseSchema.Types.Mixed, default: {} })
  specifications: Record<string, string>;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

/**
 * 🦈 4. Masterpiece Middleware (Modern Async Hooks)
 */

// 🟢 Hook 1: ทำงานตอน "สร้างสินค้าใหม่" (Create)
ProductSchema.pre('save', async function (this: ProductDocument) {
  if (this.variants && this.variants.length > 0) {
    this.totalStock = this.variants.reduce((sum, v) => sum + (v.stock || 0), 0);
  } else {
    this.totalStock = this.totalStock || 0;
  }
});

// 🟢 Hook 2: ทำงานตอน "แก้ไขสินค้า" (Update) - สำคัญมาก! ป้องกันสต็อกไม่ตรงเวลาแก้
ProductSchema.pre('findOneAndUpdate', async function () {
  const update: any = this.getUpdate();
  
  // เช็คว่ามีการส่ง variants มาอัปเดตไหม
  if (update && update.variants) {
    // คำนวณสต็อกใหม่
    const calculatedTotalStock = update.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0);
    
    // ยัด totalStock เข้าไปในคำสั่งอัปเดต
    if (update.$set) {
      update.$set.totalStock = calculatedTotalStock;
    } else {
      update.totalStock = calculatedTotalStock;
    }
  }
});