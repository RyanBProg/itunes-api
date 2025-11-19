import { Controller, Get } from '@nestjs/common';
import { ArtistsService } from './artists.service';

@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get('today')
  getTodaysArtists() {
    return this.artistsService.getItems();
  }
}
