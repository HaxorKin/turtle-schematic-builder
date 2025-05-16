import { Constructor } from 'type-fest';
import { dirCount, vectorToSingleDir } from '../../components/dir';
import { InventoryItem } from '../../components/inventory/inventory-item';
import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { Vector, subVectors } from '../../components/vector';
import { isTurtleReachable } from '../../helpers/reachability-helpers';
import { BlockToPlace } from './block-to-place';

export abstract class BlockToPlaceBase
  extends (Array as unknown as Constructor<Vector>)
  implements BlockToPlace
{
  abstract dependencyDirections: number | undefined;

  constructor(
    readonly id: number,
    pos: Vector,
    readonly items: InventoryItem[],
  ) {
    super(...pos);
  }

  isReachable(reachability: Reachability) {
    return isTurtleReachable(reachability.at(this[0], this[1], this[2]));
  }

  isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    if (!this.isConditionSatisfied(reachability, blocksToPlace)) {
      return false;
    }

    // Without blocksToPlace, so only the current state is considered
    const reachabilityDirections = this.reachabilityDirections(reachability);
    if (reachabilityDirections === undefined) {
      return true;
    }

    const dirToTurtle = vectorToSingleDir(subVectors(turtle.position, this));
    return (dirToTurtle & reachabilityDirections) !== 0;
  }

  isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  isConditionSatisfied() {
    return true;
  }

  isDeadlockable(reachabilityDirections: number): boolean {
    return dirCount(reachabilityDirections) <= 1;
  }

  abstract reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number | undefined;
}
