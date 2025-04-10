import { Controller, Get } from '@nestjs/common';
import { FxService } from './fx.service';

@Controller()
export class FxController {
  constructor(private readonly fxService: FxService) {}

  @Get()
  getHello(): string {
    return this.fxService.getHello();
  }
}
