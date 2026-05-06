import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { UpdateNotificationPreferenceDto } from "./dto/notification-preference.dto";

const DEFAULT_PREFERENCES = {
  hackathon: true,
  duel: true,
  discussion: true,
  submission: true,
  canvas: true,
  achievement: true,
  system: true,
  inApp: true,
  email: false,
  push: false,
  quietStart: null as string | null,
  quietEnd: null as string | null,
};

@Injectable()
export class NotificationPreferenceService {
  constructor(private readonly prisma: PrismaService) {}

  async getOrDefault(userId: string) {
    const pref = await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
    if (!pref) return { ...DEFAULT_PREFERENCES };
    return {
      hackathon: pref.hackathon,
      duel: pref.duel,
      discussion: pref.discussion,
      submission: pref.submission,
      canvas: pref.canvas,
      achievement: pref.achievement,
      system: pref.system,
      inApp: pref.inApp,
      email: pref.email,
      push: pref.push,
      quietStart: pref.quietStart ?? null,
      quietEnd: pref.quietEnd ?? null,
    };
  }

  async upsert(userId: string, dto: UpdateNotificationPreferenceDto) {
    return this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        hackathon: dto.hackathon ?? DEFAULT_PREFERENCES.hackathon,
        duel: dto.duel ?? DEFAULT_PREFERENCES.duel,
        discussion: dto.discussion ?? DEFAULT_PREFERENCES.discussion,
        submission: dto.submission ?? DEFAULT_PREFERENCES.submission,
        canvas: dto.canvas ?? DEFAULT_PREFERENCES.canvas,
        achievement: dto.achievement ?? DEFAULT_PREFERENCES.achievement,
        system: dto.system ?? DEFAULT_PREFERENCES.system,
        inApp: dto.inApp ?? DEFAULT_PREFERENCES.inApp,
        email: dto.email ?? DEFAULT_PREFERENCES.email,
        push: dto.push ?? DEFAULT_PREFERENCES.push,
        quietStart: dto.quietStart ?? null,
        quietEnd: dto.quietEnd ?? null,
      },
      update: {
        ...(dto.hackathon !== undefined && { hackathon: dto.hackathon }),
        ...(dto.duel !== undefined && { duel: dto.duel }),
        ...(dto.discussion !== undefined && { discussion: dto.discussion }),
        ...(dto.submission !== undefined && { submission: dto.submission }),
        ...(dto.canvas !== undefined && { canvas: dto.canvas }),
        ...(dto.achievement !== undefined && { achievement: dto.achievement }),
        ...(dto.system !== undefined && { system: dto.system }),
        ...(dto.inApp !== undefined && { inApp: dto.inApp }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.push !== undefined && { push: dto.push }),
        ...(dto.quietStart !== undefined && { quietStart: dto.quietStart }),
        ...(dto.quietEnd !== undefined && { quietEnd: dto.quietEnd }),
      },
    });
  }
}
