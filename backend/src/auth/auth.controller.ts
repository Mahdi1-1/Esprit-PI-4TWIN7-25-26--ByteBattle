// backend/src/auth/auth.controller.ts
import {
  Controller,
  Post,
  Get,
  Body,
  UseGuards,
  Req,
  Res,
  Logger,
} from "@nestjs/common";
import { ApiTags, ApiBearerAuth, ApiOperation } from "@nestjs/swagger";
import { Response } from "express";
import { ConfigService } from "@nestjs/config";
import { AuthService } from "./auth.service";
import { RegisterDto, LoginDto } from "./dto/auth.dto";
import { VerifyEmailDto } from "./dto/verify-email.dto";
import { ResendVerificationDto } from "./dto/resend-verification.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";
import { Public } from "./decorators/public.decorator";
import { CurrentUser } from "./decorators/current-user.decorator";
import { GoogleAuthGuard } from "./guards/google-auth.guard";

@ApiTags("Auth")
@Controller("auth")
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Public()
  @Post("register")
  @ApiOperation({ summary: "Register a new account" })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post("login")
  @ApiOperation({ summary: "Login with email & password" })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @Post("verify-email")
  @ApiOperation({ summary: "Verify email with token" })
  verifyEmail(@Body() dto: VerifyEmailDto) {
    return this.authService.verifyEmail(dto);
  }

  @Public()
  @Post("resend-verification")
  @ApiOperation({ summary: "Resend verification email" })
  resendVerification(@Body() dto: ResendVerificationDto) {
    return this.authService.resendVerificationEmail(dto);
  }

  @Public()
  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password reset email" })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post("reset-password")
  @ApiOperation({ summary: "Reset password using token" })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  // ✨ NOUVEAU: Initier le flux Google OAuth
  @Public()
  @Get("google")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Sign in with Google" })
  async googleAuth() {
    // Initiates the Google OAuth2.0 login flow
  }

  // ✨ NOUVEAU: Callback Google OAuth
  @Public()
  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: "Google OAuth callback" })
  async googleAuthRedirect(@Req() req, @Res() res: Response) {
    const user = req.user;

    if (!user) {
      const frontendUrl =
        this.configService.get<string>("PUBLIC_FRONTEND_URL") ||
        this.configService.get<string>("FRONTEND_URL") ||
        "http://bytebattle.local";
      return res.redirect(`${frontendUrl}/login?error=authentication_failed`);
    }

    // Générer le token JWT
    const tokens = this.authService["generateTokens"](user);

    this.logger.log(`✅ Google login successful: ${user.email}`);

    // Rediriger vers le frontend avec le token
    const frontendUrl =
      this.configService.get<string>("PUBLIC_FRONTEND_URL") ||
      this.configService.get<string>("FRONTEND_URL") ||
      "http://bytebattle.local";
    return res.redirect(
      `${frontendUrl}/auth/callback?token=${tokens.access_token}`,
    );
  }

  @Get("me")
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user profile" })
  getProfile(@CurrentUser("id") userId: string) {
    return this.authService.getProfile(userId);
  }
}
