import { Injectable } from '@nestjs/common';

@Injectable()
export class FxService {
  getHello(): string {
    return 'Hello World!';
  }
}
