import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import type { EnvVars } from './env.schema';
import { envSchema } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot<EnvVars>({
      isGlobal: true,
      cache: true,
      validate: (config) => envSchema.parse(config),
    }),
  ],
  exports: [NestConfigModule],
})
export class ConfigModule {}
