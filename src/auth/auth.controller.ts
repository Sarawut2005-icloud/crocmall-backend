// src/auth/auth.controller.ts
import { Body, Controller, Get, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthDto } from './dto/auth.dto';
import { SignUpDto } from './dto/signup.dto';
import { AccessTokenGuard } from './guards/access-token.guard';
import { RefreshTokenGuard } from './guards/refresh-token.guard';
import { Throttle } from '@nestjs/throttler';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  signup(@Body() dto: SignUpDto) {
    return this.authService.signUp(dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } }) 
  @Post('signin')
  signin(@Body() dto: AuthDto) {
    return this.authService.signIn(dto);
  }

  //  [แก้ไข] ดึงข้อมูล Profile ล่าสุดจาก Database (ทำให้ Nickname และรูปขึ้นโชว์)
  @UseGuards(AccessTokenGuard)
  @Get('profile')
  async getProfile(@Req() req: any) {
    // req.user.sub คือ userId จาก JWT
    // เราจะเรียกฟังก์ชันที่ไปดึงจาก DB จริงๆ มาส่งให้หน้าบ้าน
    return this.authService.getProfileFromDb(req.user.sub);
  }

  //  [เพิ่มใหม่] รับคำสั่งอัปเดตชื่อโปรไฟล์และ URL รูปภาพ
  @UseGuards(AccessTokenGuard)
  @Patch('profile')
  updateProfile(@Req() req: any, @Body() body: { nickname?: string; photoURL?: string }) {
    return this.authService.updateProfile(req.user.sub, body);
  }

  //  [เพิ่มใหม่] รับคำสั่งเปลี่ยนรหัสผ่าน
  @UseGuards(AccessTokenGuard)
  @Patch('change-password')
  changePassword(@Req() req: any, @Body() body: any) {
    return this.authService.changePassword(
      req.user.sub, 
      body.currentPassword, 
      body.newPassword
    );
  }

  @UseGuards(RefreshTokenGuard)
  @Post('refresh')
  refresh(@Req() req: any) {
    const { sub: userId, email, role, refreshToken } = req.user; 
    return this.authService.refreshTokens(userId, email, role, refreshToken);
  }

  @UseGuards(AccessTokenGuard)
  @Post('logout')
  logout(@Req() req: any) {
    return this.authService.logout(req.user.sub);
  }
}