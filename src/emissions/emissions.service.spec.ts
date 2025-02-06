import { Test, TestingModule } from '@nestjs/testing';
import { EmissionsService } from './emissions.service';

describe('EmissionsService', () => {
  let service: EmissionsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EmissionsService],
    }).compile();

    service = module.get<EmissionsService>(EmissionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
