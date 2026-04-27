// src/voice/voice.controller.ts
import {
    Controller,
    Post,
    Get,
    Body,
    Query,
    UploadedFile,
    UseInterceptors,
    BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { VoiceService } from './voice.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { memoryStorage } from 'multer';

// DTOs
class TextToSpeechDto {
    text: string;
    languageCode?: string;
    voiceName?: string;
    speakingRate?: number;
    pitch?: number;
}

@ApiTags('Voice')
@ApiBearerAuth()
@Controller('voice')
export class VoiceController {
    constructor(private voiceService: VoiceService) { }

    @Post('tts')
    @Roles('user')
    @ApiOperation({ summary: 'Convert text to speech' })
    async textToSpeech(@Body() dto: TextToSpeechDto) {
        if (!dto.text || dto.text.trim().length === 0) {
            throw new BadRequestException('Text is required');
        }

        if (dto.text.length > 5000) {
            throw new BadRequestException('Text too long (max 5000 characters)');
        }

        return this.voiceService.textToSpeech({
            text: dto.text,
            languageCode: dto.languageCode,
            voiceName: dto.voiceName,
            speakingRate: dto.speakingRate,
            pitch: dto.pitch,
        });
    }

    @Post('stt')
    @Roles('user')
    @ApiOperation({ summary: 'Convert speech to text' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        schema: {
            type: 'object',
            properties: {
                audio: {
                    type: 'string',
                    format: 'binary',
                    description: 'Audio file (webm, mp3, wav, ogg)',
                },
                languageCode: {
                    type: 'string',
                    default: 'fr-FR',
                },
            },
        },
    })
    @UseInterceptors(
        FileInterceptor('audio', {
            storage: memoryStorage(),
            limits: {
                fileSize: 10 * 1024 * 1024, // 10MB max
            },
            fileFilter: (req, file, callback) => {
                const allowedMimes = [
                    'audio/webm',
                    'audio/mp3',
                    'audio/mpeg',
                    'audio/wav',
                    'audio/ogg',
                    'audio/flac',
                ];
                if (allowedMimes.includes(file.mimetype)) {
                    callback(null, true);
                } else {
                    callback(new BadRequestException('Invalid audio format'), false);
                }
            },
        }),
    )
    async speechToText(
        @UploadedFile() file: Express.Multer.File,
        @Query('languageCode') languageCode?: string,
    ) {
        if (!file) {
            throw new BadRequestException('Audio file is required');
        }

        // Determine encoding based on mimetype
        let encoding: 'LINEAR16' | 'FLAC' | 'MP3' | 'OGG_OPUS' | 'WEBM_OPUS' = 'WEBM_OPUS';
        let sampleRateHertz = 48000;

        if (file.mimetype === 'audio/webm') {
            encoding = 'WEBM_OPUS';
            sampleRateHertz = 48000;
        } else if (file.mimetype === 'audio/mp3' || file.mimetype === 'audio/mpeg') {
            encoding = 'MP3';
            sampleRateHertz = 44100;
        } else if (file.mimetype === 'audio/wav') {
            encoding = 'LINEAR16';
            sampleRateHertz = 16000;
        } else if (file.mimetype === 'audio/ogg') {
            encoding = 'OGG_OPUS';
            sampleRateHertz = 48000;
        } else if (file.mimetype === 'audio/flac') {
            encoding = 'FLAC';
            sampleRateHertz = 16000;
        }

        return this.voiceService.speechToText({
            audioBuffer: file.buffer,
            languageCode: languageCode || 'fr-FR',
            encoding,
            sampleRateHertz,
        });
    }

    @Get('voices')
    @Roles('user')
    @ApiOperation({ summary: 'Get available TTS voices' })
    async getVoices(@Query('languageCode') languageCode?: string) {
        return this.voiceService.getAvailableVoices(languageCode);
    }

    @Get('status')
    @ApiOperation({ summary: 'Check if STT and TTS services are available' })
    getStatus() {
        return this.voiceService.isAvailable();
    }
}