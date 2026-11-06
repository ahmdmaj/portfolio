export const COPY = {
  nav: {
    back: "← experiments",
    backHref: "/experiments",
  },
  hud: {
    title: "slingshot-lamp",
    statusOn: "on",
    statusOff: "off",
    statusBroken: "broken",
    shotsLabel: "shots",
    bulbsLabel: "bulbs",
    soundOn: "sound: on",
    soundOff: "sound: off",
  },
  lampMeta: {
    timeLabel: "03:14 AM",
  },
  headline: {
    line1: "Mind the",
    accentWord: "lamp.",
    subcopyLine1: "A physical kinetic light study with 2D pendulum mechanics and swept collisions.",
    subcopyLine2: "Drag the shade, flick the switch, or draw the slingshot to test bulb resilience.",
  },
  hint: {
    desktop: "Aim slingshot with cursor · Drag shade to swing · Tap switch to toggle",
    mobile: "Drag slingshot to fire · Tap shade or switch to interact",
    keyboard: "Arrow keys aim · Space draws & releases · S flips switch · R replaces bulb",
  },
  actions: {
    replaceBulb: "Screw in a new bulb",
    switchLabel: "Wall light switch",
  },
  fallback: {
    title: "WebGL Not Supported",
    message: "Your browser or graphics hardware does not currently support WebGL rendering.",
    action: "Return to Experiments",
  },
} as const;

