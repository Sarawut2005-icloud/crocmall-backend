import { BadRequestException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { AuthDto } from './dto/auth.dto';
import { SignUpDto } from './dto/signup.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import * as argon2 from 'argon2';
import { ConfigService } from '@nestjs/config';
import { UserRole } from '../users/schemas/user.schema'; //  1. เพิ่ม Import สำหรับ UserRole ตรงนี้ครับ

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  /**
   *  ฟังก์ชันสร้าง Access & Refresh Tokens
   * แก้ไข Error TS2769 โดยการ Casting Type และใช้ค่า Fallback ที่แน่นอน
   */
  private async signTokens(user: { id: string; email: string; role: string }) {
    const accessSecret = this.config.getOrThrow<string>('JWT_ACCESS_SECRET');
    const refreshSecret = this.config.getOrThrow<string>('JWT_REFRESH_SECRET');
    
    //  ดึงค่ามาเป็น string และป้องกันค่า undefined ด้วยการใส่ Fallback ทันที
    const accessExp = this.config.get<string>('JWT_ACCESS_EXPIRATION') || '15m';
    const refreshExp = this.config.get<string>('JWT_REFRESH_EXPIRATION') || '7d';

    const payload = { sub: user.id, email: user.email, role: user.role };

    //  ใช้ "as any" ในจุดที่ TypeScript Overload สับสน เพื่อให้ผ่านการ Compile
    const [access_token, refresh_token] = await Promise.all([
      this.jwtService.signAsync(payload, { 
        secret: accessSecret, 
        expiresIn: accessExp as any 
      }),
      this.jwtService.signAsync(payload, { 
        secret: refreshSecret, 
        expiresIn: refreshExp as any 
      }),
    ]);

    return { access_token, refresh_token };
  }

  /**
   *  ฟังก์ชันบันทึก Refresh Token แบบ Hash
   */
  private async storeRefreshHash(userId: string, refreshToken: string) {
    const hash = await argon2.hash(refreshToken);
    await this.usersService.setRefreshTokenHash(userId, hash);
  }

  /**
   *  สมัครสมาชิก
   */
  async signUp(dto: SignUpDto) {
    const email = dto.email.trim().toLowerCase();
    
    const userExists = await this.usersService.findByEmail(email);
    if (userExists) throw new BadRequestException('Email นี้ถูกใช้งานแล้วครับกัปตัน! 🐊');

    const passwordHash = await argon2.hash(dto.password);

    const newUser = await this.usersService.create({
      ...dto,
      email,
      passwordHash,
      role: 'user' as UserRole, //  2. แก้ปัญหา Type Mismatch ตรงนี้ครับ
    });

    const tokens = await this.signTokens({ 
      id: String(newUser._id), 
      email: newUser.email, 
      role: newUser.role 
    });
    
    await this.storeRefreshHash(String(newUser._id), tokens.refresh_token);
    return tokens;
  }

  /**
   *  เข้าสู่ระบบ
   */
  async signIn(dto: AuthDto) {
    const email = dto.email.trim().toLowerCase();
    const user = await this.usersService.findByEmailWithSecrets(email);
    
    if (!user) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const passwordMatches = await argon2.verify(user.passwordHash, dto.password);
    if (!passwordMatches) throw new UnauthorizedException('อีเมลหรือรหัสผ่านไม่ถูกต้อง');

    const tokens = await this.signTokens({ 
      id: String(user._id), 
      email: user.email, 
      role: user.role 
    });
    
    await this.storeRefreshHash(String(user._id), tokens.refresh_token);
    return tokens;
  }

  /**
   *  Refresh Token: ต่ออายุตั๋ว
   */
  async refreshTokens(userId: string, email: string, role: string, refreshToken: string) {
    if (!refreshToken) throw new ForbiddenException('Access denied');
    
    const user = await this.usersService.findByIdWithRefresh(userId);
    if (!user || !user.refreshTokenHash) throw new ForbiddenException('Access denied');

    const matches = await argon2.verify(user.refreshTokenHash, refreshToken);
    if (!matches) throw new ForbiddenException('Access denied');

    const tokens = await this.signTokens({ id: userId, email, role });
    await this.storeRefreshHash(userId, tokens.refresh_token);
    return tokens;
  }

  /**
   *  ออกจากระบบ
   */
  async logout(userId: string) {
    await this.usersService.setRefreshTokenHash(userId, null);
    return { success: true, message: 'Logged out successfully! See you again Captain! 🐊' };
  }

  // ====================================================================
  //  PROFILE & SECURITY SECTION
  // ====================================================================

  async getProfileFromDb(userId: string) {
    const user = await this.usersService.findById(userId);
    if (!user) throw new UnauthorizedException('ไม่พบข้อมูลผู้ใช้ในระบบ');
    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    return this.usersService.updateProfile(userId, dto);
  }

  async changePassword(userId: string, currentPass: string, newPass: string) {
    const user = await this.usersService.findByIdWithSecrets(userId);
    if (!user) throw new UnauthorizedException('ไม่พบผู้ใช้งาน');

    const isMatch = await argon2.verify(user.passwordHash, currentPass);
    if (!isMatch) {
      throw new BadRequestException('รหัสผ่านเดิมไม่ถูกต้องครับกัปตัน!');
    }

    const newHash = await argon2.hash(newPass);
    await this.usersService.updatePassword(userId, newHash);
    
    return { success: true, message: 'เปลี่ยนรหัสผ่านสำเร็จเรียบร้อยแล้ว!' };
  }
}