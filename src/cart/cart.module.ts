import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CartService } from './cart.service';
import { CartController } from './cart.controller';
import { ProductSchema } from '../products/schemas/product.schema'; //  ตรวจสอบ Path ของ Schema สินค้ากัปตันด้วยนะครับ
import { AuthModule } from '../auth/auth.module'; // นำเข้าเพื่อใช้งาน JwtAuthGuard

@Module({
  imports: [
    // 1.  เชื่อมต่อกับคอลเลกชัน Products เพื่อให้ CartService สั่งหักสต็อกได้
    MongooseModule.forFeature([
      { name: 'Product', schema: ProductSchema }
    ]),
    
    // 2.  นำเข้า AuthModule เพื่อให้ CartController รู้จัก JwtAuthGuard
    AuthModule, 
  ],
  controllers: [CartController],
  providers: [CartService],
})
export class CartModule {}