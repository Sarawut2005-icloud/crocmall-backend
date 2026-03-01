// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  findByEmail(email: string) {
    return this.userModel.findOne({ email }).exec();
  }

  // ดึงข้อมูลพร้อม Password และ Refresh Token สำหรับกระบวนการ Auth
  findByEmailWithSecrets(email: string) {
    return this.userModel.findOne({ email }).select('+passwordHash +refreshTokenHash').exec();
  }

  findByIdWithRefresh(userId: string) {
    return this.userModel.findById(userId).select('+refreshTokenHash').exec();
  }

  //  1. ดึงข้อมูล Profile ล่าสุด (ไม่เอา Password กับ Token คืนไป)
  findById(userId: string) {
    return this.userModel.findById(userId).select('-passwordHash -refreshTokenHash').exec();
  }

  //  2. ดึงข้อมูลพร้อม Password เก่า (เพื่อใช้ตรวจสอบตอนเปลี่ยนรหัสผ่าน)
  findByIdWithSecrets(userId: string) {
    return this.userModel.findById(userId).select('+passwordHash').exec();
  }

  //  3. ฟังก์ชันอัปเดต Profile (รูปและชื่อเล่น)
  async updateProfile(userId: string, updateData: { nickname?: string; photoURL?: string }) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: updateData },
      { new: true } // ให้คืนค่าข้อมูลใหม่ที่อัปเดตแล้ว
    ).select('-passwordHash -refreshTokenHash').exec();

    if (!updatedUser) {
      throw new NotFoundException('ไม่พบผู้ใช้งานในระบบ');
    }
    return updatedUser;
  }

  //  4. ฟังก์ชันอัปเดตรหัสผ่านใหม่
  async updatePassword(userId: string, newPasswordHash: string) {
    return this.userModel.updateOne(
      { _id: userId },
      { $set: { passwordHash: newPasswordHash } }
    ).exec();
  }

  //  [เพิ่มใหม่] 5. ฟังก์ชันอัปเดตสิทธิ์ผู้ใช้งาน (เปลี่ยนเป็น Admin)
  async updateRole(userId: string, newRole: string) {
    const updatedUser = await this.userModel.findByIdAndUpdate(
      userId,
      { $set: { role: newRole } },
      { new: true }
    ).select('-passwordHash -refreshTokenHash').exec();

    if (!updatedUser) {
      throw new NotFoundException('ไม่พบผู้ใช้งานคนนี้ในระบบครับกัปตัน!');
    }
    return updatedUser;
  }

  //  ฟังก์ชันสร้าง User ใหม่
  async create(data: { 
    email: string; 
    passwordHash: string; 
    role?: UserRole;
    realName: string;   // ชื่อจริง
    nickname: string;   // ชื่อเล่น
    phone: string;      // เบอร์โทร
    birthDate: string;  // วันเกิด
  }) {
    const newUser = new this.userModel({
      email: data.email,
      passwordHash: data.passwordHash,
      role: data.role ?? 'user',
      realName: data.realName,
      nickname: data.nickname,
      phone: data.phone,
      birthDate: data.birthDate,
    });
    return await newUser.save();
  }

  // เก็บ Refresh Token Hash สำหรับระบบ Stay Logged In
  setRefreshTokenHash(userId: string, refreshTokenHash: string | null) {
    return this.userModel.updateOne({ _id: userId }, { refreshTokenHash }).exec();
  }
}