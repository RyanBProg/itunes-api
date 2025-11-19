import { Test, TestingModule } from '@nestjs/testing';
import { ArtistsController } from './artists.controller';
import { ArtistsService } from './artists.service';

describe('ArtistsController', () => {
  let controller: ArtistsController;
  const mockArtistsService = { getItems: jest.fn().mockReturnValue([]) };

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

  it('calls ArtistsService.getItems when getTodaysArtists is called', () => {
    controller.getTodaysArtists();
    expect(mockArtistsService.getItems).toHaveBeenCalled();
  });
});
