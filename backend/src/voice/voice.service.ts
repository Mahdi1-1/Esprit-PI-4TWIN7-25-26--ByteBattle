// src/voice/voice.service.ts
import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as textToSpeech from '@google-cloud/text-to-speech';
import * as speech from '@google-cloud/speech';
import * as fs from 'fs';
import * as path from 'path';
import * as util from 'util';
import { v4 as uuidv4 } from 'uuid';

export interface TTSOptions {
    text: string;
    languageCode?: string;
    voiceName?: string;
    speakingRate?: number;
    pitch?: number;
}

export interface STTOptions {
    audioBuffer: Buffer;
    languageCode?: string;
    encoding?: 'LINEAR16' | 'FLAC' | 'MP3' | 'OGG_OPUS' | 'WEBM_OPUS';
    sampleRateHertz?: number;
}

export interface TTSResult {
    audioUrl: string;
    audioPath: string;
    duration?: number;
}

export interface STTResult {
    transcript: string;
    confidence: number;
    words?: Array<{
        word: string;
        startTime: number;
        endTime: number;
    }>;
}

@Injectable()
export class VoiceService {
    private readonly logger = new Logger(VoiceService.name);
    private ttsClient: textToSpeech.TextToSpeechClient | null = null;
    private sttClient: speech.SpeechClient | null = null;
    private readonly audioDir: string;

    constructor(private configService: ConfigService) {
        this.audioDir = path.join(process.cwd(), 'uploads', 'audio');
        this.ensureAudioDir();
        this.initializeClients();
    }

    private ensureAudioDir() {
        if (!fs.existsSync(this.audioDir)) {
            fs.mkdirSync(this.audioDir, { recursive: true });
            this.logger.log(`📁 Created audio directory: ${this.audioDir}`);
        }
    }

    private initializeClients() {
        const credentialsPath = this.configService.get<string>('GOOGLE_APPLICATION_CREDENTIALS');

        if (credentialsPath && fs.existsSync(credentialsPath)) {
            try {
                this.ttsClient = new textToSpeech.TextToSpeechClient();
                this.sttClient = new speech.SpeechClient();
                this.logger.log('✅ Google Cloud Voice APIs initialized');
            } catch (error) {
                this.logger.warn('⚠️ Failed to initialize Google Cloud clients:', error);
            }
        } else {
            this.logger.warn('⚠️ Google Cloud credentials not found - Voice features disabled');
        }
    }

    /**
     * 🟢 Check if Voice features (STT/TTS) are available
     */
    isAvailable(): { stt: boolean; tts: boolean } {
        return {
            stt: this.sttClient !== null,
            tts: this.ttsClient !== null,
        };
    }

    /**
     * 🔊 Text-to-Speech: Convert text to audio
     */
    async textToSpeech(options: TTSOptions): Promise<TTSResult> {
        const {
            text,
            languageCode = 'fr-FR',
            voiceName = 'fr-FR-Neural2-A',
            speakingRate = 1.0,
            pitch = 0,
        } = options;

        if (!this.ttsClient) {
            throw new BadRequestException('TTS service not available');
        }

        this.logger.log(`🔊 Converting text to speech (${text.length} chars, ${languageCode})`);

        try {
            const request: textToSpeech.protos.google.cloud.texttospeech.v1.ISynthesizeSpeechRequest = {
                input: { text },
                voice: {
                    languageCode,
                    name: voiceName,
                },
                audioConfig: {
                    audioEncoding: 'MP3',
                    speakingRate,
                    pitch,
                    effectsProfileId: ['headphone-class-device'],
                },
            };

            const [response] = await this.ttsClient.synthesizeSpeech(request);

            if (!response.audioContent) {
                throw new Error('No audio content returned');
            }

            // Save audio file
            const filename = `tts-${uuidv4()}.mp3`;
            const audioPath = path.join(this.audioDir, filename);

            const writeFile = util.promisify(fs.writeFile);
            await writeFile(audioPath, response.audioContent, 'binary');

            const audioUrl = `/uploads/audio/${filename}`;

            this.logger.log(`✅ TTS completed: ${audioUrl}`);

            return {
                audioUrl,
                audioPath,
            };
        } catch (error) {
            this.logger.error('❌ TTS failed:', error);
            throw new BadRequestException('Failed to convert text to speech');
        }
    }

    /**
     * 🎤 Speech-to-Text: Convert audio to text
     */
    async speechToText(options: STTOptions): Promise<STTResult> {
        const {
            audioBuffer,
            languageCode = 'fr-FR',
            encoding = 'WEBM_OPUS',
            sampleRateHertz = 48000,
        } = options;

        if (!this.sttClient) {
            throw new BadRequestException('STT service not available');
        }

        this.logger.log(`🎤 Converting speech to text (${audioBuffer.length} bytes, ${languageCode})`);

        try {
            const audioBytes = audioBuffer.toString('base64');

            const request: speech.protos.google.cloud.speech.v1.IRecognizeRequest = {
                audio: {
                    content: audioBytes,
                },
                config: {
                    encoding: encoding as any,
                    sampleRateHertz,
                    languageCode,
                    enableAutomaticPunctuation: true,
                    enableWordTimeOffsets: true,
                    model: 'latest_long',
                    useEnhanced: true,
                },
            };

            const [response] = await this.sttClient.recognize(request);

            if (!response.results || response.results.length === 0) {
                return {
                    transcript: '',
                    confidence: 0,
                };
            }

            const result = response.results[0];
            const alternative = result.alternatives?.[0];

            if (!alternative) {
                return {
                    transcript: '',
                    confidence: 0,
                };
            }

            const words = alternative.words?.map(word => ({
                word: word.word || '',
                startTime: this.parseTime(word.startTime),
                endTime: this.parseTime(word.endTime),
            }));

            this.logger.log(`✅ STT completed: "${alternative.transcript?.substring(0, 50)}..."`);

            return {
                transcript: alternative.transcript || '',
                confidence: alternative.confidence || 0,
                words,
            };
        } catch (error) {
            this.logger.error('❌ STT failed:', error);
            throw new BadRequestException('Failed to convert speech to text');
        }
    }

    /**
     * 🎤 Speech-to-Text for streaming/long audio
     */
    async speechToTextLong(audioBuffer: Buffer, languageCode = 'fr-FR'): Promise<STTResult> {
        if (!this.sttClient) {
            throw new BadRequestException('STT service not available');
        }

        // For files longer than 1 minute, use longRunningRecognize
        const audioBytes = audioBuffer.toString('base64');

        const request: speech.protos.google.cloud.speech.v1.ILongRunningRecognizeRequest = {
            audio: {
                content: audioBytes,
            },
            config: {
                encoding: 'WEBM_OPUS',
                sampleRateHertz: 48000,
                languageCode,
                enableAutomaticPunctuation: true,
            },
        };

        const [operation] = await this.sttClient.longRunningRecognize(request);
        const [response] = await operation.promise();

        const transcripts = response.results
            ?.map(result => result.alternatives?.[0]?.transcript)
            .filter(Boolean)
            .join(' ');

        return {
            transcript: transcripts || '',
            confidence: 0.9,
        };
    }

    /**
     * 🗑️ Clean up old audio files (call periodically)
     */
    async cleanupOldAudioFiles(maxAgeHours = 24): Promise<number> {
        const files = fs.readdirSync(this.audioDir);
        const now = Date.now();
        const maxAge = maxAgeHours * 60 * 60 * 1000;
        let deleted = 0;

        for (const file of files) {
            const filePath = path.join(this.audioDir, file);
            const stats = fs.statSync(filePath);

            if (now - stats.mtimeMs > maxAge) {
                fs.unlinkSync(filePath);
                deleted++;
            }
        }

        if (deleted > 0) {
            this.logger.log(`🗑️ Cleaned up ${deleted} old audio files`);
        }

        return deleted;
    }

    /**
     * 📋 Get available voices
     */
    async getAvailableVoices(languageCode?: string): Promise<any[]> {
        if (!this.ttsClient) {
            throw new BadRequestException('TTS service not available');
        }

        const [result] = await this.ttsClient.listVoices({ languageCode });
        return result.voices || [];
    }

    // Helper
    private parseTime(time: any): number {
        if (!time) return 0;
        const seconds = parseInt(time.seconds || '0', 10);
        const nanos = parseInt(time.nanos || '0', 10);
        return seconds + nanos / 1e9;
    }
}