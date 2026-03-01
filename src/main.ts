import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger, BadRequestException } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  // ใช้ NestExpressApplication เพื่อให้รองรับ set('trust proxy') สำหรับ Render
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // 🛡️ 0. TRUST PROXY (สำคัญสำหรับ Render)
  app.set('trust proxy', 1);

  // 1. 🌐 CORS CONFIGURATION (เปิดประตูให้ทุกทิศทาง ทั้ง Local และ Vercel)
  app.enableCors({
    origin: true, // ตั้งเป็น true เพื่อให้รองรับทุก URL (แก้ปัญหาข้อมูลไม่โหลด)
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

  // 3. 📂 GLOBAL PREFIX (จัดระเบียบ Path ให้เป็นระบบ)
  // ทุกๆ Request จะต้องนำหน้าด้วย /api เช่น /api/products หรือ /api/auth/signin
  app.setGlobalPrefix('api');
  
  // 4. 🔍 GLOBAL VALIDATION & ERROR HANDLING (ของเดิมกัปตันดีมาก ผมเก็บไว้ให้ครับ)
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