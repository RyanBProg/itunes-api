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
