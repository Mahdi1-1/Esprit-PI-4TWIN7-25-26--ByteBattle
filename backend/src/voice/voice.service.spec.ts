import { BadRequestException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as fs from "fs";
import * as path from "path";
import { VoiceService } from "./voice.service";

jest.mock("crypto", () => ({
  randomUUID: jest.fn(() => "test-uuid"),
}));

describe("VoiceService", () => {
  let service: VoiceService;

  const configService = {
    get: jest.fn().mockReturnValue(undefined),
  } as unknown as ConfigService;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(fs, "existsSync").mockReturnValue(true);
    jest.spyOn(fs, "mkdirSync").mockImplementation(() => undefined);
    service = new VoiceService(configService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("reports unavailable when clients are missing", () => {
    expect(service.isAvailable()).toEqual({ stt: false, tts: false });
  });

  it("throws when TTS client is missing", async () => {
    await expect(
      service.textToSpeech({ text: "hello" }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("synthesizes audio and saves the file", async () => {
    const ttsClient = {
      synthesizeSpeech: jest
        .fn()
        .mockResolvedValue([{ audioContent: Buffer.from("audio") }]),
    } as any;
    (service as any).ttsClient = ttsClient;

    const writeFileSpy = jest
      .spyOn(fs, "writeFile")
      .mockImplementation(((...args: any[]) => {
        const maybeCallback = args[args.length - 1];
        if (typeof maybeCallback === "function") {
          maybeCallback(null);
        }
        return undefined as any;
      }) as unknown as typeof fs.writeFile);

    const result = await service.textToSpeech({
      text: "hello",
      languageCode: "en-US",
      voiceName: "en-US-Test",
      speakingRate: 1.1,
      pitch: 2,
    });

    const expectedPath = path.join(
      process.cwd(),
      "uploads",
      "audio",
      "tts-test-uuid.mp3",
    );

    expect(ttsClient.synthesizeSpeech).toHaveBeenCalled();
    expect(writeFileSpy).toHaveBeenCalled();
    expect(result.audioUrl).toBe("/uploads/audio/tts-test-uuid.mp3");
    expect(result.audioPath).toBe(expectedPath);
  });

  it("wraps TTS failures in BadRequestException", async () => {
    (service as any).ttsClient = {
      synthesizeSpeech: jest.fn().mockRejectedValue(new Error("boom")),
    } as any;

    await expect(service.textToSpeech({ text: "fail" })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("throws when STT client is missing", async () => {
    await expect(
      service.speechToText({ audioBuffer: Buffer.from("a") }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns empty transcript when no STT results", async () => {
    (service as any).sttClient = {
      recognize: jest.fn().mockResolvedValue([{ results: [] }]),
    } as any;

    const result = await service.speechToText({
      audioBuffer: Buffer.from("a"),
      languageCode: "en-US",
    });

    expect(result).toEqual({ transcript: "", confidence: 0 });
  });

  it("parses transcript and word timings from STT results", async () => {
    (service as any).sttClient = {
      recognize: jest.fn().mockResolvedValue([
        {
          results: [
            {
              alternatives: [
                {
                  transcript: "hello world",
                  confidence: 0.88,
                  words: [
                    {
                      word: "hello",
                      startTime: { seconds: "1", nanos: "500000000" },
                      endTime: { seconds: "2", nanos: "0" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]),
    } as any;

    const result = await service.speechToText({
      audioBuffer: Buffer.from("a"),
    });

    expect(result.transcript).toBe("hello world");
    expect(result.confidence).toBe(0.88);
    expect(result.words).toEqual([
      { word: "hello", startTime: 1.5, endTime: 2 },
    ]);
  });

  it("throws when STT long client is missing", async () => {
    await expect(
      service.speechToTextLong(Buffer.from("a")),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns transcript from long running STT", async () => {
    (service as any).sttClient = {
      longRunningRecognize: jest.fn().mockResolvedValue([
        {
          promise: jest.fn().mockResolvedValue([
            {
              results: [
                {
                  alternatives: [{ transcript: "long audio" }],
                },
              ],
            },
          ]),
        },
      ]),
    } as any;

    const result = await service.speechToTextLong(Buffer.from("a"));

    expect(result.transcript).toBe("long audio");
    expect(result.confidence).toBe(0.9);
  });

  it("cleans up old audio files", async () => {
    jest
      .spyOn(fs, "readdirSync")
      .mockReturnValue(["old.mp3", "new.mp3"] as unknown as any);
    jest.spyOn(fs, "statSync").mockImplementation((filePath) => {
      const now = 1_000_000;
      if (String(filePath).includes("old")) {
        return { mtimeMs: now - 1000 * 60 * 60 * 25 } as any;
      }
      return { mtimeMs: now - 1000 } as any;
    });
    const unlinkSpy = jest
      .spyOn(fs, "unlinkSync")
      .mockImplementation(() => undefined);
    jest.spyOn(Date, "now").mockReturnValue(1_000_000);

    const deleted = await service.cleanupOldAudioFiles(24);

    expect(deleted).toBe(1);
    expect(unlinkSpy).toHaveBeenCalledTimes(1);
  });

  it("returns available voices", async () => {
    (service as any).ttsClient = {
      listVoices: jest
        .fn()
        .mockResolvedValue([{ voices: [{ name: "voice-1" }] }]),
    } as any;

    const voices = await service.getAvailableVoices("en-US");

    expect(voices).toEqual([{ name: "voice-1" }]);
  });

  it("throws when voice list is requested without TTS", async () => {
    await expect(service.getAvailableVoices()).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it("converts STT from multer file", async () => {
    (service as any).sttClient = {
      recognize: jest.fn().mockResolvedValue([
        {
          results: [
            {
              alternatives: [{ transcript: "multer transcript" }],
            },
          ],
        },
      ]),
    } as any;

    const transcript = await service.speechToTextFromMulterFile(
      { buffer: Buffer.from("abc"), size: 3 } as any,
      "en-US",
    );

    expect(transcript).toBe("multer transcript");
  });
});
