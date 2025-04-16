/**
 * A face attached facing block can be placed if:
 * - In case its face is the floor:
 *   - There is a block below, the turtle has the same facing as the block and
 *     - The turtle is above
 *     - The turtle is behind and there is no block in front
 * - In case its face is the ceiling:
 *   - There is a block above, the turtle the turtle is below with the same facing as the block
 * - In case its face is a wall:
 *   - There is a block behind the target block
 *     - The turtle has the same facing as the target block
 *       - The turtle is above the target block and there is no block below
 *       - The turtle is below the target block and there is no block above
 *     - There is space on all sides
 */

import assert from 'assert';
import {
  Dir,
  dirCount,
  mirrorDir,
  vectorsToDirs,
  vectorToSingleDir,
} from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import {
  addVectors,
  DOWN,
  facingMapping,
  invertVector,
  subVectors,
  UP,
  Vector,
  vectorsEqual,
} from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceWallAttachedBase } from './bases/block-to-place-wall-attached-base';
import { DataDrivenBlockFaceAttachedFacing } from './data-parser/data-driven-block.type';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';
import { topSupportedMixin } from './mixins/block-to-place-top-supported.mixin';

export class BlockToPlaceFaceAttachedFacingFloor extends bottomSupportedMixin(
  BlockToPlaceBase,
) {
  readonly dependencyDirections: number;
  readonly behindDir: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);

    const facingDir = vectorToSingleDir(facing);
    const behindDir = mirrorDir(facingDir);
    this.dependencyDirections = Dir.Up | facingDir | behindDir;
    this.behindDir = behindDir;
  }

  override isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    return (
      vectorsEqual(turtle.direction, this.facing) &&
      super.isPlaceable(reachability, turtle, blocksToPlace)
    );
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityAbove = reachability.at(x, y + 1, z);
    if (isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }

    const reachabilityFacing = reachability.at(...addVectors(this, this.facing));
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));
    if (isTurtleReachable(reachabilityBehind) && isEmpty(reachabilityFacing)) {
      reachabilityDirections |= this.behindDir;
    }
    return reachabilityDirections;
  }
}

export class BlockToPlaceFaceAttachedFacingCeiling extends topSupportedMixin(
  BlockToPlaceBase,
) {
  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);
  }

  get dependencyDirections(): number {
    return Dir.Up | Dir.Down;
  }

  override isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    return (
      vectorsEqual(turtle.direction, this.facing) &&
      super.isPlaceable(reachability, turtle, blocksToPlace)
    );
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);

    if (isTurtleReachable(reachabilityBelow)) {
      if (isBlock(reachabilityAbove) || willHaveBlock(blocksToPlace, x, y + 1, z)) {
        reachabilityDirections |= Dir.Down;
      }
    }

    if (isTurtleReachable(reachabilityAbove)) {
      if (isEmpty(reachabilityBelow)) {
        reachabilityDirections |= Dir.Up;
      }
    }

    return reachabilityDirections;
  }
}

export class BlockToPlaceFaceAttachedFacingWall extends BlockToPlaceWallAttachedBase {
  readonly left: Vector;
  readonly right: Vector;
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);

    const [facingX, , facingZ] = facing;
    this.left = [facingZ, 0, -facingX];
    this.right = [-facingZ, 0, facingX];
    this.dependencyDirections = vectorsToDirs(
      UP,
      DOWN,
      invertVector(this.facing),
      this.left,
      this.right,
    );
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;

    let reachabilityDirections = 0;
    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));
    const reachabilityLeft = reachability.at(...addVectors(this, this.left));
    const reachabilityRight = reachability.at(...addVectors(this, this.right));

    if (isTurtleReachable(reachabilityAbove) && isEmpty(reachabilityBelow)) {
      reachabilityDirections |= Dir.Up;
    }

    if (isTurtleReachable(reachabilityBelow) && isEmpty(reachabilityAbove)) {
      reachabilityDirections |= Dir.Down;
    }

    if (isTurtleReachable(reachabilityBehind)) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(this.facing));
    }

    if (
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityLeft) &&
      isEmpty(reachabilityRight) &&
      isEmpty(reachabilityBelow)
    ) {
      const facingLeft = vectorToSingleDir(this.left);
      if (isTurtleReachable(reachabilityLeft)) {
        reachabilityDirections |= facingLeft;
      }
      if (isTurtleReachable(reachabilityRight)) {
        reachabilityDirections |= mirrorDir(facingLeft);
      }
    }

    return reachabilityDirections;
  }

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      (reachabilityDirections & (Dir.Up | Dir.Down)) === 0 ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export function blockToPlaceFaceAttachedFacingFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockFaceAttachedFacing,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Facing block must have properties');
  const facing = properties.facing?.value;
  assert(facing, 'Facing block must have facing property');
  const face = properties.face?.value ?? properties.attachment?.value;
  assert(face, 'Face facing block must have face property');
  let facingVector = facingMapping[facing];

  switch (face) {
    case 'floor':
      return new BlockToPlaceFaceAttachedFacingFloor(id, pos, items, facingVector);
    case 'ceiling':
      return new BlockToPlaceFaceAttachedFacingCeiling(id, pos, items, facingVector);
    case 'wall':
    case 'single_wall':
    case 'double_wall':
      if (dataDrivenBlock.wallInverted ?? true) {
        facingVector = invertVector(facingVector);
      }
      return new BlockToPlaceFaceAttachedFacingWall(id, pos, items, facingVector);
  }
}
