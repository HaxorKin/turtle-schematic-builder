import { Reachability } from '../components/reachability';
import { classFactory } from '../helpers/class-factory';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';

export class BlockToPlaceNormal extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return undefined;
  }

  override isReachable(reachability: Reachability) {
    return isTurtleReachable(reachability.at(this[0], this[1], this[2]));
  }

  override isConditionSatisfied() {
    return true;
  }

  override isPlaceable() {
    return true;
  }

  reachabilityDirections() {
    return undefined;
  }
  override reachabilityCount() {
    return undefined;
  }
}

export const blockToPlaceNormalFactory = classFactory(BlockToPlaceNormal);
