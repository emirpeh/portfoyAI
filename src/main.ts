import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as session from 'express-session';
import { ConfigService } from './config/config.service';
import * as express from 'express';
import { join } from 'path';
import * as fs from 'fs';

async function bootstrap() {
  const httpsOptions = {
    key: fs.readFileSync('certs/key.pem'),
    cert: fs.readFileSync('certs/cert.pem'),
  };
  const app = await NestFactory.create(AppModule, {
    httpsOptions,
  });
  const configService = app.get(ConfigService);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:4000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(
    session({
      secret: configService.get('SESSION_SECRET'),
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: parseInt(
          configService.get('SESSION_MAX_AGE') || '86400000',
          10,
        ),
        secure: configService.isProduction(),
      },
    }),
  );

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  const frontendPath = join(process.cwd(), 'frontend/.output/public');
  console.log('Frontend path:', frontendPath);
  app.use(express.static(frontendPath));

  app.use('*', (req, res, next) => {
    if (req.originalUrl.startsWith('/api')) {
      next();
      return;
    }

    if (
      req.originalUrl.endsWith('.html') ||
      req.originalUrl === '/' ||
      !req.originalUrl.includes('.')
    ) {
      const filePath = join(
        process.cwd(),
        'frontend/.output/public/index.html',
      );
      fs.readFile(filePath, 'utf8', (err, data) => {
        if (err) {
          next();
          return;
        }

        const modifiedData = data.replace(
          '</body>',
          '<script src="/custom.js"></script></body>',
        );
        res.send(modifiedData);
      });
    } else {
      next();
    }
  });

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`Application is running on: http://localhost:${port}`);
}
bootstrap();
