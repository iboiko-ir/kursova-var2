import { ValidationPipe } from '@nestjs/common';
import { setupSwagger } from './swagger';

export function configureApp(app) {
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  setupSwagger(app);
  return app;
}
