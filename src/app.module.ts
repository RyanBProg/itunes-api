import { Module } from '@nestjs/common';
import { ConfigModule } from './config/config.module';
import { ItunesModule } from './artists/itunes.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';

@Module({
  imports: [
    ItunesModule,
    ConfigModule,
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60000, // 1min
          limit: 10, // request
        },
      ],
    }),
    CacheModule.register({ ttl: 60000, isGlobal: true }), // 1min
  ],
  controllers: [],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_INTERCEPTOR, useClass: CacheInterceptor },
  ],
})
export class AppModule {}
