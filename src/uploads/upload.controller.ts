// upload.controller.ts (ฝั่ง NestJS)
import { Controller, Post, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Controller('upload')
export class UploadController {
  
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', // โฟลเดอร์ที่เก็บไฟล์
      filename: (req, file, cb) => {
        // สุ่มชื่อไฟล์ใหม่ ป้องกันชื่อซ้ำ
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        cb(null, `${uniqueSuffix}${ext}`);
      }
    }),
    fileFilter: (req, file, cb) => {
      // กรองรับเฉพาะไฟล์รูปภาพ
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
        return cb(new BadRequestException('Only image files are allowed!'), false);
      }
      cb(null, true);
    },
  }))
  uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }
    // ส่ง URL หรือ Path ของไฟล์กลับไปให้ Frontend
    return { 
      message: 'Upload success',
      // สมมติว่าตั้ง Static Serve ไว้ที่ /uploads/...
      url: `${process.env.BACKEND_URL || 'http://localhost:4000'}/uploads/${file.filename}` 
    };
  }
}