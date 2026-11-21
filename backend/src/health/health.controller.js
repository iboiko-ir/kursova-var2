import { Controller, Dependencies, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { DataSource } from 'typeorm';

const healthySchema = {
  type: 'object',
  required: ['status', 'database'],
  properties: {
    status: { type: 'string', enum: ['ok', 'error'] },
    database: { type: 'string', enum: ['up', 'down'] },
  },
};

@ApiTags('Health')
@Controller('health')
@Dependencies(DataSource)
export class HealthController {
  constructor(dataSource) {
    this.dataSource = dataSource;
  }

  @Get()
  @ApiOperation({ summary: 'Check API and database availability' })
  @ApiOkResponse({ description: 'API and database are available.', schema: healthySchema })
  @ApiServiceUnavailableResponse({ description: 'Database is not available.', schema: healthySchema })
  async check() {
    try {
      await this.dataSource.query('SELECT 1');
    } catch {
      throw new ServiceUnavailableException({ status: 'error', database: 'down' });
    }
    return { status: 'ok', database: 'up' };
  }
}
