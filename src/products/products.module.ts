import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product, ProductSchema } from './schemas/product.schema';
import { AuthModule } from '../auth/auth.module'; // ✅ จำเป็นมากสำหรับการใช้งาน RolesGuard

@Module({
  imports: [
    // 1. เชื่อมต่อ Schema เข้ากับ Database
    MongooseModule.forFeature([
      { name: Product.name, schema: ProductSchema }
    ]),
    // 2. Import AuthModule เพื่อให้ RolesGuard และ AccessTokenGuard ทำงานได้
    AuthModule, 
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
  // 3. Export ProductsService เพื่อให้ Module อื่น (เช่น Orders) 
  // สามารถเรียกใช้ฟังก์ชัน findOne หรือ updateStock ได้ในอนาคต
  exports: [ProductsService, MongooseModule], 
})
export class ProductsModule {}