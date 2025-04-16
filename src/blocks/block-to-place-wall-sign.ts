import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { facingMapping, invertVector, subVectors, Vector } from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceWallAttachedBase } from './bases/block-to-place-wall-attached-base';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';

// A wall sign can be placed if:
// There is a block behind the target block
// - And there is space for the turtle in front of the target position
// - Or the turtle is above, there is no block below
//   - And the turtle is facing the same direction as the target
//   - Or there is no other block the sign could go on
// - Or the turtle is below and there is a block above
//   - And the turtle is facing the same direction as the target
//   - Or there is no other block the sign could go on

export class BlockToPlaceWallSign extends BlockToPlaceWallAttachedBase {
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    dataDrivenBlock: DataDrivenBlock,
    paletteBlock: PaletteBlock,
  ) {
    super(id, pos, items);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Sign block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Sign block must have facing property');

    // Wall sign facing directions are inverted
    this.facing = invertVector(facingMapping[facing]);

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

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export const blockToPlaceWallSignFactory = classFactory(BlockToPlaceWallSign);
