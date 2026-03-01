// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static'; //  1. Import ServeStaticModule
import { join } from 'path'; //  2. Import join จาก Node.js

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module'; 
import { CartModule } from './cart/cart.module';
import { UploadController } from './uploads/upload.controller'; //  3. Import UploadController

@Module({
  imports: [
    // 1. โหลดไฟล์ .env มาใช้งานทั่วทั้งระบบ
    ConfigModule.forRoot({ isGlobal: true }),
    
    // 2. ระบบ Rate Limiting (กันคนยิง API รัวๆ)
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]), 
    
    // 3. เชื่อมต่อ MongoDB Atlas ผ่าน MONGO_URI ใน .env
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGO_URI'),
      }),
    }),

    //  4. เปิดระบบ Serve Static Files เพื่อให้หน้าบ้านดูรูปผ่าน URL /uploads/... ได้
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', 'uploads'), // ชี้ไปที่โฟลเดอร์ uploads นอกสุด
      serveRoot: '/uploads', 
    }),

    // 5. ลงทะเบียน Module ทั้งหมดของระบบ
    UsersModule,
    AuthModule,
    ProductsModule,
    OrdersModule,
    CartModule, // <--- ต้องมีบรรทัดนี้เพื่อเปิดใช้งาน /orders
  ],
  controllers: [
    //  6. ลงทะเบียน UploadController ให้ระบบรู้จัก Route POST /upload
    UploadController,
  ],
  providers: [
    // บังคับใช้ระบบ Rate Limiting กับทุก Route
    { provide: APP_GUARD, useClass: ThrottlerGuard },
  ],
})
export class AppModule {}