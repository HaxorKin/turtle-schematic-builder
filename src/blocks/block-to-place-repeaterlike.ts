import assert from 'assert';
import { Dir, mirrorDir, vectorToSingleDir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import {
  facingMapping,
  NULL_VECTOR,
  subVectors,
  Vector,
  vectorsEqual,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBottomSupportedBase } from './bases/block-to-place-bottom-supported-base';
import { nonInvertedRepeaterlikeBlocks } from './block.constants';

// A repeaterlike block can be placed:
// - From above if the turtle is facing the same direction
// - From below if the turtle is facing the same direction
// If the turtle is on the side:
// - The turtle is facing the same direction as the block and there is a block below the target block

export class BlockToPlaceRepeaterlike
  extends BlockToPlaceBottomSupportedBase
  implements BlockToPlace
{
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    const blockName = paletteBlock.Name.value;
    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Facing block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Facing block must have facing property');
    const facingVector = facingMapping[facing];
    this.facing = nonInvertedRepeaterlikeBlocks.has(blockName)
      ? facingVector
      : subVectors(NULL_VECTOR, facingVector);

    this.dependencyDirections = Dir.Up | mirrorDir(vectorToSingleDir(this.facing));
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

export const blockToPlaceRepeaterlikeFactory = classFactory(BlockToPlaceRepeaterlike);
