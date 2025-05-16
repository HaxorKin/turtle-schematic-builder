import { Action } from './action';
import { GameState } from './game-state';

export class AstarNode {
  gameState: GameState | undefined;

  constructor(
    gameState: GameState,
    readonly parent: AstarNode | undefined = undefined,
    readonly action: Action | undefined = undefined,
    readonly gCost = 0, // Actual cost to reach this state
    readonly hCost = 0, // Heuristic cost to the goal
    public fCost = 0,
    readonly totalBlocksPlaced = 0,
  ) {
    this.gameState = gameState;
  }

  freeAfterExpansion() {
    this.gameState = undefined;
  }
}
