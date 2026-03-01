import { 
  IsString, IsNotEmpty, IsNumber, Min, IsBoolean, 
  IsOptional, MaxLength, IsArray, IsUrl, ValidateNested, IsObject 
} from 'class-validator';
import { Type } from 'class-transformer';

// ✅ DTO ย่อยสำหรับ "ตัวเลือกสินค้า (สี/รุ่น)" ใน variants
export class VariantDto {
  @IsString({ message: 'ชื่อสีต้องเป็นข้อความครับกัปตัน' })
  @IsNotEmpty({ message: 'กัปตันลืมระบุชื่อสีครับ' })
  color: string;

  @IsString()
  @IsOptional() // ← เปลี่ยนเป็น Optional เพื่อไม่ให้ error ถ้าไม่ส่ง colorCode
  colorCode?: string; // เช่น #FF0000 หรือ red

  @IsNumber()
  @Min(0, { message: 'สต็อกของแต่ละสีต้องไม่ติดลบครับ' })
  stock: number;
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty({ message: 'กัปตันลืมใส่ชื่อสินค้าครับ' })
  @MaxLength(100, { message: 'ชื่อสินค้าต้องไม่เกิน 100 ตัวอักษร' })
  name: string;

  @IsString()
  @IsNotEmpty({ message: 'กัปตันลืมใส่รายละเอียดสินค้าครับ' })
  @MaxLength(1000, { message: 'รายละเอียดต้องไม่เกิน 1000 ตัวอักษร' }) 
  description: string;

  @IsNumber()
  @Min(0, { message: 'ราคาต้องไม่ติดลบครับ' })
  price: number;

  @IsNumber()
  @IsOptional()
  @Min(0, { message: 'ราคาส่วนลดต้องไม่ติดลบ' })
  discountPrice?: number;

  // 🔓 รับ URL รูปภาพแบบ localhost ได้ (require_tld: false)
  @IsArray({ message: 'images ต้องส่งมาเป็น Array ของ URL ครับ' })
  @IsUrl({ require_tld: false }, { each: true, message: 'มี URL รูปภาพบางรูปไม่ถูกต้องครับ' })
  images: string[];

  @IsString()
  @IsNotEmpty({ message: 'กัปตันลืมเลือกหมวดหมู่สินค้าครับ' })
  category: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true, message: 'tags แต่ละรายการต้องเป็นข้อความ' })
  tags?: string[];

  // ✅ ตรวจสอบ Array ของ variants (สี/ตัวเลือก)
  @IsArray({ message: 'variants ต้องเป็น Array ครับ' })
  @IsOptional() // ← แนะนำให้ใส่เผื่อไว้ กรณีบางสินค้าไม่มีสีครับ
  @ValidateNested({ each: true })
  @Type(() => VariantDto)
  variants?: VariantDto[];

  // 🟢 เพิ่ม totalStock เพื่อให้รับค่าสต็อกรวมจากหน้าเว็บได้
  @IsNumber()
  @IsOptional()
  @Min(0)
  totalStock?: number;

  // 🟢 เพิ่ม stock เผื่อหน้าเว็บเผลอส่งตัวแปรชื่อ stock มา จะได้ไม่โดนเตะทิ้ง
  @IsNumber()
  @IsOptional()
  stock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean = true; 

  @IsBoolean()
  @IsOptional()
  isHot?: boolean = false; 

  @IsObject()
  @IsOptional()
  specifications?: Record<string, string>; 
}