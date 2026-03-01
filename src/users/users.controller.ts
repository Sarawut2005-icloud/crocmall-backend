// src/users/users.controller.ts
import {
  Controller,
  Patch,
  Param,
  Body,
  UseGuards,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UpdateRoleDto } from './dto/update-role.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  /**
   *  MASTERPIECE: ระบบเลื่อนขั้น / ลดขั้นผู้ใช้งาน (Promote/Demote Role)
   * เฉพาะ Admin เท่านั้นที่สามารถเปลี่ยน Role ของผู้อื่นได้
   */
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin') //  เฉพาะ admin เท่านั้นที่เรียก API นี้ได้
  @Patch(':id/role')
  async updateRole(
    @Param('id') id: string,
    @Body() updateRoleDto: UpdateRoleDto,
  ) {
    try {
      const updatedUser = await this.usersService.updateRole(id, updateRoleDto.role);

      // Cast type เพื่อให้ TypeScript รู้จัก timestamps (updatedAt, createdAt)
      // เพราะ Mongoose timestamps: true แต่ type ไม่ได้ reflect อัตโนมัติ
      const userResponse = updatedUser.toObject
        ? updatedUser.toObject() // ใช้ toObject() เพื่อแปลงเป็น plain object
        : (updatedUser as any); // fallback ถ้าไม่มี toObject

      return {
        success: true,
        message: `อัปเดต Role ผู้ใช้งานเรียบร้อย! ตอนนี้เป็น "${updateRoleDto.role}" 🚀`,
        data: {
          id: userResponse._id?.toString(),
          email: userResponse.email,
          nickname: userResponse.nickname,
          role: userResponse.role,
          updatedAt: userResponse.updatedAt
            ? userResponse.updatedAt.toISOString()
            : null, // แปลงเป็น string ISO เพื่อ frontend ใช้งานง่าย
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error; // ส่งต่อ 404 ถ้าไม่พบ user
      }

      // จัดการ error อื่น ๆ ให้เป็น 400 หรือ 500 ตามความเหมาะสม
      throw new BadRequestException(
        error.message || 'เกิดข้อผิดพลาดในการอัปเดต Role ครับกัปตัน!'
      );
    }
  }
}