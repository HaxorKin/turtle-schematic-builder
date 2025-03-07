import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { Vector } from '../../components/vector';

export interface BlockToPlace extends Vector {
  readonly id: number;
  readonly itemName: string;
  readonly extraBlocks?: BlockToPlace[];

  /**
   * Directions, where placed blocks that can affect reachabilityCount,
   * undefined if the block can be placed from any direction
   */
  readonly dependencyDirections: number | undefined;

  isReachable(reachability: Reachability): boolean;
  isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;
  isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean;

  /** Directions the block can be placed from, undefined if it's any direction */
  reachabilityDirections(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace> | undefined,
  ): number | undefined;
  /** Number of directions the block can be placed from, undefined if it's any direction */
  reachabilityCount(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace> | undefined,
  ): number | undefined;

  /**
   * Whether a single block can make it impossible to place this block
   * even if it can be placed from more than one direction
   * @param reachabilityDirections The output of reachabilityDirections
   */
  isDeadlockable(reachabilityDirections: number): boolean;
}
