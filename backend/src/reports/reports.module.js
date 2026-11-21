import { Module } from '@nestjs/common';
import { ReportService } from './report.service';
import { ReportsController } from './reports.controller';

@Module({
  controllers: [ReportsController],
  providers: [ReportService],
})
export class ReportsModule {}
