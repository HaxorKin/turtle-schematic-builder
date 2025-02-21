import assert from 'assert';
import { vectorToSingleDir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { NULL_VECTOR, Vector, facingMapping, subVectors } from '../components/vector';
import { isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBottomSupportedBase } from './bases/block-to-place-bottom-supported-base';
import { BlockToPlaceNull } from './block-to-place-null';

export class BlockToPlaceDoor
  extends BlockToPlaceBottomSupportedBase
  implements BlockToPlace
{
  readonly extraBlocks: BlockToPlace[];
  readonly facing: Vector;
  readonly dependencyDirections: number;

  constructor(id: number, x: number, y: number, z: number, paletteBlock: PaletteBlock) {
    super(id, x, y, z, paletteBlock);

    const properties = paletteBlock.Properties?.value;
    assert(properties, 'Door block must have properties');
    const facing = properties.facing?.value;
    assert(facing, 'Door block must have facing property');
    this.facing = facingMapping[facing];

    assert(properties.half?.value === 'lower', 'Door block must be a lower half block');

    this.dependencyDirections = vectorToSingleDir(subVectors(NULL_VECTOR, this.facing));
    this.extraBlocks = [
      new BlockToPlaceDoorUpper(id, x, y + 1, z, paletteBlock, this.facing),
    ];
  }

  reachabilityDirections(reachability: Reachability): number {
    return isTurtleReachable(reachability.at(...subVectors(this, this.facing)))
      ? this.dependencyDirections
      : 0;
  }
}

class BlockToPlaceDoorUpper extends BlockToPlaceNull implements BlockToPlace {
  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    private readonly facing: Vector,
  ) {
    super(id, x, y, z, paletteBlock);
  }

  override reachabilityDirections(reachability: Reachability): number {
    return isTurtleReachable(reachability.at(...subVectors(this, this.facing)))
      ? vectorToSingleDir(subVectors(NULL_VECTOR, this.facing))
      : 0;
  }
}

export function blockToPlaceDoorFactory(
  id: number,
  x: number,
  y: number,
  z: number,
  paletteBlock: PaletteBlock,
) {
  if (paletteBlock.Properties?.value.half?.value === 'lower') {
    return new BlockToPlaceDoor(id, x, y, z, paletteBlock);
  }
  return undefined;
}
