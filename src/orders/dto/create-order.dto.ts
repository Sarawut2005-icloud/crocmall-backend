import { 
  IsArray, ValidateNested, IsNotEmpty, IsNumber, 
  Min, IsString, IsOptional, IsUrl, Matches 
} from 'class-validator';
import { Type, Transform } from 'class-transformer';

//  1. DTO ย่อยสำหรับแต่ละรายการสินค้าในตะกร้า (รองรับการสั่งหลายชิ้นพร้อมกัน)
class OrderItemDto {
  @IsString()
  @IsNotEmpty({ message: 'กัปตันครับ ลืมระบุ Product ID ครับ' })
  productId: string;

  @IsString()
  @IsNotEmpty({ message: 'กัปตันครับ ต้องระบุ "สี" ที่เลือกซื้อด้วยครับ' })
  color: string; //  สำคัญมาก: เพื่อไปหักสต็อกใน Variants ให้ถูกจุด

  @IsNumber()
  @Min(1, { message: 'จำนวนสินค้าต้องอย่างน้อย 1 ชิ้นครับ' })
  quantity: number;

  @IsOptional()
  @IsUrl({ require_tld: false }, { message: 'URL รูปภาพสินค้าไม่ถูกต้อง' })
  imageUrl?: string;
}

//  2. DTO หลักสำหรับสร้างออเดอร์ (Create Order)
export class CreateOrderDto {
  @IsArray({ message: 'รายการสินค้าต้องส่งมาเป็น Array ครับ' })
  @IsNotEmpty({ message: 'ตะกร้าว่างเปล่าครับกัปตัน ใส่ของก่อนเช็คเอาท์นะ!' })
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @IsString()
  @IsNotEmpty({ message: 'กัปตันครับ ลืมกรอกที่อยู่จัดส่งครับ!' })
  shippingAddress: string;

  @IsString()
  @IsOptional()
  receiverName?: string; 

  @IsString()
  @IsNotEmpty({ message: 'กัปตันต้องระบุเบอร์โทรผู้รับด้วยครับ' })
  @Transform(({ value }) => value?.trim()) 
  @Matches(/^0[1-9][0-9]{7,8}$/, { 
    message: 'เบอร์โทรศัพท์ไม่ถูกต้อง ต้องเป็นเบอร์ไทย 9-10 หลัก ขึ้นต้นด้วย 0'
  })
  phone: string;

  @IsString()
  @IsNotEmpty({ message: 'กัปตันลืมเลือกวิธีชำระเงินครับ' })
  paymentMethod: string; // 'QR Code', 'C.O.D', 'Installment'

  //  เพิ่ม: รองรับระบบโค้ดส่วนลด (Promo Code)
  @IsString()
  @IsOptional()
  @Transform(({ value }) => value?.toUpperCase().trim()) // ปรับเป็นตัวพิมพ์ใหญ่ให้อัตโนมัติ
  promoCode?: string;

  //  เพิ่ม: ยอดรวมราคาสินค้าทั้งหมดก่อนหักส่วนลด (ส่งจากหน้าบ้านมาเพื่อตรวจสอบเบื้องต้น)
  @IsNumber()
  @IsNotEmpty({ message: 'ราคาทั้งหมดต้องส่งมาด้วยครับ' })
  @Min(0)
  totalPrice: number;
}