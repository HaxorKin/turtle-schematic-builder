import { Dir, dirCount } from '../components/dir';
import { Reachability } from '../components/reachability';
import { classFactory } from '../helpers/class-factory';
import { isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';

// A bottom supported torch can be placed if:
// There is a block below the target block
// - And there is space for the turtle on any side of the block other than below and above, as well as on the opposite side of the block
// - Or there is space for the turtle above the block
export class BlockToPlaceGroundTorch extends bottomSupportedMixin(BlockToPlaceBase) {
  get dependencyDirections() {
    return Dir.All;
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;

    let reachabilityDirections = 0;
    const reachabilityAbove = reachability.at(x, y + 1, z);
    if (isTurtleReachable(reachabilityAbove)) reachabilityDirections |= Dir.Up;

    const reachabilityEast = reachability.at(x + 1, y, z);
    const reachabilityWest = reachability.at(x - 1, y, z);
    const reachabilitySouth = reachability.at(x, y, z + 1);
    const reachabilityNorth = reachability.at(x, y, z - 1);

    if (isEmpty(reachabilityEast) && isEmpty(reachabilityWest)) {
      if (isTurtleReachable(reachabilityEast)) reachabilityDirections |= Dir.East;
      if (isTurtleReachable(reachabilityWest)) reachabilityDirections |= Dir.West;
    }

    if (isEmpty(reachabilitySouth) && isEmpty(reachabilityNorth)) {
      if (isTurtleReachable(reachabilitySouth)) reachabilityDirections |= Dir.South;
      if (isTurtleReachable(reachabilityNorth)) reachabilityDirections |= Dir.North;
    }

    return reachabilityDirections;
  }

  override isDeadlockable(reachabilityDirections: number): boolean {
    return (
      dirCount(reachabilityDirections) <= 1 ||
      reachabilityDirections === (Dir.East | Dir.West) ||
      reachabilityDirections === (Dir.South | Dir.North)
    );
  }
}

export const blockToPlaceGroundTorchFactory = classFactory(BlockToPlaceGroundTorch);
