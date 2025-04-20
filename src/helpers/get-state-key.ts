/* eslint-disable @typescript-eslint/no-magic-numbers */
import { vectorToSingleDir } from '../components/dir';
import { GameState } from '../components/game-state';

export function getStateKey(gameState: GameState) {
  const {
    blocksToPlace,
    turtle: {
      position: [x, y, z],
      direction,
    },
    reachability: {
      size: [width, height],
    },
  } = gameState;

  let blockIdSum = blocksToPlace.size;
  for (const block of blocksToPlace.values()) {
    blockIdSum += block.id;
  }

  const index = x + y * width + z * width * height;
  const dir = vectorToSingleDir(direction);

  return BigInt(dir | (index << 3)) | (BigInt(blockIdSum) << 32n);
}

export type StateKey = ReturnType<typeof getStateKey>;
