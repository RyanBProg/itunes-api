import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { ArtistsService } from '../src/artists/artists.service';
import type { Server } from 'http';

describe('AppController (e2e)', () => {
  let app: INestApplication<Server>;

  beforeAll(async () => {
    process.env.ITUNES_BASE_URL ??= 'https://itunes.apple.com';

    const mockArtistsService: Partial<ArtistsService> = {
      getItems: jest.fn().mockResolvedValue({
        data: [],
        meta: {
          total: 0,
          page: 1,
          limit: 20,
          hasNextPage: false,
        },
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ArtistsService)
      .useValue(mockArtistsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /artists/today returns 200', () => {
    return request(app.getHttpServer()).get('/artists/today').expect(200);
  });
});

describe('Caching (e2e)', () => {
  let app: INestApplication<Server>;
  const getItemsMock = jest.fn().mockResolvedValue({
    data: [{ id: 1, name: 'Cached Artist', genre: 'Alt' }],
    meta: { total: 1, page: 1, limit: 20, hasNextPage: false },
  });
  const mockArtistsService: Partial<ArtistsService> = {
    getItems: getItemsMock,
  };

  beforeAll(async () => {
    process.env.ITUNES_BASE_URL ??= 'https://itunes.apple.com';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ArtistsService)
      .useValue(mockArtistsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());
  afterEach(() => getItemsMock.mockClear());

  it('serves cached responses without calling the service twice', async () => {
    const server = app.getHttpServer();

    await request(server).get('/artists/today').expect(200);
    await request(server).get('/artists/today').expect(200);

    expect(getItemsMock).toHaveBeenCalledTimes(1);
  });
});

describe('Rate limiting (e2e)', () => {
  let app: INestApplication<Server>;
  const mockArtistsService: Partial<ArtistsService> = {
    getItems: jest.fn().mockResolvedValue({
      data: [],
      meta: { total: 0, page: 1, limit: 20, hasNextPage: false },
    }),
  };

  beforeAll(async () => {
    process.env.ITUNES_BASE_URL ??= 'https://itunes.apple.com';
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ArtistsService)
      .useValue(mockArtistsService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => app.close());
  afterEach(() => jest.clearAllMocks());

  it('returns 429 once the throttler limit is exceeded', async () => {
    const server = app.getHttpServer();

    for (let i = 0; i < 10; i += 1) {
      await request(server).get('/artists/today').expect(200);
    }

    await request(server).get('/artists/today').expect(429);
  });
});
