import { Reachability } from '../../components/reachability';
import { isBlock } from '../../helpers/reachability-helpers';
import { BlockToPlace } from './block-to-place';
import { BlockToPlaceBase } from './block-to-place-base';

export abstract class BlockToPlaceBottomSupportedBase extends BlockToPlaceBase {
  override isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): boolean;
  override isConditionSatisfied(reachability: Reachability) {
    return isBlock(reachability.at(this[0], this[1] - 1, this[2]));
  }
}
