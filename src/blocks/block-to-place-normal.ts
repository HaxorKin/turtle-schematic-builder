import { Reachability } from '../components/reachability';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace, BlockToPlaceBase } from './block-to-place';

export class BlockToPlaceNormal extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return undefined;
  }

  isReachable(reachability: Reachability) {
    return isTurtleReachable(reachability.at(this[0], this[1], this[2]));
  }

  isConditionSatisfied() {
    return true;
  }

  isPlaceable() {
    return true;
  }

  reachabilityDirections() {
    return undefined;
  }
  reachabilityCount() {
    return undefined;
  }
}

export const blockToPlaceNormalFactory = classFactory(BlockToPlaceNormal);
