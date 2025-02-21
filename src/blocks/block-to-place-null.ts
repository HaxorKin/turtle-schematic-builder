import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';

export class BlockToPlaceNull extends BlockToPlaceBase implements BlockToPlace {
  get dependencyDirections() {
    return undefined;
  }

  override isReachable(reachability: Reachability): boolean;
  override isReachable() {
    return true;
  }

  override isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  override isConditionSatisfied() {
    return false;
  }

  override isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  override isPlaceable() {
    return false;
  }

  override reachabilityCount(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace> | undefined,
  ): number | undefined;
  override reachabilityCount() {
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
