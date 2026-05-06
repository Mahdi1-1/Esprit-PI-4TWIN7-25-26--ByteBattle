import { StreamableFile } from "@nestjs/common";
import { UsersController } from "./users.controller";
import * as fs from "fs";

describe("UsersController", () => {
  const mockUsersService = {
    findAll: jest.fn(),
    findOne: jest.fn(),
    getHistory: jest.fn(),
    getRecentActivity: jest.fn(),
    update: jest.fn(),
    updateRole: jest.fn(),
    updateStatus: jest.fn(),
    uploadProfilePhoto: jest.fn(),
    deleteProfilePhoto: jest.fn(),
    changePassword: jest.fn(),
    changeEmail: jest.fn(),
    getProfileStats: jest.fn(),
    getIntelligenceProfile: jest.fn(),
    deleteAccount: jest.fn(),
    getPublicProfile: jest.fn(),
    getPublicStats: jest.fn(),
    getPublicActivity: jest.fn(),
    searchByUsername: jest.fn(),
  };

  let controller: UsersController;

  beforeEach(() => {
    controller = new UsersController(mockUsersService as any);
    jest.clearAllMocks();
  });

  it("delegates findAll", () => {
    controller.findAll(2 as any, 5 as any);
    expect(mockUsersService.findAll).toHaveBeenCalledWith(2, 5);
  });

  it("delegates getMe", () => {
    controller.getMe("user-1");
    expect(mockUsersService.findOne).toHaveBeenCalledWith("user-1");
  });

  it("delegates getMyHistory", () => {
    controller.getMyHistory("user-1", 3 as any, 10 as any);
    expect(mockUsersService.getHistory).toHaveBeenCalledWith("user-1", 3, 10);
  });

  it("delegates getMyActivity", () => {
    controller.getMyActivity("user-1", 5 as any);
    expect(mockUsersService.getRecentActivity).toHaveBeenCalledWith(
      "user-1",
      5,
    );
  });

  it("delegates findOne", () => {
    controller.findOne("user-2");
    expect(mockUsersService.findOne).toHaveBeenCalledWith("user-2");
  });

  it("delegates public profile methods", () => {
    controller.getPublicProfile("alice");
    controller.getPublicStats("alice");
    controller.getPublicActivity("alice", 3 as any);

    expect(mockUsersService.getPublicProfile).toHaveBeenCalledWith("alice");
    expect(mockUsersService.getPublicStats).toHaveBeenCalledWith("alice");
    expect(mockUsersService.getPublicActivity).toHaveBeenCalledWith("alice", 3);
  });

  it("delegates searchUsers", () => {
    controller.searchUsers("alice", 9 as any);
    expect(mockUsersService.searchByUsername).toHaveBeenCalledWith("alice", 9);
  });

  it("delegates updateMe", () => {
    controller.updateMe("user-1", { firstName: "A" } as any);
    expect(mockUsersService.update).toHaveBeenCalledWith("user-1", {
      firstName: "A",
    });
  });

  it("delegates role and status updates", () => {
    controller.updateRole("user-1", "admin");
    controller.updateStatus("user-1", "suspended");
    expect(mockUsersService.updateRole).toHaveBeenCalledWith("user-1", "admin");
    expect(mockUsersService.updateStatus).toHaveBeenCalledWith(
      "user-1",
      "suspended",
    );
  });

  it("delegates photo upload and delete", () => {
    controller.uploadPhoto("user-1", { originalname: "file.png" } as any);
    controller.deletePhoto("user-1");
    expect(mockUsersService.uploadProfilePhoto).toHaveBeenCalled();
    expect(mockUsersService.deleteProfilePhoto).toHaveBeenCalledWith("user-1");
  });

  it("delegates password and email change", () => {
    controller.changePassword("user-1", {
      currentPassword: "a",
      newPassword: "b",
    } as any);
    controller.changeEmail("user-1", {
      currentPassword: "a",
      newEmail: "b@example.com",
    } as any);

    expect(mockUsersService.changePassword).toHaveBeenCalled();
    expect(mockUsersService.changeEmail).toHaveBeenCalled();
  });

  it("delegates stats and intelligence", () => {
    controller.getProfileStats("user-1");
    controller.getIntelligenceProfile("user-1");

    expect(mockUsersService.getProfileStats).toHaveBeenCalledWith("user-1");
    expect(mockUsersService.getIntelligenceProfile).toHaveBeenCalledWith(
      "user-1",
    );
  });

  it("delegates deleteAccount", () => {
    controller.deleteAccount("user-1", { currentPassword: "a" } as any);
    expect(mockUsersService.deleteAccount).toHaveBeenCalledWith("user-1", {
      currentPassword: "a",
    });
  });

  describe("getPhoto", () => {
    it("rejects invalid filenames", async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
      } as any;

      const result = await controller.getPhoto("../secret", res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(result).toEqual({ error: "Invalid filename" });
    });

    it("returns 404 when file is missing", async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
      } as any;
      jest.spyOn(fs, "existsSync").mockReturnValue(false);

      const result = await controller.getPhoto("avatar.webp", res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(result).toEqual({ error: "Photo not found" });
    });

    it("streams the file when present", async () => {
      const res = {
        status: jest.fn().mockReturnThis(),
        set: jest.fn(),
      } as any;
      jest.spyOn(fs, "existsSync").mockReturnValue(true);
      jest.spyOn(fs, "createReadStream").mockReturnValue({} as any);

      const result = await controller.getPhoto("avatar.webp", res);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({ "Content-Type": "image/webp" }),
      );
      expect(result).toBeInstanceOf(StreamableFile);
    });
  });
});
