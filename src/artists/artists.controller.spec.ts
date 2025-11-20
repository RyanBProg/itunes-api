import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

describe('ArtistsController', () => {
  let controller: ArtistsController;
  const mockArtistsService = { getItems: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ArtistsController],
      providers: [{ provide: ArtistsService, useValue: mockArtistsService }],
    }).compile();

    controller = module.get<ArtistsController>(ArtistsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('calls ArtistsService.getItems when getTodaysArtists is called', async () => {
    const query = { limit: 10, page: 1 };
    mockArtistsService.getItems.mockResolvedValue({ data: [], meta: {} });
    await controller.getTodaysArtists(query);
    expect(mockArtistsService.getItems).toHaveBeenCalledWith(query);
  });

  it('ensures response shape matches ArtistsTodayResponseDto contract', async () => {
    const serviceResponse = {
      data: [{ id: 42, name: 'Another Artist', genre: undefined }],
      meta: { total: 1, page: 2, limit: 5, hasNextPage: true },
    };
    mockArtistsService.getItems.mockResolvedValue(serviceResponse);

    const result = await controller.getTodaysArtists({ limit: 5, page: 2 });

    expect(result).toEqual(serviceResponse);
  });
});
