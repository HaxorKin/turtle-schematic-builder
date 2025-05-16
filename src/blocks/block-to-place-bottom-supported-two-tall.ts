import assert from 'assert';
import { Dir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import { addVectors, UP, Vector } from '../components/vector';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceNull } from './block-to-place-null';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';

export class BlockToPlaceBottomSupportedTwoTall extends bottomSupportedMixin(
  BlockToPlaceBase,
) {
  readonly extraBlocks: BlockToPlace[];

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    paletteBlock: PaletteBlock,
  ) {
    super(id, pos, items);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Two tall block must have properties');
    assert(
      properties.half?.value === 'lower',
      'Two tall block must be a lower half block',
    );

    this.extraBlocks = [new BlockToPlaceNull(id, addVectors(pos, UP), items)];
  }

  get dependencyDirections() {
    return Dir.Down | Dir.East | Dir.West | Dir.South | Dir.North;
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    if (isTurtleReachable(reachability.at(x + 1, y, z))) {
      reachabilityDirections |= Dir.East;
    }
    if (isTurtleReachable(reachability.at(x - 1, y, z))) {
      reachabilityDirections |= Dir.West;
    }
    if (isTurtleReachable(reachability.at(x, y, z + 1))) {
      reachabilityDirections |= Dir.South;
    }
    if (isTurtleReachable(reachability.at(x, y, z - 1))) {
      reachabilityDirections |= Dir.North;
    }

    return reachabilityDirections;
  }

  override isPlaceable(reachability: Reachability, turtle: TurtleState): boolean {
    const turtleY = turtle.position[1];
    const y = this[1];
    return turtleY === y && this.isConditionSatisfied(reachability);
  }
}

export function blockToPlaceBottomSupportedTwoTallFactory(
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: DataDrivenBlock,
  paletteBlock: PaletteBlock,
) {
  if (paletteBlock.Properties?.value.half?.value === 'lower') {
    return new BlockToPlaceBottomSupportedTwoTall(id, pos, items, paletteBlock);
  }
  return undefined;
}
