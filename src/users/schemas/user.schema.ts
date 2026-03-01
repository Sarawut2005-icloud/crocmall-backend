// src/users/schemas/user.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// เปลี่ยนจาก type เป็น enum จริง ๆ (export เพื่อให้ DTO ใช้ได้)
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  // ถ้าจะเพิ่มในอนาคต เช่น MODERATOR = 'moderator', VIP = 'vip' ก็ใส่ตรงนี้ได้เลย
}

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true, lowercase: true, trim: true, index: true })
  email: string;

  // ไม่ส่ง Hash กลับไปเวลา Query ปกติ (select: false) เพื่อความปลอดภัย
  @Prop({ required: true, select: false })
  passwordHash: string;

  @Prop({ type: String, enum: UserRole, default: UserRole.USER })
  role: UserRole;

  @Prop({ type: String, select: false, default: null })
  refreshTokenHash?: string | null;

  // ข้อมูลพื้นฐานจากหน้า Register
  @Prop({ required: true, trim: true })
  realName: string;

  @Prop({ required: true, trim: true })
  nickname: string;

  @Prop({ required: true, trim: true })
  phone: string;

  @Prop({ required: true })
  birthDate: string;

  // ฟิลด์รองรับรูปโปรไฟล์
  @Prop({ default: '' })
  photoURL: string;

  // ฟิลด์ระดับ VIP (ตรงกับ UI Profile)
  @Prop({ default: 0 })
  vipLevel: number;
}

export const UserSchema = SchemaFactory.createForClass(User);