import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsService } from './artists.service';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { getDayName } from '../common/utils/getDayName';

jest.mock('../common/utils/getDayName', () => ({
  getDayName: jest.fn(),
}));

describe('ArtistsService', () => {
  let service: ArtistsService;
  const mockConfig = {
    get: jest.fn().mockReturnValue('https://itunes.apple.com'),
  };
  const globalAny = global as typeof globalThis & { fetch: jest.Mock };

  beforeEach(async () => {
    mockConfig.get.mockClear();
    globalAny.fetch = jest.fn();
    (getDayName as jest.Mock).mockReturnValue('Monday');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ArtistsService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();

    service = module.get<ArtistsService>(ArtistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('filters artists by day initial and paginates results', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            { artistId: 1, artistName: 'Metallica', primaryGenreName: 'Metal' },
            { artistId: 2, artistName: 'Adele', primaryGenreName: 'Pop' },
            { artistId: 3, artistName: 'Madonna', primaryGenreName: 'Pop' },
          ],
        }),
    });

    const dto = { limit: 1, page: 2, sort: 'asc' } as const;

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 1, name: 'Metallica', genre: 'Metal' },
    ]);
    expect(response.meta.total).toBe(2);
    expect(response.meta.hasNextPage).toBe(false);
  });

  it('supports genre filtering and descending sort', async () => {
    (getDayName as jest.Mock).mockReturnValue('Sunday');
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            { artistId: 10, artistName: 'Sam Smith', primaryGenreName: 'Pop' },
            {
              artistId: 11,
              artistName: 'Sia',
              primaryGenreName: 'Alternative',
            },
          ],
        }),
    });

    const dto = { sort: 'desc' as const, genre: 'POP' } as const;

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 10, name: 'Sam Smith', genre: 'Pop' },
    ]);
  });

  it('throws when the iTunes payload is malformed', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ results: null }),
    });

    await expect(service.getItems({})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });

  it('throws when the request fails', async () => {
    globalAny.fetch.mockRejectedValue(new Error('boom'));

    await expect(service.getItems({})).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});
