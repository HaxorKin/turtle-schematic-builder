import assert from 'assert';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { EAST, invertVector, NORTH, SOUTH, Vector, WEST } from '../components/vector';
import { BlockToPlaceFaceAttachedFacingFloor } from './block-to-place-face-attached-facing';
import { DataDrivenBlockGroundSign } from './data-parser/data-driven-block.type';

const rotationMapping = {
  '0': SOUTH,
  '1': SOUTH,
  '2': SOUTH,
  '3': WEST,
  '4': WEST,
  '5': WEST,
  '6': WEST,
  '7': NORTH,
  '8': NORTH,
  '9': NORTH,
  '10': NORTH,
  '11': EAST,
  '12': EAST,
  '13': EAST,
  '14': EAST,
  '15': SOUTH,
};

export function blockToPlaceGroundSignFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockGroundSign,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Ground sign block must have properties');
  const rotation = properties.rotation?.value;
  assert(rotation, 'Ground sign block must have facing property');
  let facingVector = rotationMapping[rotation];
  if (dataDrivenBlock.inverted ?? true) {
    facingVector = invertVector(facingVector);
  }

  return new BlockToPlaceFaceAttachedFacingFloor(id, pos, items, facingVector);
}
