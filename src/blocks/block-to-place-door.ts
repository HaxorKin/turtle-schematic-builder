import assert from 'assert';
import { Dir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  UP,
  Vector,
  addVectors,
  facingMapping,
  invertVector,
  subVectors,
} from '../components/vector';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceNull } from './block-to-place-null';
import { DataDrivenBlockDoor } from './data-parser/data-driven-block.type';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';

export class BlockToPlaceDoor extends bottomSupportedMixin(BlockToPlaceBase) {
  readonly extraBlocks: BlockToPlace[];
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    readonly facing: Vector,
  ) {
    super(id, pos, items);

    this.dependencyDirections = Dir.Down | vectorToSingleDir(invertVector(facing));
    this.extraBlocks = [new BlockToPlaceDoorUpper(id, addVectors(pos, UP), [], facing)];
  }

  reachabilityDirections(reachability: Reachability): number {
    return isTurtleReachable(reachability.at(...subVectors(this, this.facing)))
      ? vectorToSingleDir(invertVector(this.facing))
      : 0;
  }
}

class BlockToPlaceDoorUpper extends BlockToPlaceNull {
  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    private readonly facing: Vector,
  ) {
    super(id, pos, items);
  }

  override reachabilityDirections(): number {
    return vectorToSingleDir(invertVector(this.facing));
  }
}

export function blockToPlaceDoorFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlockDoor,
  paletteBlock: PaletteBlock,
) {
  const properties = paletteBlock.Properties?.value;
  assert(properties, 'Door block must have properties');

  if (paletteBlock.Properties?.value.half?.value === 'lower') {
    const facing = properties.facing?.value;
    assert(facing, 'Door block must have facing property');
    let facingVector = facingMapping[facing];
    if (dataDrivenBlock.inverted) {
      facingVector = invertVector(facingVector);
    }
    return new BlockToPlaceDoor(id, pos, items, facingVector);
  }
  return undefined;
}
