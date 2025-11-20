import { Controller, Get, Query } from '@nestjs/common';
import { ArtistsService } from './artists.service';
import { GetArtistsTodayDto } from './dto/get-artists-today.dto';
import { ArtistsTodayResponseDto } from './dto/artist.dto';

@Controller('artists')
export class ArtistsController {
  constructor(private artistsService: ArtistsService) {}

  @Get('today')
  getTodaysArtists(
    @Query() query: GetArtistsTodayDto,
  ): Promise<ArtistsTodayResponseDto> {
    return this.artistsService.getItems(query);
  }
}
