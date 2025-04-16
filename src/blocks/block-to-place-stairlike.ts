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
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceFacingHorizontalBase } from './bases/block-to-place-facing-horizontal-base';
import { DataDrivenBlockStairlike } from './data-parser/data-driven-block.type';

// A top half block can be placed if:
// - The turtle is above and there is no block below
// - The turtle is below and there is a block above
// A bottom half block can be placed if:
// - The turtle is above and there is a block below
// - The turtle is below and there is no block above
// * The turtle has the same y-coordinate as the block
// - And the same direction as the block and there is a block behind or below the target block
// - Or the opposite direction as the block and there is no block behind or below the target block

export class BlockToPlaceStairlikeTop extends BlockToPlaceFacingHorizontalBase {
  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);
  }

  get dependencyDirections() {
    return Dir.Up | Dir.Down;
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBelow = reachability.at(x, y - 1, z);
    if (isTurtleReachable(reachabilityAbove)) {
      if (isEmpty(reachabilityBelow)) {
        reachabilityDirections |= Dir.Up;
      }
    }

    if (
      isTurtleReachable(reachabilityBelow) &&
      (isBlock(reachabilityAbove) || willHaveBlock(blocksToPlace, x, y + 1, z))
    ) {
      reachabilityDirections |= Dir.Down;
    }

    return reachabilityDirections;
  }

  override isDeadlockable(): boolean {
    return true;
  }
}

export class BlockToPlaceStairlikeBottom extends BlockToPlaceFacingHorizontalBase {
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);

    const facingDir = vectorToSingleDir(facing);
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
    if (isTurtleReachable(reachabilityBelow)) {
      if (isEmpty(reachabilityAbove)) {
        reachabilityDirections |= Dir.Down;
      }
    }

    const isBlockOrWillHaveBlockBelow =
      isBlock(reachabilityBelow) || willHaveBlock(blocksToPlace, x, y - 1, z);
    if (isBlockOrWillHaveBlockBelow && isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }

    if (
      isTurtleReachable(reachabilityBehind) &&
      (isBlockOrWillHaveBlockBelow ||
        isBlock(reachabilityFacing) ||
        willHaveBlock(blocksToPlace, ...facingPos))
    ) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(facing));
    }
    if (
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityBelow) &&
      isTurtleReachable(reachabilityFacing)
    ) {
      reachabilityDirections |= vectorToSingleDir(facing);
    }

    return reachabilityDirections;
  }

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.East | Dir.West) ||
      reachabilityDirections === (Dir.South | Dir.North) ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export function blockToPlaceStairlikeFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockStairlike,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Stair block must have properties');
  const half = properties.half?.value;
  const facing = properties.facing?.value;
  assert(half, 'Stair block must have half property');
  assert(facing, 'Stair block must have facing property');
  let facingVector = facingMapping[facing];
  if (dataDrivenBlock.inverted) {
    facingVector = invertVector(facingVector);
  }

  if (half === 'top') {
    return new BlockToPlaceStairlikeTop(id, pos, items, facingVector);
  }
  if (half === 'bottom') {
    return new BlockToPlaceStairlikeBottom(id, pos, items, facingVector);
  }
  throw new Error(`Invalid half property: ${half}`);
}
