import { BlockToPlace } from '../blocks/block-to-place';
import { BlockToPlaceLiquid } from '../blocks/block-to-place-liquid';

export function willHaveBlock(
  blocksToPlace: Map<string, BlockToPlace> | undefined,
  x: number,
  y: number,
  z: number,
): boolean {
  const block = blocksToPlace?.get(`${x},${y},${z}`);
  return block !== undefined && !(block instanceof BlockToPlaceLiquid);
}
