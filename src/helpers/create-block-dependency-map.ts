import { BlockToPlace } from '../blocks/block-to-place';
import { dirsToVectors } from '../components/dir';
import { addVectors } from '../components/vector';

export function createBlockDependencyMap(blocks: Map<string, BlockToPlace>) {
  const blockDependencyMap = new Map<BlockToPlace, BlockToPlace[]>();
  for (const block of blocks.values()) {
    const dependencyDirections = block.dependencyDirections;
    if (dependencyDirections !== undefined) {
      const dependencyPositions = dirsToVectors(dependencyDirections).map((offset) =>
        addVectors(block, offset),
      );
      const affectingBlocks = dependencyPositions
        .map((position) => blocks.get(String(position)))
        .filter(Boolean);

      for (const affectingBlock of affectingBlocks) {
        const reachableBlocks = blockDependencyMap.get(affectingBlock) ?? [];
        reachableBlocks.push(block);
        blockDependencyMap.set(affectingBlock, reachableBlocks);
      }
    }
  }
  return blockDependencyMap;
}
