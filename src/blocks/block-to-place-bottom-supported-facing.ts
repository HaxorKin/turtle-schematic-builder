import assert from 'assert';
import { Dir, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import {
  facingMapping,
  invertVector,
  subVectors,
  Vector,
  vectorsEqual,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { DataDrivenBlockBottomSupportedFacing } from './data-parser/data-driven-block.type';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';

// A bottom supported facing block can be placed:
// - From above if the turtle is facing the same direction
// If the turtle is on the side:
// - The turtle is facing the same direction as the block and there is a block below the target block

export class BlockToPlaceBottomSupportedFacing extends bottomSupportedMixin(
  BlockToPlaceBase,
) {
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    dataDrivenBlock: DataDrivenBlockBottomSupportedFacing,
    paletteBlock: PaletteBlock,
  ) {
    super(id, pos, items);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Facing block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Facing block must have facing property');
    let facingVector = facingMapping[facing];
    if (dataDrivenBlock.inverted ?? true) {
      facingVector = invertVector(facingVector);
    }

    this.facing = facingVector;
    this.dependencyDirections =
      Dir.Up | Dir.Down | mirrorDir(vectorToSingleDir(this.facing));
  }

  override isPlaceable(reachability: Reachability, turtle: TurtleState): boolean {
    return (
      this.isConditionSatisfied(reachability) &&
      vectorsEqual(turtle.direction, this.facing)
    );
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;
    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));

    let reachabilityDirections = 0;
    if (isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }
    if (isTurtleReachable(reachabilityBehind)) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(this.facing));
    }

    return reachabilityDirections;
  }
}

export const blockToPlaceBottomSupportedFacingFactory = classFactory(
  BlockToPlaceBottomSupportedFacing,
);
