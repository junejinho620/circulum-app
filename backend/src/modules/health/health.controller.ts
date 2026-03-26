import { Controller, Get } from '@nestjs/common';
import { Public } from '../../common/decorators/public.decorator';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private dataSource: DataSource) {}

  @Public()
  @Get()
  async check() {
    const dbHealthy = this.dataSource.isInitialized;

    return {
      status: dbHealthy ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbHealthy ? 'connected' : 'disconnected',
      },
    };
  }

  @Public()
  @Get('ping')
  ping() {
    return { pong: true, timestamp: Date.now() };
  }
}
