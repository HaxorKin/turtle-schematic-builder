import { Reachability } from '../components/reachability';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlaceBase } from './bases/block-to-place-base';

export class BlockToPlaceNormal extends BlockToPlaceBase {
  get dependencyDirections() {
    return undefined;
  }

  override isReachable(reachability: Reachability) {
    return isTurtleReachable(reachability.at(this[0], this[1], this[2]));
  }

  override isPlaceable() {
    return true;
  }

  reachabilityDirections() {
    return undefined;
  }
}

export const blockToPlaceNormalFactory = classFactory(BlockToPlaceNormal);
