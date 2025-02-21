import { createHash } from 'crypto';
import { GameState } from '../components/game-state';

export function getStateKey(gameState: GameState) {
  const hash = createHash('sha256');
  for (const blockKey of gameState.blocksToPlace.keys()) {
    hash.update(blockKey);
  }
  hash.update(String(gameState.turtle.position));
  hash.update(String(gameState.turtle.direction));
  return hash.digest('base64url');
}
