export type Action =
  | 'forward'
  | 'back'
  | 'up'
  | 'down'
  | 'turnLeft'
  | 'turnRight'
  | 'place'
  | 'placeUp'
  | 'placeDown'
  | 'resupply';

export const actionCosts: Record<Action, number> = {
  forward: 2,
  back: 2,
  up: 2,
  down: 2,
  turnLeft: 1,
  turnRight: 1,
  resupply: 6,

  // Placeholders
  place: 0,
  placeUp: 0,
  placeDown: 0,
};
