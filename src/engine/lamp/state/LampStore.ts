import { BulbState, LampState, LampStateListener } from "../types";

export class LampStore {
  private state: LampState = {
    bulb: "on",
    switchOn: true,
    shots: 0,
    bulbs: 0,
    soundEnabled: true,
    isDragging: false,
    drawPower: 0,
  };

  private listeners: Set<LampStateListener> = new Set();
  private readonly storageKey = "slingshot_lamp_sound_v1";

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(this.storageKey);
      if (stored !== null) {
        this.state.soundEnabled = stored === "true";
      }
      try {
        const params = new URLSearchParams(window.location.search);
        const urlBulb = params.get("bulb");
        if (urlBulb === "off") {
          this.state.bulb = "off";
          this.state.switchOn = false;
        } else if (urlBulb === "broken" || params.get("replace") === "ready" || params.get("shatter") === "test") {
          this.state.bulb = "broken";
          this.state.bulbs = 1;
        } else if (urlBulb === "on") {
          this.state.bulb = "on";
          this.state.switchOn = true;
        }
      } catch {
        // Fallback for environments without location search
      }
    }
  }

  public getState(): Readonly<LampState> {
    return this.state;
  }

  public subscribe(listener: LampStateListener): () => void {
    this.listeners.add(listener);
    // Emit initial state immediately
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    const readonlyState = Object.freeze({ ...this.state });
    this.listeners.forEach((listener) => {
      try {
        listener(readonlyState);
      } catch (err) {
        console.error("Error in LampStore listener:", err);
      }
    });
  }

  public setBulb(bulb: BulbState): void {
    if (this.state.bulb === bulb) return;
    this.state = { ...this.state, bulb };
    this.notify();
  }

  public toggleSwitch(): BulbState {
    const nextSwitchOn = !this.state.switchOn;
    if (this.state.bulb === "broken") {
      // While broken, flipping the switch flips the rocker but gives no light
      this.state = { ...this.state, switchOn: nextSwitchOn };
      this.notify();
      return "broken";
    }
    const nextBulb: BulbState = nextSwitchOn ? "on" : "off";
    this.state = { ...this.state, switchOn: nextSwitchOn, bulb: nextBulb };
    this.notify();
    return nextBulb;
  }

  public incrementShots(): number {
    const nextShots = this.state.shots + 1;
    this.state = { ...this.state, shots: nextShots };
    this.notify();
    return nextShots;
  }

  public incrementBulbs(): number {
    const nextBulbs = this.state.bulbs + 1;
    this.state = { ...this.state, bulbs: nextBulbs, bulb: "broken" };
    this.notify();
    return nextBulbs;
  }

  public replaceBulb(): void {
    // Restores bulb according to current switch state
    const nextBulb: BulbState = this.state.switchOn ? "on" : "off";
    this.state = { ...this.state, bulb: nextBulb };
    this.notify();
  }

  public toggleSound(): boolean {
    const nextSound = !this.state.soundEnabled;
    this.state = { ...this.state, soundEnabled: nextSound };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(this.storageKey, String(nextSound));
      } catch (e) {
        console.warn("Could not save sound preference:", e);
      }
    }
    this.notify();
    return nextSound;
  }

  public setDragging(isDragging: boolean, drawPower = 0): void {
    const roundedPower = isDragging ? Math.round(drawPower * 20) / 20 : 0;
    if (this.state.isDragging === isDragging && Math.abs(this.state.drawPower - roundedPower) < 0.04) {
      return;
    }
    this.state = { ...this.state, isDragging, drawPower: roundedPower };
    this.notify();
  }
}
