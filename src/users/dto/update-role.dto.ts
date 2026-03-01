// src/users/dto/update-role.dto.ts
import { IsEnum } from 'class-validator';
import * as UserSchema from '../schemas/user.schema'; // ← เปลี่ยนเป็น namespace import

export class UpdateRoleDto {
  @IsEnum(UserSchema.UserRole, { // ← ใช้ UserSchema.UserRole เพื่อให้เป็น value (runtime)
    message: 'role ต้องเป็น user หรือ admin เท่านั้น',
  })
  role: UserSchema.UserRole; // ← type ใช้ UserSchema.UserRole ด้วย
}