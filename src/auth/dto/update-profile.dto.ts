import { IsString, IsOptional, IsUrl, MaxLength } from 'class-validator';

export class UpdateProfileDto {
  @IsString({ message: 'ชื่อเล่นต้องเป็นตัวอักษรครับกัปตัน' })
  @IsOptional() // ยอมให้ส่งมาแค่บางอย่างได้ (เช่น เปลี่ยนแค่ชื่อ ไม่เปลี่ยนรูป)
  @MaxLength(20, { message: 'ชื่อเล่นยาวเกินไปครับ (ไม่เกิน 20 ตัวอักษร)' })
  nickname?: string;

  @IsString()
  @IsOptional()
  // @IsUrl({}, { message: 'รูปแบบ URL รูปภาพไม่ถูกต้อง' }) // เปิดใช้ถ้าต้องการบังคับว่าเป็นลิงก์จริง
  photoURL?: string;

  @IsString()
  @IsOptional()
  phone?: string;
}