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
import { PaletteBlock } from '../components/nbt.validator';
import {
  DOWN,
  facingMapping,
  NULL_VECTOR,
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
import { nonInvertedFacingBlocks } from './block.constants';

export class BlockToPlacePistonhead extends BlockToPlaceNull implements BlockToPlace {}

export class BlockToPlacePistonDown
  extends BlockToPlaceFacingDown
  implements BlockToPlace
{
  readonly extraBlocks: BlockToPlace[];

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    this.extraBlocks = [new BlockToPlacePistonhead(id, x, y + 1, z, paletteBlock)];
  }
}

export class BlockToPlacePistonOther
  extends BlockToPlaceFacingOther
  implements BlockToPlace
{
  readonly extraBlocks: BlockToPlace[];

  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    facing: Vector,
  ) {
    super(id, x, y, z, paletteBlock, facing);

    this.extraBlocks = [
      new BlockToPlacePistonhead(id, ...subVectors(this, facing), paletteBlock),
    ];
  }
}

export function blockToPlacePistonFactory(
  id: number,
  x: number,
  y: number,
  z: number,
  paletteBlock: PaletteBlock,
) {
  const blockName = paletteBlock.Name.value;
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Piston block must have properties');
  const facing = properties.facing?.value;
  assert(facing, 'Piston block must have facing property');
  let facingVector = facingMapping[facing];
  if (!nonInvertedFacingBlocks.has(blockName)) {
    //TODO
    facingVector = subVectors(NULL_VECTOR, facingVector);
  }

  if (vectorsEqual(facingVector, DOWN)) {
    return new BlockToPlacePistonDown(id, x, y, z, paletteBlock);
  } else {
    return new BlockToPlacePistonOther(id, x, y, z, paletteBlock, facingVector);
  }
}
