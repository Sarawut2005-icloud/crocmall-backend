// src/auth/strategies/jwt.strategy.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

//  กำหนด Interface สำหรับ Payload (แก้ Error: Cannot find name 'JwtPayload')
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private configService: ConfigService) {
    // ดึงค่า Secret Key มาเตรียมไว้ก่อน
    const secret = configService.get<string>('JWT_ACCESS_SECRET');

    super({
      // 1. ดึง Token จาก Header: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      // 2. ใช้ Secret Key (เติม ! เพื่อยืนยันว่าไม่เป็น undefined แน่นอน)
      secretOrKey: secret!, 
    });
  }

  //  ฟังก์ชันตรวจสอบและส่งข้อมูลกลับไปที่ req.user
  async validate(payload: JwtPayload) {
    // ตรวจสอบเบื้องต้นว่า Payload มีข้อมูลสำคัญครบไหม
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('กัปตันครับ Token นี้ข้อมูลไม่ครบถ้วน!');
    }

    //  ข้อมูลที่ return ตรงนี้จะไปโผล่ใน req.user ของทุก Controller ที่ใช้ Guard
    // เราส่ง sub กลับไปเพื่อให้โค้ด req.user.sub ทำงานได้ปกติครับ
    return { 
      sub: payload.sub, 
      email: payload.email, 
      role: payload.role 
    };
  }
}