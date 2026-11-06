export type BulbState = "on" | "off" | "broken";

export interface LampState {
  bulb: BulbState;
  shots: number;
  bulbs: number;
  soundEnabled: boolean;
  isDragging: boolean;
  drawPower: number; // 0.0 to 1.0 (normalized pull)
}

export type LampStateListener = (state: Readonly<LampState>) => void;

export interface SceneDimensions {
  width: number;
  height: number;
  aspect: number;
  isMobile: boolean;
  worldWidth: number;
  worldHeight: number;
}

export interface NormalizedAnchor {
  normalizedX: number; // -1 to 1 (left to right)
  normalizedY: number; // -1 to 1 (bottom to top)
  worldX: number;
  worldY: number;
}

export interface EngineCallbacks {
  onStateChange?: LampStateListener;
  onBulbShatter?: () => void;
  onBulbReplaced?: () => void;
  onSoundTrigger?: (sound: "switch" | "twang" | "tonk" | "shatter") => void;
}

