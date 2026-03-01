import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  
  // 1. 🌐 CORS CONFIGURATION (เปิดประตูให้ Next.js)
  app.enableCors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://[::1]:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'X-Requested-With'],
  });
  
  // 2. 🛡️ SECURITY HELMET (ตั้งค่าให้รองรับการดึงรูปภาพข้ามโดเมน)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: "cross-origin" },
      contentSecurityPolicy: false, 
    }),
  );
  
  // 3. 🔍 GLOBAL VALIDATION & ERROR HANDLING (กรองข้อมูล & แจ้งเตือนภาษาคน)
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      transformOptions: { enableImplicitConversion: true },
      // ✅ แปลง Error ของ class-validator ให้หน้าบ้านอ่านง่าย
      exceptionFactory: (errors) => {
        const result = errors.map((error) => ({
          property: error.property,
          message: error.constraints ? Object.values(error.constraints)[0] : 'Invalid value',
        }));
        // ส่งกลับไปในรูปแบบ { message: "ลืมใส่ชื่อสินค้า | ราคาห้ามติดลบ", error: "Bad Request", statusCode: 400 }
        return new BadRequestException(result.map(r => r.message).join(' | '));
      },
    }),
  );

  // 4. 🚀 PORT & STARTUP
  const port = process.env.PORT || 4000;
  
  try {
    await app.listen(port);
    
    console.log(`
    ================================================
    🐊 [Crocbyte System] STATUS: ONLINE
    🚀 API GATEWAY: http://localhost:${port}
    📡 DATABASE:  MongoDB Atlas Connected
    🛡️ SECURITY:  Helmet & JWT Guards Active
    ✨ ERRORS:    Professional Handling Enabled
    ================================================
    `);
  } catch (err: any) {
    logger.error(`❌ Cannot start server on port ${port}: ${err.message}`);
  }
}

bootstrap();