import { AbstractConstructor } from 'type-fest';
import { Reachability } from '../../components/reachability';
import { memoizedMixin } from '../../helpers/decorators/mixin';
import { isBlock } from '../../helpers/reachability-helpers';
import { BlockToPlaceBase } from '../bases/block-to-place-base';

export const topSupportedMixin = memoizedMixin(
  <T extends AbstractConstructor<BlockToPlaceBase>>(Base: T) => {
    abstract class TopSupported extends Base {
      override isConditionSatisfied(reachability: Reachability) {
        return isBlock(reachability.at(this[0], this[1] + 1, this[2]));
      }
    }
    return TopSupported;
  },
);
