import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EnvVars } from '../config/env.schema';
import { GetArtistsTodayDto } from './dto/get-artists-today.dto';
import { ArtistDto, ArtistsTodayResponseDto } from './dto/artist.dto';
import { getDayName } from '../common/utils/getDayName';
import { normaliseName } from '../common/utils/normaliseName';

interface ItunesArtistResult {
  artistId?: number;
  artistName?: string;
  primaryGenreName?: string;
}

interface ItunesSearchResponse {
  results?: ItunesArtistResult[];
}

@Injectable()
export class ArtistsService {
  private readonly baseUrl: string;
  private readonly defaultSearchTerm = 'music';
  private readonly searchLimit = 200;
  private readonly requestTimeoutMs = 5000;

  constructor(private readonly configService: ConfigService<EnvVars, true>) {
    this.baseUrl = this.configService.get('ITUNES_BASE_URL', { infer: true });
  }

  async getItems(query: GetArtistsTodayDto): Promise<ArtistsTodayResponseDto> {
    const artists = await this.fetchArtists();
    const dayInitial = getDayName().charAt(0).toLowerCase();

    let filtered = artists.filter(
      (artist) =>
        normaliseName(artist.name).charAt(0).toLowerCase() === dayInitial,
    );

    if (query.genre) {
      const genre = query.genre.toLowerCase();
      filtered = filtered.filter(
        (artist) => artist.genre?.toLowerCase() === genre,
      );
    }

    const sortDirection = query.sort ?? 'asc';
    filtered.sort((a, b) => {
      const nameA = normaliseName(a.name).toLowerCase();
      const nameB = normaliseName(b.name).toLowerCase();

      return sortDirection === 'desc'
        ? nameB.localeCompare(nameA)
        : nameA.localeCompare(nameB);
    });

    const limit = query.limit ?? 20;
    const page = query.page ?? 1;
    const start = (page - 1) * limit;
    const data = filtered.slice(start, start + limit);

    return {
      data,
      meta: {
        total: filtered.length,
        page,
        limit,
        hasNextPage: start + limit < filtered.length,
      },
    };
  }

  private async fetchArtists(): Promise<ArtistDto[]> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs);

    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('term', this.defaultSearchTerm);
    url.searchParams.set('entity', 'musicArtist');
    url.searchParams.set('limit', String(this.searchLimit));

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok) {
        throw new ServiceUnavailableException(
          'iTunes service is unavailable right now',
        );
      }

      const payload = (await response.json()) as unknown;

      if (!this.isValidItunesResponse(payload)) {
        throw new ServiceUnavailableException(
          'Unexpected response format from iTunes',
        );
      }

      console.log(payload);

      return payload.results
        .map((artist) => this.mapArtist(artist))
        .filter((artist): artist is ArtistDto => Boolean(artist));
    } catch (error) {
      this.handleFetchError(error);
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapArtist(artist: ItunesArtistResult): ArtistDto | null {
    if (
      typeof artist.artistId !== 'number' ||
      typeof artist.artistName !== 'string'
    ) {
      return null;
    }

    return {
      id: artist.artistId,
      name: artist.artistName,
      genre:
        typeof artist.primaryGenreName === 'string'
          ? artist.primaryGenreName
          : undefined,
    };
  }

  private isValidItunesResponse(
    payload: unknown,
  ): payload is Required<ItunesSearchResponse> {
    return (
      typeof payload === 'object' &&
      payload !== null &&
      Array.isArray((payload as ItunesSearchResponse).results)
    );
  }

  private handleFetchError(error: unknown): never {
    if (error instanceof ServiceUnavailableException) {
      throw error;
    }

    if (error instanceof Error && error.name === 'AbortError') {
      throw new ServiceUnavailableException('The iTunes request timed out');
    }

    throw new ServiceUnavailableException(
      'Unable to reach the iTunes service right now',
    );
  }
}
