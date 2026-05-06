import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateBadgeDto } from "./dto/badge.dto";

@Injectable()
export class BadgesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateBadgeDto) {
    return this.prisma.badge.create({ data: dto });
  }

  async findAll() {
    return this.prisma.badge.findMany({ orderBy: { name: "asc" } });
  }

  async findOne(id: string) {
    const badge = await this.prisma.badge.findUnique({ where: { id } });
    if (!badge) throw new NotFoundException("Badge not found");
    return badge;
  }

  async remove(id: string) {
    return this.prisma.badge.delete({ where: { id } });
  }
}
