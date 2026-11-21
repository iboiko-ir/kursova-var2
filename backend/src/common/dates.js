import { BadRequestException } from '@nestjs/common';

export const DAY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function parseUtcDay(text, field) {
  const date = new Date(`${text}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== text) {
    throw new BadRequestException(`${field} is not a valid date.`);
  }
  return date;
}

export function parseReportDay(text, field) {
  const date = parseUtcDay(text, field);
  const today = new Date().toISOString().slice(0, 10);
  if (text > today) {
    throw new BadRequestException(`${field} must not be in the future. The stock of a future date is not known.`);
  }
  return date;
}
