import { SubmissionsGateway } from "./submissions.gateway";

describe("SubmissionsGateway", () => {
  let gateway: SubmissionsGateway;

  beforeEach(() => {
    gateway = new SubmissionsGateway();
  });

  it("joins user room on subscribe", () => {
    const client = { id: "c1", join: jest.fn() } as any;

    gateway.handleSubscribeUser(client, { userId: "user-1" });

    expect(client.join).toHaveBeenCalledWith("user:user-1");
  });

  it("emits submission status to user room", () => {
    const emit = jest.fn();
    const to = jest.fn().mockReturnValue({ emit });
    gateway.server = { to } as any;

    gateway.emitSubmissionStatus("user-1", { status: "queued" });

    expect(to).toHaveBeenCalledWith("user:user-1");
    expect(emit).toHaveBeenCalledWith("submission_status", { status: "queued" });
  });
});
