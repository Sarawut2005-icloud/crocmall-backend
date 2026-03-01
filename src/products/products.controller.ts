import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
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

  // =====================================================
  // 🌐 PUBLIC ROUTES (ลูกค้าทุกคนเข้าถึงได้)
  // =====================================================

  // ดึงสินค้าที่ Active เท่านั้น และสามารถกรองตามหมวดหมู่ได้
  @Get()
  async findAll(@Query('category') category?: string) {
    return this.productsService.findAll(false, category);
  }

  // ดึงเฉพาะสินค้าแนะนำ (isHot: true) ไปโชว์หน้าแรก
  @Get('hot')
  async findHotProducts() {
    return this.productsService.findHot();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // =====================================================
  // 🛡️ ADMIN ONLY ROUTES (ต้องล็อกอิน + ต้องเป็น Admin)
  // =====================================================

  // สร้างสินค้า
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Post()
  async create(@Body() createProductDto: CreateProductDto) {
    return this.productsService.create(createProductDto);
  }

  // Admin ดูได้ทั้งหมด รวมถึงของที่ปิดการขาย (isActive: false)
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Get('admin/dashboard/all')
  async findAllForAdmin() {
    return this.productsService.findAll(true);
  }

  // แก้ไขสินค้า
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // ลบสินค้า
  @UseGuards(AccessTokenGuard, RolesGuard)
  @Roles('admin')
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}