import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class HackathonAnnouncementService {
  constructor(private prisma: PrismaService) {}

  // T044 — Create an announcement
  async createAnnouncement(
    hackathonId: string,
    adminId: string,
    content: string,
    isPinned: boolean = false,
  ) {
    return this.prisma.hackathonAnnouncement.create({
      data: {
        hackathonId,
        adminId,
        content,
        isPinned,
      },
    });
  }

  // T045 — Get announcements (pinned first, then by date)
  async getAnnouncements(hackathonId: string) {
    return this.prisma.hackathonAnnouncement.findMany({
      where: { hackathonId },
      orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
    });
  }

  // T046 — Toggle pin
  async togglePin(announcementId: string) {
    const ann = await this.prisma.hackathonAnnouncement.findUnique({
      where: { id: announcementId },
    });
    if (!ann) throw new NotFoundException("Announcement not found");

    return this.prisma.hackathonAnnouncement.update({
      where: { id: announcementId },
      data: { isPinned: !ann.isPinned },
    });
  }
}
