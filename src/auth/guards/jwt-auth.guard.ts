import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
//  ต้องมีคำว่า export class แบบนี้เท่านั้น ห้ามมี default
export class JwtAuthGuard extends AuthGuard('jwt') {}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: 'secretKey', //  ต้องตรงกับที่ตั้งไว้ใน AuthModule นะครับ
    });
  }

  async validate(payload: any) {
    // ข้อมูลที่รีเทิร์นตรงนี้จะไปโผล่ใน req.user
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}