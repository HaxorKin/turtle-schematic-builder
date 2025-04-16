import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  addVectors,
  facingMapping,
  invertVector,
  subVectors,
  Vector,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceFacingHorizontalBase } from './bases/block-to-place-facing-horizontal-base';
import { DataDrivenBlockFacingHorizontal } from './data-parser/data-driven-block.type';

// A facing horizontal block can be placed:
// - From above if the turtle is facing the same direction
// - From below if the turtle is facing the same direction
// If the turtle is on the side:
// - The turtle is facing the same direction as the block and there is a block behind or below the target block
// - The turtle is facing the opposite direction as the block and there is no block behind and no block below the target block
export class BlockToPlaceFacingHorizontal extends BlockToPlaceFacingHorizontalBase {
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    dataDrivenBlock: DataDrivenBlockFacingHorizontal,
    paletteBlock: PaletteBlock,
  ) {
    super(id, pos, items);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Facing block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Facing block must have facing property');
    const facingVector = facingMapping[facing];
    this.facing =
      (dataDrivenBlock.inverted ?? true) ? invertVector(facingVector) : facingVector;

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

  override isDeadlockable(reachabilityDirections: number): boolean {
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
