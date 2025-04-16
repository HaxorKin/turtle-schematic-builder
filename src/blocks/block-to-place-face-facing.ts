/**
 * A face facing block can be placed if:
 * - In case its face is the floor:
 *   - The turtle has the same facing as the block and
 *     - The turtle is below and there is no block above
 *     - The turtle is above and there is a block below
 *     - The turtle is behind and there is a block below but no block in front
 * - In case its face is the ceiling:
 *   - The turtle has the same facing as the block and
 *     - The turtle is below and there is a block above
 *     - The turtle is above and there is no block below
 * - The turtle is facing the same direction as the block and there is a block behind the target block
 * - The turtle is facing the opposite direction as the block and there is no block behind and no block below the target block
 */

import assert from 'assert';
import { Dir, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import {
  addVectors,
  EAST,
  facingMapping,
  invertVector,
  NORTH,
  SOUTH,
  subVectors,
  Vector,
  vectorsEqual,
  WEST,
} from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceFacingOther } from './block-to-place-facing';
import { DataDrivenBlockFaceFacing } from './data-parser/data-driven-block.type';

export class BlockToPlaceFaceFacingFloor extends BlockToPlaceBase {
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
    this.dependencyDirections = Dir.Up | Dir.Down | facingDir | behindDir;
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

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);
    if (isTurtleReachable(reachabilityBelow)) {
      if (isEmpty(reachabilityAbove)) {
        reachabilityDirections |= Dir.Down;
      }
    }

    if (isBlock(reachabilityBelow) || willHaveBlock(blocksToPlace, x, y - 1, z)) {
      if (isTurtleReachable(reachabilityAbove)) {
        reachabilityDirections |= Dir.Up;
      }

      const reachabilityFacing = reachability.at(...addVectors(this, this.facing));
      const reachabilityBehind = reachability.at(...subVectors(this, this.facing));
      if (isTurtleReachable(reachabilityBehind) && isEmpty(reachabilityFacing)) {
        reachabilityDirections |= this.behindDir;
      }
    }
    return reachabilityDirections;
  }
}

export class BlockToPlaceFaceFacingCeiling extends BlockToPlaceBase {
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

const orientationMapping = {
  up_west: ['floor', WEST],
  up_east: ['floor', EAST],
  up_north: ['floor', NORTH],
  up_south: ['floor', SOUTH],
  down_west: ['ceiling', WEST],
  down_east: ['ceiling', EAST],
  down_north: ['ceiling', NORTH],
  down_south: ['ceiling', SOUTH],
  west_up: ['wall', WEST],
  east_up: ['wall', EAST],
  north_up: ['wall', NORTH],
  south_up: ['wall', SOUTH],
} as const;

/**
 * Factory function to create appropriate face facing block instances
 * @param id Block ID
 * @param pos Block position
 * @param items Inventory items
 * @param dataDrivenBlock The data-driven block configuration
 * @param dataDrivenBlock.floorInverted Whether the facing direction should be inverted for floor face blocks, defaults to `false`
 * @param dataDrivenBlock.ceilingInverted Whether the facing direction should be inverted for ceiling face blocks, defaults to `false`
 * @param dataDrivenBlock.wallInverted Whether the facing direction should be inverted for wall face blocks, defaults to `true`
 * @param paletteBlock The palette block data
 */
export function blockToPlaceFaceFacingFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockFaceFacing,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Facing block must have properties');
  const orientation = properties.orientation?.value;

  let face: 'floor' | 'ceiling' | 'wall' | undefined;
  let facingVector: Vector;
  if (orientation) {
    [face, facingVector] = orientationMapping[orientation];
  } else {
    const facing = properties.facing?.value;
    assert(facing, 'Facing block must have facing property');
    face = properties.face?.value;
    assert(face, 'Facing block must have face property');
    facingVector = facingMapping[facing];
  }

  switch (face) {
    case 'floor':
      if (dataDrivenBlock.floorInverted) {
        facingVector = invertVector(facingVector);
      }
      return new BlockToPlaceFaceFacingFloor(id, pos, items, facingVector);
    case 'ceiling':
      if (dataDrivenBlock.ceilingInverted) {
        facingVector = invertVector(facingVector);
      }
      return new BlockToPlaceFaceFacingCeiling(id, pos, items, facingVector);
    case 'wall':
      if (dataDrivenBlock.wallInverted ?? true) {
        facingVector = invertVector(facingVector);
      }
      return new BlockToPlaceFacingOther(id, pos, items, facingVector);
  }
}
