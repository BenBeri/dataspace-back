import { Controller, Get } from '@nestjs/common';
import { Public } from '../../modules/platform/auth/decorators/public.decorator';

@Controller()
export class HealthController {
  @Get()
  @Public()
  getHealth(): string {
    return 'OK'
  }
}
