import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  addVectors,
  facingMapping,
  NULL_VECTOR,
  subVectors,
  Vector,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace, BlockToPlaceFacingHorizontalBase } from './block-to-place';
import { nonInvertedFacingHorizontalBlocks } from './block.constants';

// A facing horizontal block can be placed:
// - From above if the turtle is facing the same direction
// - From below if the turtle is facing the same direction
// If the turtle is on the side:
// - The turtle is facing the same direction as the block and there is a block behind or below the target block
// - The turtle is facing the opposite direction as the block and there is no block behind and no block below the target block
export class BlockToPlaceFacingHorizontal
  extends BlockToPlaceFacingHorizontalBase
  implements BlockToPlace
{
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    const blockName = paletteBlock.Name.value;
    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Facing block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Facing block must have facing property');
    const facingVector = facingMapping[facing];
    this.facing = nonInvertedFacingHorizontalBlocks.has(blockName)
      ? facingVector
      : subVectors(NULL_VECTOR, facingVector);

    const facingDir = vectorToSingleDir(this.facing);
    this.dependencyDirections = Dir.Up | Dir.Down | facingDir | mirrorDir(facingDir);
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    const facing = this.facing;

    let reachabilityDirections = 0;
    const facingPos = addVectors(this, facing);
    const reachabilityFacing = reachability.at(...facingPos);
    const reachabilityBehind = reachability.at(...subVectors(this, facing));
    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);

    if (isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }
    if (isTurtleReachable(reachabilityBelow)) {
      reachabilityDirections |= Dir.Down;
    }

    if (
      isTurtleReachable(reachabilityBehind) &&
      (isBlock(reachabilityFacing) ||
        isBlock(reachabilityBelow) ||
        willHaveBlock(blocksToPlace, ...facingPos) ||
        willHaveBlock(blocksToPlace, x, y - 1, z))
    ) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(facing));
    }

    if (
      isTurtleReachable(reachabilityFacing) &&
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityBelow)
    ) {
      reachabilityDirections |= vectorToSingleDir(facing);
    }

    return reachabilityDirections;
  }

  isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.East | Dir.West) ||
      reachabilityDirections === (Dir.South | Dir.North)
    );
  }
}

export const blockToPlaceFacingHorizontalFactory = classFactory(
  BlockToPlaceFacingHorizontal,
);
