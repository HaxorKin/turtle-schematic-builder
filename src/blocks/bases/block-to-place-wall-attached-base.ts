import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { vectorsEqual } from '../../components/vector';
import { isEmpty } from '../../helpers/reachability-helpers';
import { wallSupportedMixin } from '../mixins/block-to-place-wall-supported.mixin';
import { BlockToPlace } from './block-to-place';
import { BlockToPlaceBase } from './block-to-place-base';

export abstract class BlockToPlaceWallAttachedBase extends wallSupportedMixin(
  BlockToPlaceBase,
) {
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
