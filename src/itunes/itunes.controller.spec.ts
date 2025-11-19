import { Test, TestingModule } from '@nestjs/testing';
import { ItunesController } from './itunes.controller';

describe('ItunesController', () => {
  let controller: ItunesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ItunesController],
    }).compile();

    controller = module.get<ItunesController>(ItunesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
