import assert from 'assert';
import { Dir, dirCount, mirrorDir, vectorToSingleDir } from '../components/dir';
import { InventoryItem } from '../components/inventory/inventory-item';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  addVectors,
  facingMapping,
  invertVector,
  subVectors,
  Vector,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlaceWallAttachedBase } from './bases/block-to-place-wall-attached-base';
import { DataDrivenBlock } from './data-parser/data-driven-block.type';

// A wall attached block can be placed if:
// There is a block behind the target block
// - And there is space for the turtle in front of the target position
// - Or there is space above the target position and the turtle has the same facing
// - Or there is space below the target position and the turtle has the same facing
// - Or There is space on all sides (except above or below, which don't matter)

export class BlockToPlaceWallAttached extends BlockToPlaceWallAttachedBase {
  readonly facing: Vector;
  readonly left: Vector;
  readonly right: Vector;

  constructor(
    id: number,
    pos: Vector,
    items: InventoryItem[],
    dataDrivenBlock: DataDrivenBlock,
    paletteBlock: PaletteBlock,
  ) {
    super(id, pos, items);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Wall attached block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Wall attached block must have facing property');
    this.facing = invertVector(facingMapping[facing]);

    const [facingX, , facingZ] = this.facing;
    this.left = [facingZ, 0, -facingX];
    this.right = [-facingZ, 0, facingX];
  }

  get dependencyDirections() {
    return Dir.All;
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;

    let reachabilityDirections = 0;
    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));
    const reachabilityLeft = reachability.at(...addVectors(this, this.left));
    const reachabilityRight = reachability.at(...addVectors(this, this.right));

    if (isTurtleReachable(reachabilityAbove)) {
      reachabilityDirections |= Dir.Up;
    }
    if (isTurtleReachable(reachabilityBelow)) {
      reachabilityDirections |= Dir.Down;
    }
    if (isTurtleReachable(reachabilityBehind)) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(this.facing));
    }

    if (
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityLeft) &&
      isEmpty(reachabilityRight)
    ) {
      const facingLeft = vectorToSingleDir(this.left);
      if (isTurtleReachable(reachabilityLeft)) {
        reachabilityDirections |= facingLeft;
      }
      if (isTurtleReachable(reachabilityRight)) {
        reachabilityDirections |= mirrorDir(facingLeft);
      }
    }

    return reachabilityDirections;
  }

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      (reachabilityDirections & (Dir.Up | Dir.Down)) === 0
    );
  }
}

export const blockToPlaceWallAttachedFactory = classFactory(BlockToPlaceWallAttached);
