import { Constructor } from 'type-fest';
import { dirCount, vectorToSingleDir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { TurtleState } from '../components/turtle-state';
import { addVectors, subVectors, Vector, vectorsEqual } from '../components/vector';
import { isBlock, isEmpty, isTurtleReachable } from '../helpers/reachability-helpers';
import { blockItemMapping } from './block.constants';

export interface BlockToPlace extends Vector {
  readonly id: number;
  readonly itemName: string;
  readonly extraBlocks?: BlockToPlace[];

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

  /**
   * Directions, where placed blocks that can affect reachabilityCount,
   * undefined if the block can be placed from any direction
   * */
  readonly dependencyDirections: number | undefined;
}

export abstract class BlockToPlaceBase
  extends (Array as unknown as Constructor<Vector>)
  implements
    Pick<
      BlockToPlace,
      | 'id'
      | 'itemName'
      | 'isReachable'
      | 'isConditionSatisfied'
      | 'reachabilityDirections'
      | 'reachabilityCount'
    >
{
  abstract reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number | undefined;

  readonly itemName: string;

  constructor(
    readonly id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
  ) {
    super(x, y, z);
    const blockName = paletteBlock.Name.value;
    this.itemName = blockItemMapping[blockName] ?? blockName;
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

  reachabilityCount(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ) {
    const reachabilityDirections = this.reachabilityDirections(
      reachability,
      blocksToPlace,
    );
    if (reachabilityDirections === undefined) return undefined;

    return dirCount(reachabilityDirections);
  }

  isDeadlockable(reachabilityDirections: number): boolean {
    return dirCount(reachabilityDirections) <= 1;
  }
}

export abstract class BlockToPlaceBottomSupportedBase extends BlockToPlaceBase {
  isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): boolean;
  isConditionSatisfied(reachability: Reachability) {
    return isBlock(reachability.at(this[0], this[1] - 1, this[2]));
  }
}

export abstract class BlockToPlaceFacingHorizontalBase extends BlockToPlaceBase {
  abstract readonly facing: Vector;

  isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    const turtleY = turtle.position[1];
    const y = this[1];
    return (
      // If the turtle is above or below the target block, it has to be facing the same direction
      (turtleY === y || vectorsEqual(turtle.direction, this.facing)) &&
      super.isPlaceable(reachability, turtle, blocksToPlace)
    );
  }
}

export abstract class BlockToPlaceWallAttachedBase extends BlockToPlaceBase {
  abstract readonly facing: Vector;

  isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): boolean;
  isConditionSatisfied(reachability: Reachability): boolean {
    return isBlock(reachability.at(...addVectors(this, this.facing)));
  }

  private hasSingleWallOption(reachability: Reachability): boolean {
    const [x, y, z] = this;
    const [facingX, , facingZ] = this.facing;
    return (
      isEmpty(reachability.at(x - facingX, y, z - facingZ)) &&
      isEmpty(reachability.at(x - facingZ, y, z + facingX)) &&
      isEmpty(reachability.at(x + facingZ, y, z - facingX))
    );
  }

  isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    const turtleY = turtle.position[1];
    const y = this[1];
    return (
      super.isPlaceable(reachability, turtle, blocksToPlace) &&
      // If the turtle is above or below the target block, it has to be facing the same direction,
      // or there is only one block the target can be placed on
      (turtleY === y ||
        vectorsEqual(turtle.direction, this.facing) ||
        this.hasSingleWallOption(reachability))
    );
  }
}
