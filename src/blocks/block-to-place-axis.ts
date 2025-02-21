/**
 * An axis aligned block can be placed:
 * - If it's on the Y axis
 *   - The turtle has to be above or below
 *   - Or there is a block below the target block and no block behind the target block
 * - If it's on the X or Z axis, the turtle has to be facing it along the same axis
 *   - And there is a block behind the target block
 *   - Or there is no block behind the target block and no block below the target block
 */

import assert from 'assert';
import { Dir, dirCount } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace, BlockToPlaceBase } from './block-to-place';

export class BlockToPlaceAxisY extends BlockToPlaceBase implements BlockToPlace {
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
    if (isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }

    if (isTurtleReachable(reachabilityBelow)) {
      reachabilityDirections |= Dir.Down;
    }

    if (isBlock(reachabilityBelow) || willHaveBlock(blocksToPlace, x, y - 1, z)) {
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

  isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.East | Dir.West) ||
      reachabilityDirections === (Dir.South | Dir.North)
    );
  }
}

export class BlockToPlaceAxisX extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return Dir.East | Dir.West;
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityEast = reachability.at(x + 1, y, z);
    const reachabilityWest = reachability.at(x - 1, y, z);
    if (isEmpty(reachabilityBelow)) {
      if (isTurtleReachable(reachabilityEast)) {
        reachabilityDirections |= Dir.East;
      }
      if (isTurtleReachable(reachabilityWest)) {
        reachabilityDirections |= Dir.West;
      }
    } else {
      if (
        isTurtleReachable(reachabilityEast) &&
        (isBlock(reachabilityWest) || willHaveBlock(blocksToPlace, x - 1, y, z))
      ) {
        reachabilityDirections |= Dir.East;
      }
      if (
        isTurtleReachable(reachabilityWest) &&
        (isBlock(reachabilityEast) || willHaveBlock(blocksToPlace, x + 1, y, z))
      ) {
        reachabilityDirections |= Dir.West;
      }
    }
    return reachabilityDirections;
  }
}

export class BlockToPlaceAxisZ extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return Dir.South | Dir.North;
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilitySouth = reachability.at(x, y, z + 1);
    const reachabilityNorth = reachability.at(x, y, z - 1);
    if (isEmpty(reachabilityBelow)) {
      if (isTurtleReachable(reachabilitySouth)) {
        reachabilityDirections |= Dir.South;
      }
      if (isTurtleReachable(reachabilityNorth)) {
        reachabilityDirections |= Dir.North;
      }
    } else {
      if (
        isTurtleReachable(reachabilitySouth) &&
        (isBlock(reachabilityNorth) || willHaveBlock(blocksToPlace, x, y, z - 1))
      ) {
        reachabilityDirections |= Dir.South;
      }
      if (
        isTurtleReachable(reachabilityNorth) &&
        (isBlock(reachabilitySouth) || willHaveBlock(blocksToPlace, x, y, z + 1))
      ) {
        reachabilityDirections |= Dir.North;
      }
    }
    return reachabilityDirections;
  }
}

export function blockToPlaceAxisFactory(
  id: number,
  x: number,
  y: number,
  z: number,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Axis block must have properties');
  const axis = properties.axis?.value;
  assert(axis, 'Axis block must have axis property');
  switch (axis) {
    case 'x':
      return new BlockToPlaceAxisX(id, x, y, z, paletteBlock);
    case 'y':
      return new BlockToPlaceAxisY(id, x, y, z, paletteBlock);
    case 'z':
      return new BlockToPlaceAxisZ(id, x, y, z, paletteBlock);
    default:
      throw new Error('Invalid axis');
  }
}
