// backend/src/auth/strategies/google.strategy.ts
import { Injectable, Logger } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, VerifyCallback } from "passport-google-oauth20";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "../auth.service";

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, "google") {
  private readonly logger = new Logger(GoogleStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>("GOOGLE_CLIENT_ID"),
      clientSecret: configService.get<string>("GOOGLE_CLIENT_SECRET"),
      callbackURL: configService.get<string>("GOOGLE_CALLBACK_URL"),
      scope: ["email", "profile"],
    });

    this.logger.log("✅ Google OAuth Strategy initialized");
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
    done: VerifyCallback,
  ): Promise<any> {
    try {
      const { emails, name, id, photos } = profile;

      const user = await this.authService.validateOrCreateGoogleUser({
        googleId: id,
        email: emails[0].value,
        firstName: name.givenName,
        lastName: name.familyName,
        profileImage: photos?.[0]?.value,
      });

      done(null, user);
    } catch (error) {
      this.logger.error("Google validation error:", error);
      done(error, false);
    }
  }
}
