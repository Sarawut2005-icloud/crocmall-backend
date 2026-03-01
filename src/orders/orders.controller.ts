import { 
  Controller, Post, Get, Body, Req, UseGuards, 
  Patch, Param, Delete, Query, BadRequestException 
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CreateOrderDto } from './dto/create-order.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  // ==========================================
  //  โซนของลูกค้า (CUSTOMER ROUTES)
  // ==========================================

  //  1. สร้างออเดอร์ใหม่ (Customer เท่านั้น)
  @UseGuards(AccessTokenGuard)
  @Post()
  async create(@Body() createOrderDto: CreateOrderDto, @Req() req: any) { 
    console.log('=== Received POST /orders ===');
    console.log('Payload from frontend (createOrderDto):', JSON.stringify(createOrderDto, null, 2));
    console.log('User info from token (req.user):', JSON.stringify(req.user, null, 2));

    const userId = req.user.sub || req.user.userId || req.user.id;
    const userEmail = req.user.email;

    if (!userId) {
      console.error('No userId found in token');
      throw new BadRequestException('ไม่พบข้อมูลผู้ใช้ใน token ครับ (userId ไม่มี)');
    }

    if (!userEmail) {
      console.warn('No email found in token, using fallback if needed');
    }

    return this.ordersService.createOrder(userId, userEmail, createOrderDto);
  }

  //  2. ลูกค้าดูประวัติออเดอร์ของตัวเอง
  @UseGuards(AccessTokenGuard)
  @Get('my-orders')
  async findMyOrders(@Req() req: any) {
    const userId = req.user.sub || req.user.userId || req.user.id;
    return this.ordersService.getUserOrders(userId);
  }

  //  3. ลูกค้ายกเลิกออเดอร์ตัวเอง ( เพิ่มให้แล้ว: ไม่ติด Guards ของ Admin)
  @UseGuards(AccessTokenGuard)
  @Patch(':id/cancel')
  async cancelMyOrder(@Param('id') id: string) {
    return this.ordersService.updateOrderStatus(id, 'Cancelled', 'ลูกค้ายกเลิกออเดอร์เองจากหน้าเว็บครับกัปตัน');
  }


  // ==========================================
  //  โซนของแอดมิน (ADMIN ROUTES)
  // ==========================================

  //  4. แอดมินดูออเดอร์ทั้งหมด
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get('all')
  async findAllOrders() {
    return this.ordersService.getAllOrdersForAdmin();
  }

  //  5. อัปเดตสถานะพัสดุ + ใส่ Note (Admin Only)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string, 
    @Body('status') status: string,
    @Body('note') note?: string
  ) {
    return this.ordersService.updateOrderStatus(id, status, note);
  }

  //  6. ลบออเดอร์ (Admin Only)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.ordersService.deleteOrder(id);
  }
}