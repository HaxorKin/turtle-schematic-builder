import { Dir } from '../components/dir';
import { Reachability } from '../components/reachability';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from './../helpers/reachability-helpers';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { bottomSupportedMixin } from './mixins/block-to-place-bottom-supported.mixin';

// A bottom supported block can be placed if:
// - There is space for the turtle on any side of the block other than below
// - And there is a block below the target block
export class BlockToPlaceBottomSupported extends bottomSupportedMixin(
  BlockToPlaceBase,
) {
  get dependencyDirections() {
    return Dir.All;
  }

  reachabilityDirections(reachability: Reachability): number {
    const [x, y, z] = this;
    let reachabilityDirections = 0;

    if (isTurtleReachable(reachability.at(x, y + 1, z))) {
      reachabilityDirections |= Dir.Up;
    }
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

  override isPlaceable(reachability: Reachability): boolean {
    return this.isConditionSatisfied(reachability);
  }
}

export const blockToPlaceBottomSupportedFactory = classFactory(
  BlockToPlaceBottomSupported,
);
