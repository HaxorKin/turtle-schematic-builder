import assert from 'assert';
import { Dir, dirCount } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { Vector } from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { willHaveBlock } from '../helpers/will-have-block';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceNormal } from './block-to-place-normal';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';

// A top slab can be placed if:
// - The turtle is above and there is no block below
// - The turtle is below and there is a block above
// A bottom slab can be placed if:
// - The turtle is above and there is a block below
// - The turtle is below and there is no block above
// - The turtle is facing the target block
// A double slab can be placed like a normal block

export class BlockToPlaceSlabTop extends BlockToPlaceBase {
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

export class BlockToPlaceSlabBottom extends BlockToPlaceBase {
  get dependencyDirections() {
    return Dir.All & ~Dir.Down;
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

    const isBlockOrWillHaveBlockBelow =
      isBlock(reachabilityBelow) || willHaveBlock(blocksToPlace, x, y - 1, z);
    if (isBlockOrWillHaveBlockBelow && isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }

    const reachabilityEast = reachability.at(x + 1, y, z);
    const reachabilityWest = reachability.at(x - 1, y, z);
    const reachabilitySouth = reachability.at(x, y, z + 1);
    const reachabilityNorth = reachability.at(x, y, z - 1);

    if (isTurtleReachable(reachabilityEast)) reachabilityDirections |= Dir.East;
    if (isTurtleReachable(reachabilityWest)) reachabilityDirections |= Dir.West;
    if (isTurtleReachable(reachabilitySouth)) reachabilityDirections |= Dir.South;
    if (isTurtleReachable(reachabilityNorth)) reachabilityDirections |= Dir.North;

    return reachabilityDirections;
  }

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export function blockToPlaceSlabFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlock,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Slab block must have properties');
  const type = properties.type?.value;
  assert(type, 'Slab block must have type property');

  switch (type) {
    case 'top':
      return new BlockToPlaceSlabTop(id, pos, items);
    case 'bottom':
      return new BlockToPlaceSlabBottom(id, pos, items);
    case 'double':
      return new BlockToPlaceNormal(id, pos, items);
    default:
      throw new Error(`Invalid slab type: ${type}`);
  }
}
