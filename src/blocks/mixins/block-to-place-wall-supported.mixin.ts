import { AbstractConstructor } from 'type-fest';
import { Reachability } from '../../components/reachability';
import { addVectors, Vector } from '../../components/vector';
import { memoizedMixin } from '../../helpers/decorators/mixin';
import { isBlock } from '../../helpers/reachability-helpers';
import { BlockToPlace } from '../bases/block-to-place';
import { BlockToPlaceBase } from '../bases/block-to-place-base';

export const wallSupportedMixin = memoizedMixin(
  <T extends AbstractConstructor<BlockToPlaceBase>>(Base: T) => {
    abstract class WallSupported extends Base {
      abstract readonly facing: Vector;

      override isConditionSatisfied(
        reachability: Reachability,
        blocksToPlace?: Map<string, BlockToPlace>,
      ): boolean;
      override isConditionSatisfied(reachability: Reachability): boolean {
        return isBlock(reachability.at(...addVectors(this, this.facing)));
      }
    }
    return WallSupported;
  },
);
