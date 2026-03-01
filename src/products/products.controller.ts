import { 
  Controller, Get, Post, Body, Patch, Param, Delete, 
  UseGuards, Query 
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AccessTokenGuard } from '../auth/guards/access-token.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ----------------------------------------------------
  // 🌐 PUBLIC ROUTES (ลูกค้าทุกคนเข้าถึงได้)
  // ----------------------------------------------------

  @Get()
  async findAll(@Query('category') category?: string) {
    // ดึงสินค้าที่ Active เท่านั้น และสามารถกรองตามหมวดหมู่ได้
    return this.productsService.findAll(false, category);
  }

  @Get('hot')
  async findHotProducts() {
    // ดึงเฉพาะสินค้าแนะนำ (isHot: true) ไปโชว์หน้าแรก
    return this.productsService.findHot();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // ----------------------------------------------------
  // 🛡️ ADMIN ONLY ROUTES (ต้องล็อกอิน + ต้องเป็น Admin)
  // ----------------------------------------------------

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/dashboard/all')
  async findAllForAdmin() {
    // Admin ดูได้ทั้งหมด รวมถึงของที่ปิดการขาย (isActive: false)
    return this.productsService.findAll(true);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id') id: string, 
    @Body() updateProductDto: UpdateProductDto
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}