import { BlockToPlace } from '../blocks/bases/block-to-place';
import { dirsToVectors } from '../components/dir';
import { addVectors } from '../components/vector';
import { addToArrayMap } from './array-map';

/**
 * Returns the blocks that affect reachability of the given block
 * @param targetBlock The block to find dependencies for
 * @param blockMap Map of all available blocks by position
 * @returns Array of blocks that affect the target block
 */
function getAffectingBlocks(
  targetBlock: BlockToPlace,
  blockMap: Map<string, BlockToPlace>,
): BlockToPlace[] {
  if (!targetBlock.dependencyDirections) return [];

  return dirsToVectors(targetBlock.dependencyDirections)
    .map((offset) => addVectors(targetBlock, offset))
    .map((position) => blockMap.get(String(position)))
    .filter((block): block is BlockToPlace => block !== undefined);
}

/**
 * Creates a map of blocks, where the key is a block that can affect the reachability
 * of other blocks, and the value is an array of blocks that are affected.
 * @param blockMap Map of all blocks by position
 * @returns Dependency map between blocks
 */
export function createBlockDependencyMap(blockMap: Map<string, BlockToPlace>) {
  const dependencyMap = new Map<BlockToPlace, BlockToPlace[]>();

  for (const block of blockMap.values()) {
    for (const affectingBlock of getAffectingBlocks(block, blockMap)) {
      addToArrayMap(dependencyMap, affectingBlock, block);
    }
  }

  return dependencyMap;
}
