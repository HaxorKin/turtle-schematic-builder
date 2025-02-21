import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { Vector, addVectors, vectorsEqual } from '../../components/vector';
import { isBlock, isEmpty } from '../../helpers/reachability-helpers';
import { BlockToPlace } from './block-to-place';
import { BlockToPlaceBase } from './block-to-place-base';

export abstract class BlockToPlaceWallAttachedBase extends BlockToPlaceBase {
  abstract readonly facing: Vector;

  override isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): boolean;
  override isConditionSatisfied(reachability: Reachability): boolean {
    return isBlock(reachability.at(...addVectors(this, this.facing)));
  }

  override isPlaceable(
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

  private hasSingleWallOption(reachability: Reachability): boolean {
    const [x, y, z] = this;
    const [facingX, , facingZ] = this.facing;
    return (
      isEmpty(reachability.at(x - facingX, y, z - facingZ)) &&
      isEmpty(reachability.at(x - facingZ, y, z + facingX)) &&
      isEmpty(reachability.at(x + facingZ, y, z - facingX))
    );
  }
}
