/* eslint-disable @typescript-eslint/no-magic-numbers */
import { vectorToSingleDir } from '../components/dir';
import { GameState } from '../components/game-state';

export function getStateKey(gameState: GameState) {
  const {
    blocksToPlaceHash,
    turtle: {
      position: [x, y, z],
      direction,
    },
    reachability: {
      size: [width, height],
    },
  } = gameState;

  const index = x + y * width + z * width * height;
  const dir = vectorToSingleDir(direction);

  return BigInt(dir | (index << 6)) | (BigInt(blocksToPlaceHash) << 32n);
}

export type StateKey = ReturnType<typeof getStateKey>;
