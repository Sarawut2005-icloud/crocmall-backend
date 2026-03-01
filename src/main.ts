import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // สร้าง App โดยระบุเป็น NestExpressApplication เพื่อใช้คำสั่ง set('trust proxy')
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 0. 🛡️ TRUST PROXY (สำคัญมากสำหรับ Render/Cloud Hosting)
  // ช่วยให้ NestJS อ่าน IP ของ User ได้ถูกต้องผ่าน Proxy ของ Render
  app.set('trust proxy', 1);

  // 1. 🌐 CORS CONFIGURATION (เปิดประตูให้ Vercel เข้ามาดึงข้อมูล)
  app.enableCors({
    origin: true, // อนุญาตทุกที่ในช่วงพัฒนาและส่งงาน (หรือใส่ URL ของ Vercel กัปตันลงไป)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });

  // 2. 🛡️ SECURITY HELMET (ตั้งค่าความปลอดภัยเบื้องต้น)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, 
    }),
  );

  // 3. 📂 GLOBAL PREFIX (ทำให้ URL เป็นระบบ เช่น https://.../api/products)
  app.setGlobalPrefix('api');

  // 4. 🔍 GLOBAL VALIDATION & ERROR HANDLING (กรองข้อมูลและจัดการ Error)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints ? Object.values(error.constraints)[0] : 'Invalid value',
        }));
        return new BadRequestException(result.map(r => r.message).join(' | '));
      },
    }),
  );

  // 5. 🚀 PORT & STARTUP
  const port = process.env.PORT || 4000;
  
  try {
    await app.listen(port);
    
    console.log(`
    ================================================
    🐊 [Crocbyte System] STATUS: ONLINE
    🚀 API URL: https://crocmall-backend.onrender.com/api
    📡 DATABASE: MongoDB Atlas Connected
    🛡️ SECURITY: Helmet & JWT Guards Active
    ✨ ERRORS: Professional Handling Enabled
    ================================================
    `);
  } catch (err: any) {
    logger.error(`❌ Cannot start server on port ${port}: ${err.message}`);
  }
}

bootstrap();