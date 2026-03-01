import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartService } from './cart.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { UpdateCartDto } from './dto/update-cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; //  ตรวจสอบ Path ให้ตรงกับโปรเจกต์กัปตันนะครับ

@Controller('cart')
export class CartController {
  constructor(private readonly cartService: CartService) {}

  //  1. เพิ่มสินค้าลงตะกร้า (สำหรับหน้า Services ที่กัปตันใช้ axios.post)
  @UseGuards(JwtAuthGuard)
  @Post('add')
  async addToCart(@Request() req, @Body() body: { productId: string, quantity: number }) {
    // ดึง userId จาก Token ที่ผ่านการตรวจสอบแล้ว
    const userId = req.user.userId; 
    return this.cartService.addToCart(userId, body.productId, body.quantity);
  }

  //  2. สร้างตะกร้าใหม่ (Standard CRUD)
  @Post()
  create(@Body() createCartDto: CreateCartDto) {
    return this.cartService.create(createCartDto);
  }

  //  3. ดูตะกร้าทั้งหมด (แอดมิน)
  @Get()
  findAll() {
    return this.cartService.findAll();
  }

  //  4. ดูตะกร้าของตัวเอง (แนะนำให้ใช้ @UseGuards และดึงจาก Token แทนส่ง :id ตรงๆ)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.cartService.findOne(id);
  }

  //  5. อัปเดตสินค้าในตะกร้า
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateCartDto: UpdateCartDto) {
    return this.cartService.update(id, updateCartDto);
  }

  //  6. ลบสินค้าหรือเคลียร์ตะกร้า
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.cartService.remove(id);
  }
}