import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { Vector, vectorsEqual } from '../../components/vector';
import { BlockToPlace } from './block-to-place';
import { BlockToPlaceBase } from './block-to-place-base';

export abstract class BlockToPlaceFacingHorizontalBase extends BlockToPlaceBase {
  abstract readonly facing: Vector;

  override isPlaceable(
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
