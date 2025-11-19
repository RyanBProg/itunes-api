import { Module } from '@nestjs/common';
import { ItunesController } from './itunes.controller';
import { ItunesService } from './itunes.service';

@Module({
  controllers: [ItunesController],
  providers: [ItunesService]
})
export class ItunesModule {}
