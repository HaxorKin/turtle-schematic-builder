import assert from 'assert';
import {
  Dir,
  dirCount,
  mirrorDir,
  vectorsToDirs,
  vectorToSingleDir,
} from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import {
  addVectors,
  DOWN,
  facingMapping,
  NULL_VECTOR,
  subVectors,
  UP,
  Vector,
} from '../components/vector';
import { classFactory } from '../helpers/class-factory';
import { isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceWallAttachedBase } from './bases/block-to-place-wall-attached-base';

// A wall torch can be placed if:
// There is a block behind the target block
// - And there is space for the turtle in front of the target position
// - Or there is space above and below the target position and the turtle has the same facing
// - Or there is space below the target position and the turtle is above the target position
// - Or There is space on all sides (except above, which doesn't matter)

export class BlockToPlaceWallTorch
  extends BlockToPlaceWallAttachedBase
  implements BlockToPlace
{
  readonly facing: Vector;
  readonly left: Vector;
  readonly right: Vector;
  readonly dependencyDirections: number;

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Torch block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Torch block must have facing property');

    // Wall torch facing directions are inverted
    this.facing = subVectors(NULL_VECTOR, facingMapping[facing]);

    const [facingX, , facingZ] = this.facing;
    this.left = [facingZ, 0, -facingX];
    this.right = [-facingZ, 0, facingX];
    this.dependencyDirections = vectorsToDirs(
      UP,
      DOWN,
      subVectors(NULL_VECTOR, this.facing),
      this.left,
      this.right,
    );
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;

    let reachabilityDirections = 0;
    const reachabilityBelow = reachability.at(x, y - 1, z);
    const reachabilityAbove = reachability.at(x, y + 1, z);
    const reachabilityBehind = reachability.at(...subVectors(this, this.facing));
    const reachabilityLeft = reachability.at(...addVectors(this, this.left));
    const reachabilityRight = reachability.at(...addVectors(this, this.right));

    if (isEmpty(reachabilityBelow)) {
      if (isTurtleReachable(reachabilityAbove)) {
        reachabilityDirections |= Dir.Up;
      }
      if (isTurtleReachable(reachabilityBelow)) {
        reachabilityDirections |= Dir.Down;
      }
    }

    if (isTurtleReachable(reachabilityBehind)) {
      reachabilityDirections |= mirrorDir(vectorToSingleDir(this.facing));
    }

    if (
      isEmpty(reachabilityBehind) &&
      isEmpty(reachabilityLeft) &&
      isEmpty(reachabilityRight) &&
      isEmpty(reachabilityBelow)
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
      (reachabilityDirections & (Dir.Up | Dir.Down)) === 0 ||
      reachabilityDirections === (Dir.Up | Dir.Down)
    );
  }
}

export const blockToPlaceWallTorchFactory = classFactory(BlockToPlaceWallTorch);
