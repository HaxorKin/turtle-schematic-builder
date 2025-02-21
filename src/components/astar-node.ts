import { Action } from './action';
import { GameState } from './game-state';

export class AstarNode {
  parent: AstarNode | undefined;
  gameState: GameState;
  action: Action | undefined;
  gCost: number; // Actual cost to reach this state
  hCost: number; // Heuristic cost to the goal
  fCost: number; // Total cost (gCost + hCost)
  totalBlocksPlaced: number;

  constructor(
    gameState: GameState,
    parent: AstarNode | undefined = undefined,
    action: Action | undefined = undefined,
    gCost: number = 0,
    hCost: number = 0,
    fCost: number = 0,
    totalBlocksPlaced: number = 0,
  ) {
    this.parent = parent;
    this.gameState = gameState;
    this.action = action;
    this.gCost = gCost;
    this.hCost = hCost;
    this.fCost = fCost;
    this.totalBlocksPlaced = totalBlocksPlaced;
  }
}
