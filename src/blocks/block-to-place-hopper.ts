import assert from 'assert';
import { Dir, dirCount } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { DOWN, facingMapping, Vector, vectorsEqual } from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceFacingOther } from './block-to-place-facing';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';

export function blockToPlaceHopperFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlock,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Hopper block must have properties');
  const facing = properties.facing?.value;
  assert(facing, 'Hopper block must have facing property');
  const facingVector = facingMapping[facing];

  if (vectorsEqual(facingVector, DOWN)) {
    return new BlockToPlaceHopperDown(id, pos, items);
  } else {
    return new BlockToPlaceHopperDownOther(id, pos, items, facingVector);
  }
}

export class BlockToPlaceHopperDown extends BlockToPlaceBase {
  get dependencyDirections() {
    return Dir.All;
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

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.East | Dir.West) ||
      reachabilityDirections === (Dir.South | Dir.North)
    );
  }
}

export class BlockToPlaceHopperDownOther extends BlockToPlaceFacingOther {}

export const isHopper = (
  block: BlockToPlace,
): block is BlockToPlaceHopperDown | BlockToPlaceHopperDownOther =>
  block instanceof BlockToPlaceHopperDown ||
  block instanceof BlockToPlaceHopperDownOther;
