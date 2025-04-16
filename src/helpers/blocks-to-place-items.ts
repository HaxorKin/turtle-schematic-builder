import { BlockToPlace } from '../blocks/bases/block-to-place';

export function blocksToPlaceItems(blocksToPlace: Map<string, BlockToPlace>) {
  return blocksToPlace.values().map((block) => block.items);
}
