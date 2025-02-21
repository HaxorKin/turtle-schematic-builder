import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import { BlockToPlace, BlockToPlaceBase } from './block-to-place';

export class BlockToPlaceNull extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return undefined;
  }

  isReachable(reachability: Reachability): boolean;
  isReachable() {
    return true;
  }

  isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  isConditionSatisfied() {
    return false;
  }

  isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  isPlaceable() {
    return false;
  }

  reachabilityCount(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace> | undefined,
  ): number | undefined;
  reachabilityCount() {
    return undefined;
  }

  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace> | undefined,
  ): number | undefined;
  reachabilityDirections() {
    return undefined;
  }
}
