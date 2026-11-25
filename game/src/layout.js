// Kitchen layout: every station's rectangle or circle on the 1280x720
// canvas. The world (clicks) and the renderer (drawing) share these so a
// click always lands where the picture shows the station.

export const LAYOUT = {
  hud: { x: 0, y: 0, w: 1280, h: 64 },
  board: { x: 16, y: 72, w: 1248, h: 104 },
  ticketW: 300,
  ticketH: 88,
  ticketGap: 16,

  // Cutting board (left).
  chop: { x: 36, y: 200, w: 264, h: 240 },
  // Stove (centre): two burners and the pasta pot.
  stove: { x: 330, y: 200, w: 510, h: 240 },
  burner1: { cx: 440, cy: 322, r: 62 },
  burner2: { cx: 600, cy: 322, r: 62 },
  pot: { cx: 758, cy: 322, r: 56 },
  // Plating station (right).
  plate: { x: 870, y: 200, w: 374, h: 240 },
  plateCircle: { cx: 1004, cy: 322, r: 72 },
  trash: { x: 1150, y: 330, w: 70, h: 84 },

  // Ingredient bins along the bottom counter.
  bins: { x: 16, y: 560, w: 1248, h: 144 },
  binW: 128,
  binGap: 12,

  // Buttons in the HUD.
  pauseBtn: { x: 1080, y: 12, w: 88, h: 40 },
  muteBtn: { x: 1176, y: 12, w: 88, h: 40 },
};
