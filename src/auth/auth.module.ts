import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersModule } from '../users/users.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { RefreshStrategy } from './strategies/refresh.strategy';

@Module({
  imports: [
    UsersModule,      //  เชื่อมกับโมดูลผู้ใช้ (MongoDB Atlas)
    PassportModule,   //  ระบบจัดการพาสปอร์ต
    JwtModule.register({}), //  โหลดคอนฟิกแบบ Dynamic ผ่าน ConfigService ใน AuthService
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    JwtStrategy,      //  เครื่องตรวจ Access Token
    RefreshStrategy   //  เครื่องตรวจ Refresh Token
  ],
  // 🚩 อย่าลืม Export AuthService เพื่อให้โมดูลอื่น (เช่น Cart) เรียกใช้งานได้
  exports: [AuthService], 
})
export class AuthModule {}