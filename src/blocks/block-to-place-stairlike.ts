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
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace, BlockToPlaceFacingHorizontalBase } from './block-to-place';
import { invertedStairlikeBlocks } from './block.constants';

// A top half block can be placed if:
// - The turtle is above and there is no block below
// - The turtle is below and there is a block above
// A bottom half block can be placed if:
// - The turtle is above and there is a block below
// - The turtle is below and there is no block above
// * The turtle has the same y-coordinate as the block
// - And the same direction as the block and there is a block behind or below the target block
// - Or the opposite direction as the block and there is no block behind or below the target block

export class BlockToPlaceStairlikeTop
  extends BlockToPlaceFacingHorizontalBase
  implements BlockToPlace
{
  get dependencyDirections() {
    return Dir.Up | Dir.Down;
  }

  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    readonly facing: Vector,
  ) {
    super(id, x, y, z, paletteBlock);
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

  isDeadlockable(): boolean {
    return true;
  }
}

export class BlockToPlaceStairlikeBottom
  extends BlockToPlaceFacingHorizontalBase
  implements BlockToPlace
{
  readonly dependencyDirections: number;

  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    readonly facing: Vector,
  ) {
    super(id, x, y, z, paletteBlock);

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

  isDeadlockable(reachabilityDirections: number): boolean {
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
  x: number,
  y: number,
  z: number,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Stair block must have properties');
  const half = properties.half?.value;
  const facing = properties.facing?.value;
  assert(half, 'Stair block must have half property');
  assert(facing, 'Stair block must have facing property');
  let facingVector = facingMapping[facing];
  facingVector = invertedStairlikeBlocks.has(paletteBlock.Name.value)
    ? subVectors(NULL_VECTOR, facingVector)
    : facingVector;

  switch (half) {
    case 'top':
      return new BlockToPlaceStairlikeTop(id, x, y, z, paletteBlock, facingVector);
    case 'bottom':
      return new BlockToPlaceStairlikeBottom(id, x, y, z, paletteBlock, facingVector);
    default:
      throw new Error(`Invalid half property: ${half}`);
  }
}
