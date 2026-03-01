import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name) private productModel: Model<ProductDocument>,
  ) {}

  /**
   * 🦈 สร้างสินค้าใหม่
   */
  async create(createProductDto: CreateProductDto): Promise<Product> {
    const newProduct = new this.productModel(createProductDto);
    return await newProduct.save();
  }

  /**
   * 🔍 ดึงสินค้าทั้งหมด (Filter ตาม isActive และ Category)
   */
  async findAll(showAll = false, category?: string): Promise<Product[]> {
    const filter: any = showAll ? {} : { isActive: true };
    if (category) {
      filter.category = category;
    }
    return await this.productModel.find(filter).sort({ createdAt: -1 }).exec();
  }

  /**
   * 🔥 ดึงสินค้าแนะนำ (Hot Items)
   */
  async findHot(): Promise<Product[]> {
    return await this.productModel
      .find({ isHot: true, isActive: true })
      .limit(10)
      .exec();
  }

  /**
   * 🆔 ดึงข้อมูลสินค้าชิ้นเดียว
   */
  async findOne(id: string): Promise<ProductDocument> {
    const product = await this.productModel.findById(id).exec();
    if (!product) {
      throw new NotFoundException(`ไม่พบสินค้า ID: ${id} ครับกัปตัน! 🐊`);
    }
    return product;
  }

  /**
   * 📝 อัปเดตข้อมูลสินค้า
   */
  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const updatedProduct = await this.productModel
      .findByIdAndUpdate(
        id,
        { $set: updateProductDto },
        { new: true, runValidators: true },
      )
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException(`ไม่พบสินค้า ID: ${id} เพื่ออัปเดต`);
    }
    return updatedProduct;
  }

  /**
   * 🗑️ ลบสินค้า
   */
  async remove(id: string) {
    const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();
    if (!deletedProduct) {
      throw new NotFoundException(`ไม่พบสินค้า ID: ${id} เพื่อลบ`);
    }
    return { message: 'ลบสินค้าเรียบร้อยแล้วครับกัปตัน! 🦈' };
  }

  /**
   * 📉 MASTERPIECE: ระบบลดสต็อก (Decrease Stock)
   * ใช้เมื่อมีการสั่งซื้อสินค้า
   */
  async decreaseStock(id: string, quantity: number, color?: string) {
    const product = await this.findOne(id);

    // กรณีสินค้ามี Variants (แยกตามสี)
    if (color && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.color === color);
      
      if (!variant) {
        throw new BadRequestException(`สินค้าสี ${color} ไม่มีในระบบครับ`);
      }
      if (variant.stock < quantity) {
        throw new BadRequestException(`สี ${color} สต็อกไม่พอ (เหลือ ${variant.stock} ชิ้น)`);
      }

      variant.stock -= quantity;
      
      // ✅ บอก Mongoose ให้รู้ว่า Array มีการเปลี่ยนแปลง
      product.markModified('variants');
    } 
    // กรณีสินค้าทั่วไป (ไม่มี Variants)
    else {
      if (product.totalStock < quantity) {
        throw new BadRequestException(`${product.name} สต็อกไม่พอ (เหลือ ${product.totalStock} ชิ้น)`);
      }
      product.totalStock -= quantity;
    }

    // .save() จะไปกระตุ้น Middleware ใน Schema เพื่อคำนวณ totalStock ใหม่
    return await product.save();
  }

  /**
   * 📈 MASTERPIECE: ระบบคืนสต็อก (Increase Stock)
   * ใช้เมื่อออเดอร์ถูกยกเลิก (Cancelled)
   */
  async increaseStock(id: string, quantity: number, color?: string) {
    const product = await this.findOne(id);

    if (color && product.variants && product.variants.length > 0) {
      const variant = product.variants.find((v) => v.color === color);
      
      if (variant) {
        variant.stock += quantity;
      } else {
        // กรณีสีที่เคยซื้อโดนแอดมินลบไปแล้ว ให้คืนเข้าสต็อกรวมเพื่อไม่ให้ของหาย
        product.totalStock += quantity;
      }
      
      // ✅ บอก Mongoose ให้รู้ว่า Array มีการเปลี่ยนแปลง
      product.markModified('variants');
    } else {
      product.totalStock += quantity;
    }

    return await product.save();
  }
}