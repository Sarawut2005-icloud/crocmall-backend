import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'ยินดีต้อนรับสู่ ProductByte API! ';
  }
}