import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Order, OrderSchema } from './schemas/order.schema';
import { ProductsModule } from '../products/products.module'; //  สำหรับตัดสต็อก
import { AuthModule } from '../auth/auth.module';         //  สำหรับระบบ Guard & Roles

@Module({
  imports: [
    // 1. เชื่อมต่อ Schema ของ Order เข้ากับฐานข้อมูล
    MongooseModule.forFeature([
      { name: Order.name, schema: OrderSchema }
    ]),
    
    // 2. ดึง ProductsModule มาเพื่อให้ OrdersService เรียกใช้ decreaseStock() ได้
    ProductsModule, 
    
    // 3. ดึง AuthModule มาเพื่อให้ Controller ใช้งาน @UseGuards() ได้อย่างสมบูรณ์
    AuthModule, 
  ],
  controllers: [OrdersController],
  providers: [OrdersService],
  // 4. Export OrdersService เผื่อในอนาคตต้องการให้ Module อื่นดึงข้อมูลการซื้อไปวิเคราะห์ (Analytics)
  exports: [OrdersService],
})
export class OrdersModule {}