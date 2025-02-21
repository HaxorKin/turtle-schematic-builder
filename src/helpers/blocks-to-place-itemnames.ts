import { BlockToPlace } from '../blocks/bases/block-to-place';

export function blocksToPlaceItemNames(
  blocksToPlace: Map<string, BlockToPlace>,
): ArrayIterator<string> {
  return blocksToPlace.values().map((block) => block.itemName);
}
