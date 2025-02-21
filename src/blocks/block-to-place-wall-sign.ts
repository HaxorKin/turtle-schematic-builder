import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { facingMapping, NULL_VECTOR, subVectors, Vector } from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace, BlockToPlaceWallAttachedBase } from './block-to-place';

// A wall sign can be placed if:
// There is a block behind the target block
// - And there is space for the turtle in front of the target position
// - Or the turtle is above, there is no block below
//   - And the turtle is facing the same direction as the target
//   - Or there is no other block the sign could go on
// - Or the turtle is below and there is a block above
//   - And the turtle is facing the same direction as the target
//   - Or there is no other block the sign could go on

export class BlockToPlaceWallSign
  extends BlockToPlaceWallAttachedBase
  implements BlockToPlace
{
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Sign block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Sign block must have facing property');

    // Wall sign facing directions are inverted
    this.facing = subVectors(NULL_VECTOR, facingMapping[facing]);

    this.dependencyDirections =
      Dir.Up | Dir.Down | mirrorDir(vectorToSingleDir(this.facing));
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;

    let reachabilityDirections = 0;
    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));

    if (isEmpty(reachabilityBelow)) {
      if (isTurtleReachable(reachabilityAbove)) {
        reachabilityDirections |= Dir.Up;
      }

      if (
        isTurtleReachable(reachabilityBelow) &&
        (isBlock(reachabilityAbove) || willHaveBlock(blocksToPlace, x, y + 1, z))
      ) {
        reachabilityDirections |= Dir.Down;
      }
    }

    if (isTurtleReachable(reachabilityBehind)) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(this.facing));
    }

    return reachabilityDirections;
  }

  isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export const blockToPlaceWallSignFactory = classFactory(BlockToPlaceWallSign);
