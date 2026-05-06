import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { ConfigService } from "@nestjs/config";
import axios from "axios";
import * as sharp from "sharp";
import * as fs from "fs/promises";
import * as path from "path";
import { RPM_CONSTANTS } from "../constants/rpm.constants";

@Injectable()
export class RpmAvatarService implements OnModuleInit {
  private readonly logger = new Logger(RpmAvatarService.name);
  private readonly uploadDir = path.join(process.cwd(), "uploads", "avatars");

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  async onModuleInit() {
    await this.ensureUploadDir();
  }

  private async ensureUploadDir() {
    try {
      await fs.access(this.uploadDir);
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true });
    }
  }

  private extractAvatarId(glbUrl: string): string {
    try {
      const parts = glbUrl.split("/");
      let lastPart = parts[parts.length - 1];

      // Enlever les query params s'il y en a
      if (lastPart.includes("?")) {
        lastPart = lastPart.split("?")[0];
      }

      if (lastPart.endsWith(".glb")) {
        return lastPart.replace(".glb", "");
      }

      return lastPart;
    } catch {
      return "default_id";
    }
  }

  private buildRenderUrl(
    avatarId: string,
    scene: string,
    expression: string,
  ): string {
    // If ID is a full URL, extract ID again just in case
    if (avatarId.includes("http")) {
      try {
        avatarId = this.extractAvatarId(avatarId);
      } catch {
        // Keep as is if extraction fails, might be a valid ID anyway
      }
    }

    const baseUrl = `${RPM_CONSTANTS.BASE_URL}/${avatarId}.png`;
    const params = new URLSearchParams();

    params.append("scene", scene);

    const blendShapes = RPM_CONSTANTS.EXPRESSIONS[expression] || {};
    Object.entries(blendShapes).forEach(([key, value]) => {
      params.append(key, String(value));
    });

    return `${baseUrl}?${params.toString()}`;
  }

  private async downloadAndProcessRender(
    avatarId: string,
    userId: string,
    scene: string,
    expression: string,
  ) {
    const renderUrl = this.buildRenderUrl(avatarId, scene, expression);

    try {
      // 1. Download image from RPM render API
      const response = await axios.get(renderUrl, {
        responseType: "arraybuffer",
        timeout: 30000,
      });

      const buffer = Buffer.from(response.data);
      const filename = `${userId}_${Date.now()}`;

      // Ensure the output file name has .png extension for sharp to recognize format if not explicitly set,
      // but here we are converting to webp
      const localPath = path.join(this.uploadDir, `${filename}.webp`);
      const thumbPath = path.join(this.uploadDir, `${filename}_thumb.webp`);

      // 2. Process main image with Sharp
      // Just save the image as is for now to avoid complexity with SVG composition if that is failing
      await sharp(buffer)
        .resize(400, 400, { fit: "cover" }) // Resize to a reasonable avatar size
        .webp({ quality: 90 })
        .toFile(localPath);

      // 3. Process thumbnail
      await sharp(localPath)
        .resize(100, 100)
        .webp({ quality: 85 })
        .toFile(thumbPath);

      return {
        localImageUrl: `/uploads/avatars/${filename}.webp`, // Ensure this path matches how static files are served
        thumbnailUrl: `/uploads/avatars/${filename}_thumb.webp`,
      };
    } catch (error) {
      this.logger.error(
        `Failed to process avatar for user ${userId}: ${error.message}`,
      );
      // Fallback to original URL if processing fails, instead of throwing error
      return {
        localImageUrl: renderUrl,
        thumbnailUrl: renderUrl,
      };
    }
  }

  async saveAvatar(
    userId: string,
    glbUrl: string,
    scene = "halfbody-portrait-v1",
    expression = "neutral",
  ) {
    const avatarId = this.extractAvatarId(glbUrl);

    let localImageUrl = "";
    let thumbnailUrl = "";
    let renderUrl = glbUrl; // Fallback default to glbUrl if render fails (though they serve different purposes)

    try {
      const result = await this.downloadAndProcessRender(
        avatarId,
        userId,
        scene,
        expression,
      );
      if (result && result.localImageUrl) {
        localImageUrl = result.localImageUrl;
        thumbnailUrl = result.thumbnailUrl;
      } else {
        localImageUrl = this.buildRenderUrl(avatarId, scene, expression);
        thumbnailUrl = localImageUrl;
      }
    } catch (e) {
      this.logger.error(
        "Error processing avatar image, falling back to basic details",
        e,
      );
      localImageUrl = this.buildRenderUrl(avatarId, scene, expression);
      thumbnailUrl = localImageUrl;
    }
    renderUrl = this.buildRenderUrl(avatarId, scene, expression);

    try {
      // Enregistrer d'abord sans "set:" - certaines versions de Prisma préfèrent l'objet direct pour MongoDB
      // On simplifie la mise à jour pour s'assurer que ça passe dans MongoDB
      const updatedUser = await this.prisma.user.update({
        where: { id: userId },
        data: {
          avatar: {
            rpmAvatarId: avatarId,
            rpmModelUrl: glbUrl,
            renderUrl: renderUrl,
            localImageUrl: localImageUrl,
            thumbnailUrl: thumbnailUrl,
            scene: scene,
            expression: expression,
            updatedAt: new Date(),
          },
          profileImage: localImageUrl,
        },
        select: {
          id: true,
          avatar: true,
        },
      });

      return updatedUser.avatar;
    } catch (dbError) {
      this.logger.error("Database update failed:", dbError);
      // Si la première méthode échoue, on tente la méthode de remplacement complet (cas parfois requis)
      try {
        const updatedRetry = await this.prisma.user.update({
          where: { id: userId },
          data: {
            avatar: {
              set: {
                rpmAvatarId: avatarId,
                rpmModelUrl: glbUrl,
                renderUrl: renderUrl,
                localImageUrl: localImageUrl,
                thumbnailUrl: thumbnailUrl,
                scene: scene,
                expression: expression,
                updatedAt: new Date(),
              },
            },
            profileImage: localImageUrl,
          },
          select: {
            id: true,
            avatar: true,
          },
        });
        return updatedRetry.avatar;
      } catch (retryError) {
        this.logger.error("Database retry update failed:", retryError);
        throw new Error("Erreur base de données lors de la sauvegarde");
      }
    }
  }

  async updateExpression(userId: string, expression: string) {
    const user = await this.getAvatar(userId);
    if (!user?.avatar) throw new NotFoundException("Avatar not found");

    return this.reprocessAvatar(
      userId,
      user.avatar.rpmModelUrl,
      user.avatar.scene,
      expression,
    );
  }

  async updateScene(userId: string, scene: string) {
    const user = await this.getAvatar(userId);
    if (!user?.avatar) throw new NotFoundException("Avatar not found");

    return this.reprocessAvatar(
      userId,
      user.avatar.rpmModelUrl,
      scene,
      user.avatar.expression || "neutral",
    );
  }

  async refreshRender(userId: string) {
    const user = await this.getAvatar(userId);
    if (!user?.avatar) throw new NotFoundException("Avatar not found");

    return this.reprocessAvatar(
      userId,
      user.avatar.rpmModelUrl,
      user.avatar.scene,
      user.avatar.expression || "neutral",
    );
  }

  private async reprocessAvatar(
    userId: string,
    glbUrl: string,
    scene: string,
    expression: string,
  ) {
    const avatarId = this.extractAvatarId(glbUrl);

    // Don't delete immediately in case of failure
    const { localImageUrl, thumbnailUrl } = await this.downloadAndProcessRender(
      avatarId,
      userId,
      scene,
      expression,
    );
    const renderUrl = this.buildRenderUrl(avatarId, scene, expression);

    // Now delete old files
    await this.deleteLocalFiles(userId);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: {
          rpmAvatarId: avatarId,
          rpmModelUrl: glbUrl,
          renderUrl,
          localImageUrl,
          thumbnailUrl,
          scene,
          expression,
          updatedAt: new Date().toISOString(),
        },
        profileImage: localImageUrl,
      },
      select: { avatar: true },
    });

    return updatedUser.avatar;
  }

  async getAvatar(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true, profileImage: true },
    });
  }

  async deleteAvatar(userId: string) {
    await this.deleteLocalFiles(userId);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        avatar: null,
        profileImage: null,
      },
    });

    return { success: true };
  }

  async getFilePath(filename: string): Promise<string> {
    const filePath = path.join(this.uploadDir, filename);
    try {
      await fs.access(filePath);
      return filePath;
    } catch {
      throw new NotFoundException("File not found");
    }
  }

  private async deleteLocalFiles(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatar: true },
    });

    if (user?.avatar?.localImageUrl) {
      try {
        const filename = path.basename(user.avatar.localImageUrl);
        await fs.unlink(path.join(this.uploadDir, filename)).catch(() => {});
      } catch {
        // Ignore file not found
      }
    }

    if (user?.avatar?.thumbnailUrl) {
      try {
        const filename = path.basename(user.avatar.thumbnailUrl);
        await fs.unlink(path.join(this.uploadDir, filename)).catch(() => {});
      } catch {
        // Ignore
      }
    }
  }
}
