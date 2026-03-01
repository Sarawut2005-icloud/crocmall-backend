// src/auth/dto/signup.dto.ts
import { IsEmail, IsString, IsNotEmpty, MinLength, IsDateString, Matches } from 'class-validator';

export class SignUpDto {
  @IsEmail({}, { message: 'รูปแบบอีเมลไม่ถูกต้อง' })
  @IsNotEmpty({ message: 'กรุณากรอกอีเมล' })
  email: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกรหัสผ่าน' })
  //  ด่านตรวจสำคัญ: บังคับ 8 ตัวอักษรสำหรับทุกช่องทาง
  @MinLength(8, { message: 'รหัสผ่านต้องยาวอย่างน้อย 8 ตัวอักษร' })
  password: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อจริง' })
  realName: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกชื่อเล่น' })
  nickname: string;

  @IsString()
  @IsNotEmpty({ message: 'กรุณากรอกเบอร์โทรศัพท์' })
  //  อัปเกรด: บังคับเบอร์โทรต้องเป็นตัวเลข 10 หลักเป๊ะๆ
  @Matches(/^[0-9]{10}$/, { message: 'เบอร์โทรศัพท์ต้องเป็นตัวเลข 10 หลักเท่านั้นครับ' })
  phone: string;

  @IsNotEmpty({ message: 'กรุณาระบุวันเกิด' })
  //  อัปเกรด: บังคับรูปแบบวันที่ให้ถูกต้องตามปฏิทินโลก (ป้องกันการใส่เดือน 19)
  @IsDateString({}, { message: 'วันเกิดต้องอยู่ในรูปแบบ YYYY-MM-DD ที่ถูกต้องตามปฏิทินเท่านั้นครับ (เช่น 2005-09-19)' })
  birthDate: string;
}