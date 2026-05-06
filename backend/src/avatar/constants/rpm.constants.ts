export const RPM_CONSTANTS = {
  BASE_URL: "https://models.readyplayer.me",
  SCENES: [
    "halfbody-portrait-v1",
    "fullbody-portrait-v1",
    "fullbody-posture-v1",
  ] as const,
  EXPRESSIONS: {
    neutral: {},
    smile: { "blendShapes[Wolf3D_Head][mouthSmile]": 0.3 },
    "big-smile": { "blendShapes[Wolf3D_Head][mouthSmile]": 0.7 },
    surprised: { "blendShapes[Wolf3D_Head][mouthOpen]": 0.5 },
    wink: {
      "blendShapes[Wolf3D_Head][mouthSmile]": 0.2,
      "blendShapes[Wolf3D_Head][eyeBlink_L]": 1,
    },
    sad: { "blendShapes[Wolf3D_Head][mouthSmile]": -0.3 },
  },
};

export type RPMScene = (typeof RPM_CONSTANTS.SCENES)[number];
export type RPMExpression = keyof typeof RPM_CONSTANTS.EXPRESSIONS;
