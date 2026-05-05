// ─────────────────────────────────────────────────────────────────────────────
// EmailService
// ─────────────────────────────────────────────────────────────────────────────
import { Test, TestingModule } from '@nestjs/testing';
import { EmailService } from './email.service';
import { ConfigService } from '@nestjs/config';

const mockConfigService = {
  get: jest.fn().mockImplementation((key: string, fallback?: any) => {
    if (key === 'SMTP_HOST') return undefined; // simulate no SMTP
    if (key === 'SMTP_USER') return undefined;
    if (key === 'SMTP_PASS') return undefined;
    return fallback;
  }),
};

describe('EmailService (no SMTP configured)', () => {
  let service: EmailService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<EmailService>(EmailService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should not throw when SMTP is not configured and sendVerificationEmail is called', async () => {
    await expect(
      service.sendVerificationEmail('test@example.com', 'alice', 'http://verify.link'),
    ).resolves.not.toThrow();
  });

  it('should not throw when sendPasswordResetEmail is called without SMTP', async () => {
    await expect(
      service.sendPasswordResetEmail('test@example.com', 'alice', 'http://reset.link'),
    ).resolves.not.toThrow();
  });
});
