import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsService } from './artists.service';
import { ConfigService } from '@nestjs/config';
import { ServiceUnavailableException } from '@nestjs/common';
import { getDayName } from '../common/utils/getDayName';

jest.mock('../common/utils/getDayName', () => ({
  getDayName: jest.fn(),
}));

const MOCK_ARRAY = [
  { artistId: 1, artistName: 'Metallica', primaryGenreName: 'Metal' },
  { artistId: 72, artistName: 'The Myx', primaryGenreName: 'Pop' },
  { artistId: 2, artistName: 'Adele', primaryGenreName: 'Pop' },
  { artistId: 3, artistName: 'Madonna', primaryGenreName: 'Pop' },
  { artistId: 32, artistName: 'a mad man', primaryGenreName: 'Pop' },
  { artistId: 80, artistName: 'anmad', primaryGenreName: 'Pop' },
  { artistId: 10, artistName: 'an meni', primaryGenreName: 'Pop' },
];

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

  it('filtering - "the", "a", "an" are all ignored and case-insensitive', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: MOCK_ARRAY,
        }),
    });

    const dto = {};

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 32, name: 'a mad man', genre: 'Pop' },
      { id: 3, name: 'Madonna', genre: 'Pop' },
      { id: 10, name: 'an meni', genre: 'Pop' },
      { id: 1, name: 'Metallica', genre: 'Metal' },
      { id: 72, name: 'The Myx', genre: 'Pop' },
    ]);
  });

  it('results pagination', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: MOCK_ARRAY,
        }),
    });

    const dto = { limit: 1, page: 5 };

    const response = await service.getItems(dto);

    expect(response.data).toEqual([{ id: 72, name: 'The Myx', genre: 'Pop' }]);
    expect(response.meta.total).toBe(5);
    expect(response.meta.hasNextPage).toBe(false);
  });

  it('No results - should return an empty array', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [],
        }),
    });

    const dto = {};

    const response = await service.getItems(dto);

    expect(response.data).toEqual([]);
  });

  it('supports genre filtering', async () => {
    (getDayName as jest.Mock).mockReturnValue('Sunday');
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            { artistId: 5, artistName: 'Steve Find', primaryGenreName: 'Pop' },
            { artistId: 10, artistName: 'Sam Smith', primaryGenreName: 'Pop' },
            {
              artistId: 11,
              artistName: 'Sia',
              primaryGenreName: 'Alternative',
            },
          ],
        }),
    });

    const dto = { genre: 'pop' };

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 10, name: 'Sam Smith', genre: 'Pop' },
      { id: 5, name: 'Steve Find', genre: 'Pop' },
    ]);
  });

  it('supports sorting - ingnores "the", "a", "an"', async () => {
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: MOCK_ARRAY,
        }),
    });

    const dto = { sort: 'desc' as const };

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 72, name: 'The Myx', genre: 'Pop' },
      { id: 1, name: 'Metallica', genre: 'Metal' },
      { id: 10, name: 'an meni', genre: 'Pop' },
      { id: 3, name: 'Madonna', genre: 'Pop' },
      { id: 32, name: 'a mad man', genre: 'Pop' },
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

  it('handles mapping when itunes returned data shape is varied', async () => {
    (getDayName as jest.Mock).mockReturnValue('Sunday');
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            { artistId: 5, artistName: 'Steve Find', primaryGenreName: '' },
            { artistId: 10, artistName: 'Sam Smith', primaryGenreName: 'Pop' },
            {
              artistId: 11,
              artistName: 'Sia',
              primaryGenreName: undefined,
            },
          ],
        }),
    });

    const dto = {};

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 10, name: 'Sam Smith', genre: 'Pop' },
      { id: 11, name: 'Sia', genre: undefined },
      { id: 5, name: 'Steve Find', genre: '' },
    ]);
  });

  it('rejects items when itunes returned data format is incorrect', async () => {
    (getDayName as jest.Mock).mockReturnValue('Sunday');
    globalAny.fetch.mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          results: [
            {
              artistId: 5,
              artistName: 'Steve Find',
              primaryGenreName: '',
              year: 1990,
            },
            { artistId: 10, artistName: 'Sam Smith', primaryGenreName: 'Pop' },
            {
              artistId: 11,
              artistName: undefined,
              primaryGenreName: undefined,
            },
            {
              artistId: 19,
              primaryGenreName: 'Rock',
            },
          ],
        }),
    });

    const dto = {};

    const response = await service.getItems(dto);

    expect(response.data).toEqual([
      { id: 10, name: 'Sam Smith', genre: 'Pop' },
      { id: 5, name: 'Steve Find', genre: '' },
    ]);
  });

  it('throws when the iTunes request times out', async () => {
    let capturedSignal: AbortSignal | undefined | null;

    globalAny.fetch.mockImplementation(
      (_, init?: RequestInit) =>
        new Promise((_resolve, reject) => {
          capturedSignal = init?.signal;
          init?.signal?.addEventListener('abort', () => {
            reject(Object.assign(new Error('Aborted'), { name: 'AbortError' }));
          });
        }),
    );

    const timeoutPromise = service.getItems({});

    // force the abort so the test doesn't take the full 5s
    capturedSignal?.dispatchEvent(new Event('abort'));

    await expect(timeoutPromise).rejects.toThrow(
      new ServiceUnavailableException('The iTunes request timed out'),
    );
  });
});
