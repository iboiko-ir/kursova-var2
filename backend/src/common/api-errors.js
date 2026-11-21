import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiResponse } from '@nestjs/swagger';

export class ErrorDto {
  @ApiProperty({ type: Number, example: 400 })
  statusCode;

  @ApiProperty({ type: String, description: 'Error message, or a list of messages for validation errors.' })
  message;

  @ApiProperty({ type: String, example: 'Bad Request' })
  error;
}

const descriptions = {
  400: 'Invalid request data.',
  401: 'Missing or invalid access token.',
  403: 'The role is not allowed to perform this action.',
  404: 'Record not found.',
  409: 'Conflict with an existing record.',
};

export function ApiErrors(...statuses) {
  return applyDecorators(
    ...statuses.map((status) => ApiResponse({ status, description: descriptions[status], type: ErrorDto })),
  );
}
