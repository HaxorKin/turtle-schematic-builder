import xxhash from 'xxhash-wasm';
import { GameState } from '../components/game-state';

// eslint-disable-next-line @typescript-eslint/unbound-method
const { h64 } = await xxhash();

export function getStateKey(gameState: GameState) {
  const parts = [
    ...gameState.blocksToPlace.keys(),
    ...gameState.turtle.position,
    ...gameState.turtle.direction,
  ];
  return h64(parts.join('\n'));
}

export type StateKey = ReturnType<typeof getStateKey>;
