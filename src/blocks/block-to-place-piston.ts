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
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import {
  DOWN,
  facingMapping,
  invertVector,
  subVectors,
  Vector,
  vectorsEqual,
} from '../components/vector';
import { BlockToPlace } from './bases/block-to-place';
import {
  BlockToPlaceFacingDown,
  BlockToPlaceFacingOther,
} from './block-to-place-facing';
import { BlockToPlaceNull } from './block-to-place-null';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';

export class BlockToPlacePistonhead extends BlockToPlaceNull {}

export class BlockToPlacePistonDown extends BlockToPlaceFacingDown {
  readonly extraBlocks: BlockToPlace[];

  constructor(id: number, pos: Vector, items: InventoryItem[]) {
    super(id, pos, items);

    this.extraBlocks = [new BlockToPlacePistonhead(id, subVectors(pos, DOWN), items)];
  }
}

export class BlockToPlacePistonOther extends BlockToPlaceFacingOther {
  readonly extraBlocks: BlockToPlace[];

  constructor(id: number, pos: Vector, items: InventoryItem[], facing: Vector) {
    super(id, pos, items, facing);

    this.extraBlocks = [
      new BlockToPlacePistonhead(id, subVectors(this, facing), items),
    ];
  }
}

export function blockToPlacePistonFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlock,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Piston block must have properties');
  const facing = properties.facing?.value;
  assert(facing, 'Piston block must have facing property');
  const facingVector = invertVector(facingMapping[facing]);

  if (vectorsEqual(facingVector, DOWN)) {
    return new BlockToPlacePistonDown(id, pos, items);
  } else {
    return new BlockToPlacePistonOther(id, pos, items, facingVector);
  }
}
