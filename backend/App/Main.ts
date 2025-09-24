

// App/Main.ts
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { join } from 'path';
import { AppModule } from './App.Module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

     app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));


    const port = Number(process.env.PORT) || 3786;
    await app.listen(port);
    console.log(`Application running on http://localhost:${port}`);
}
bootstrap()


