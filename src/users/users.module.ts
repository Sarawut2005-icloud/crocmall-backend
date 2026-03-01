// src/users/users.module.ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersService } from './users.service';
import { UsersController } from './users.controller'; // ← เพิ่มบรรทัดนี้!
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: User.name, schema: UserSchema }])],
  controllers: [UsersController], // ตอนนี้จะไม่ error แล้ว
  providers: [UsersService],
  exports: [UsersService], // เปิดทางให้ Auth Module เรียกใช้งานได้
})
export class UsersModule {}