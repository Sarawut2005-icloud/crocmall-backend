// src/products/dto/update-product.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

/**
 * ✅ UpdateProductDto:
 * ใช้ PartialType เพื่อดึงคุณสมบัติทั้งหมดจาก CreateProductDto 
 * มาทำให้เป็น "Optional" (ใส่หรือไม่ใส่ก็ได้)
 * * ประโยชน์: เวลาเรา Patch ข้อมูล เช่น จะแก้แค่ 'ราคา' อย่างเดียว 
 * เราก็ส่งแค่ { "price": 500 } มาได้เลย โดยที่ NestJS จะไม่ด่าว่า "ข้อมูลไม่ครบ"
 */
export class UpdateProductDto extends PartialType(CreateProductDto) {}