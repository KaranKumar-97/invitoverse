/** Motion scale per animation intensity. Dependency-free so client bundles stay small. */
export type IntensityLevel = "SUBTLE" | "STANDARD" | "DRAMATIC";

const MOTION_SCALE: Record<IntensityLevel, number> = { SUBTLE: 0.6, STANDARD: 1, DRAMATIC: 1.4 };

export const motionScale = (i: IntensityLevel) => MOTION_SCALE[i];
