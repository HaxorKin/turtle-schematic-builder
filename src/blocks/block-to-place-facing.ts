/**
 * A facing block can be placed if:
 * - In case it's facing down:
 *   - The turtle is below and there is no block above
 *   - The turtle is above and there is a block below
 *   - The turtle is on any other side and there is a block below but no block behind
 * - The turtle is facing the same direction as the block and there is a block behind the target block
 * - The turtle is facing the opposite direction as the block and there is no block behind and no block below the target block
 */

import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  addVectors,
  DOWN,
  facingMapping,
  invertVector,
  subVectors,
  Vector,
  vectorsEqual,
} from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { DataDrivenBlockFacing } from './data-parser/data-driven-block.type';

export class BlockToPlaceFacingDown extends BlockToPlaceBase {
  get dependencyDirections() {
    return Dir.Up | Dir.Down | Dir.East | Dir.West | Dir.South | Dir.North;
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

      const reachabilityEast = reachability.at(x + 1, y, z);
      const reachabilityWest = reachability.at(x - 1, y, z);
      const reachabilitySouth = reachability.at(x, y, z + 1);
      const reachabilityNorth = reachability.at(x, y, z - 1);
      if (isTurtleReachable(reachabilityEast) && isEmpty(reachabilityWest)) {
        reachabilityDirections |= Dir.East;
      }
      if (isTurtleReachable(reachabilityWest) && isEmpty(reachabilityEast)) {
        reachabilityDirections |= Dir.West;
      }
      if (isTurtleReachable(reachabilitySouth) && isEmpty(reachabilityNorth)) {
        reachabilityDirections |= Dir.South;
      }
      if (isTurtleReachable(reachabilityNorth) && isEmpty(reachabilitySouth)) {
        reachabilityDirections |= Dir.North;
      }
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

export class BlockToPlaceFacingOther extends BlockToPlaceBase {
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);

    const facingDir = vectorToSingleDir(facing);
    this.dependencyDirections = Dir.Down | facingDir | mirrorDir(facingDir);
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
    const facingDir = vectorToSingleDir(facing);

    if (
      isTurtleReachable(reachabilityBehind) &&
      (isBlock(reachabilityFacing) || willHaveBlock(blocksToPlace, ...facingPos))
    ) {
      reachabilityDirections |= mirrorDir(facingDir);
    }

    if (
      isTurtleReachable(reachabilityFacing) &&
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityBelow)
    ) {
      reachabilityDirections |= facingDir;
    }

    return reachabilityDirections;
  }
}

export function blockToPlaceFacingFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockFacing,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Facing block must have properties');
  const facing = properties.facing?.value;
  assert(facing, 'Facing block must have facing property');
  let facingVector = facingMapping[facing];
  if (dataDrivenBlock.inverted ?? true) {
    facingVector = invertVector(facingVector);
  }

  if (vectorsEqual(facingVector, DOWN)) {
    return new BlockToPlaceFacingDown(id, pos, items);
  } else {
    return new BlockToPlaceFacingOther(id, pos, items, facingVector);
  }
}
