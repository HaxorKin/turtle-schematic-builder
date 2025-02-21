import { Constructor } from 'type-fest';
import { dirCount, vectorToSingleDir } from '../../components/dir';
import { PaletteBlock } from '../../components/nbt.validator';
import { Reachability } from '../../components/reachability';
import { TurtleState } from '../../components/turtle-state';
import { Vector, subVectors } from '../../components/vector';
import { isTurtleReachable } from '../../helpers/reachability-helpers';
import { blockItemMapping } from '../block.constants';
import { BlockToPlace } from './block-to-place';

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

  abstract reachabilityDirections(
    reachability: Reachability,
    blocksToPlace?: Map<string, BlockToPlace>,
  ): number | undefined;
}
