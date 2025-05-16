export type MoveAction = 'forward' | 'back' | 'up' | 'down' | 'turnLeft' | 'turnRight';

export type PlaceAction = 'place' | 'placeUp' | 'placeDown';

export type SimpleAction = MoveAction | PlaceAction;

export type Action = SimpleAction | 'resupply';

export const actionCosts: Record<Action, number> = {
  forward: 2,
  back: 2,
  up: 2,
  down: 2,
  turnLeft: 1,
  turnRight: 1,
  resupply: 3, // Multiplier for the distance

  // Placeholders
  place: 0,
  placeUp: 0,
  placeDown: 0,
};
