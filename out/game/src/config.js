// SOLMARINA tuning constants, palette and vehicle types.
export const WORLD = { width: 3200, height: 2400 };
export const ROAD_W = 92;
export const CITY_NAME = 'Solmarina';
export const FIXER = 'Mara Voss';
export const STEP = 1 / 60;
export const FONT = 'system-ui, -apple-system, "Segoe UI", sans-serif';

export const PALETTE = {
  grass: '#7fae5a', grass2: '#8fbf68', sand: '#e8d29a', water: '#2e8fa8',
  waterDeep: '#1f6f8f', road: '#3c4148', roadEdge: '#2c3036',
  lane: '#e8d44d', sidewalk: '#b9b3a4', plaza: '#c9b98f',
  downtown: '#5a6b7d', beach: '#e8d29a', harbor: '#7d7468',
  oldtown: '#c98a5a', industrial: '#8a8f96',
};

export const VEHICLES = {
  sedan:  { name: 'Sedan',  maxSpeed: 330, accel: 260, turn: 2.6, colors: ['#c94f42', '#4a7fb5', '#d8d3c8'] },
  taxi:   { name: 'Taxi',   maxSpeed: 320, accel: 250, turn: 2.6, colors: ['#f2c230'] },
  truck:  { name: 'Truck',  maxSpeed: 250, accel: 170, turn: 1.9, colors: ['#7d8a99', '#a8642e'] },
  sports: { name: 'Sports', maxSpeed: 470, accel: 380, turn: 3.4, colors: ['#d21f3c', '#f2f2f2', '#1f6fd2'] },
  van:    { name: 'Van',    maxSpeed: 280, accel: 200, turn: 2.1, colors: ['#e8e8e8', '#5a7d5a'] },
  police: { name: 'Police', maxSpeed: 400, accel: 330, turn: 3.0, colors: ['#1c2733'] },
};

export const VEHICLE_SIZE = {
  sedan: [46, 22], taxi: [46, 22], truck: [62, 26],
  sports: [48, 21], van: [52, 24], police: [48, 22],
};

export const WANTED_DECAY = 0.05;
export const PISTOL_DAMAGE = 34;
export const START_CASH = 250;
export const SAVE_KEY = 'solmarina.save.v1';
