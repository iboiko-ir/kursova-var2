import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupSwagger(app) {
  const config = new DocumentBuilder()
    .setTitle('kursova API')
    .setDescription(
      'REST API of the kursova warehouse inventory application. ' +
        'Log in with POST /api/auth/login, then use the Authorize button with the access token.',
    )
    .setVersion('0.2.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  // The message is a string or a list of strings. A plain DTO field cannot express this.
  const errorSchema = document.components.schemas.ErrorDto;
  errorSchema.properties.message = {
    ...errorSchema.properties.message,
    type: undefined,
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
  };
  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'openapi.json',
    swaggerOptions: { persistAuthorization: true },
  });
}
