export class TeamMemberDto {
  userId: string;
  username: string;
  profileImage: string | null;
  role: "captain" | "member";
  joinedAt: Date;
}

export class TeamJoinRequestDto {
  userId: string;
  username: string;
  profileImage: string | null;
  requestedAt: Date;
  status: "pending" | "approved" | "rejected";
}

export class TeamResponseDto {
  id: string;
  name: string;
  ownerId: string;
  joinCode: string | null;
  members: TeamMemberDto[];
  joinRequests: TeamJoinRequestDto[];
  registeredHackathonIds: string[];
  createdAt: Date;
  updatedAt: Date;
  createdByMe: boolean;

  static async fromPrisma(
    raw: any,
    requestingUserId: string,
    getUser: (
      userId: string,
    ) => Promise<{ username: string; profileImage: string | null } | null>,
  ): Promise<TeamResponseDto> {
    const normalizeName = (...candidates: Array<string | null | undefined>) => {
      for (const value of candidates) {
        if (typeof value === "string") {
          const trimmed = value.trim();
          if (trimmed.length > 0) return trimmed;
        }
      }
      return "Unknown user";
    };

    const ids = Array.from(
      new Set([
        ...(raw.members ?? []).map((m: any) => m.userId),
        ...(raw.joinRequests ?? []).map((r: any) => r.userId),
      ]),
    );

    const users = await Promise.all(ids.map((userId) => getUser(userId)));
    const userById = ids.reduce<
      Record<string, { username: string; profileImage: string | null } | null>
    >((acc, userId, index) => {
      acc[userId] = users[index] ?? null;
      return acc;
    }, {});

    return {
      id: raw.id,
      name: raw.name,
      ownerId: raw.ownerId,
      joinCode: raw.joinCode ?? null,
      members: (raw.members ?? []).map((member: any) => {
        const user = userById[member.userId];
        return {
          userId: member.userId,
          username: normalizeName(user?.username, member.username),
          profileImage: user?.profileImage ?? member.profileImage ?? null,
          role: member.role,
          joinedAt: member.joinedAt ?? raw.createdAt,
        };
      }),
      joinRequests: (raw.joinRequests ?? []).map((request: any) => {
        const user = userById[request.userId];
        return {
          userId: request.userId,
          username: normalizeName(user?.username, request.username),
          profileImage: user?.profileImage ?? request.profileImage ?? null,
          requestedAt: request.requestedAt ?? raw.updatedAt,
          status: request.status ?? "pending",
        };
      }),
      registeredHackathonIds: [],
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      createdByMe: raw.ownerId === requestingUserId,
    };
  }
}
