import { Bind, Controller, Dependencies, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { ApiErrors } from '../common/api-errors';
import { pageOf } from '../common/page';
import { ParamTypes } from '../common/param-types';
import { NotificationDto, NotificationQueryDto, NotificationSummaryDto } from './notification.dto';
import { NotificationService } from './notification.service';

const NotificationPage = pageOf(NotificationDto, 'NotificationPage');

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@Dependencies(NotificationService)
export class NotificationsController {
  constructor(notificationService) {
    this.notificationService = notificationService;
  }

  @Get()
  @Bind(Query())
  @ParamTypes(NotificationQueryDto)
  @ApiOperation({
    summary: 'List low-stock notifications',
    description:
      'A product has at most one active notification. It is updated when stock changes and resolved when stock is above the minimum.',
  })
  @ApiOkResponse({ type: NotificationPage })
  @ApiErrors(400, 401)
  list(query) {
    return this.notificationService.list(query);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Count active low-stock notifications' })
  @ApiOkResponse({ type: NotificationSummaryDto })
  @ApiErrors(401)
  summary() {
    return this.notificationService.summary();
  }
}
