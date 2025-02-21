import assert from 'assert';
import { Dir } from '../components/dir';
import { PaletteBlock } from '../components/nbt.validator';
import { Reachability } from '../components/reachability';
import { Schematic } from '../components/schematic';
import { TurtleState } from '../components/turtle-state';
import {
  addVectors,
  DOWN,
  manhattanDistance,
  subVectors,
  UP,
} from '../components/vector';
import { isBlock, isTurtleReachable } from '../helpers/reachability-helpers';
import { BlockToPlace } from './bases/block-to-place';
import { BlockToPlaceBase } from './bases/block-to-place-base';
import { BlockToPlaceParams } from './block-to-place-params';
import { mightFailHitscan } from './block.constants';

export class BlockToPlaceLiquid extends BlockToPlaceBase implements BlockToPlace {
  protected static readonly supportBlockRange = 7;
  protected static readonly skyCheckRange = 7;
  protected static readonly skyCheckMaxSteps = 14;

  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    readonly maxMissingSupportBlocks = 1,
  ) {
    super(id, x, y, z, paletteBlock);
  }

  get dependencyDirections() {
    return undefined;
  }

  private static tryToReachSky(
    reachability: Reachability,
    x: number,
    y: number,
    z: number,
    targetY: number,
    minY: number,
    remainingSteps: number,
  ): boolean {
    if (!isTurtleReachable(reachability.at(x, y, z))) {
      return false;
    }

    if (y === targetY) {
      return true;
    }

    if (--remainingSteps === 0) {
      return false;
    }

    const gates = reachability.gatesAt(x, y, z);

    if (
      gates & Dir.Up &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x,
        y + 1,
        z,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }

    if (
      gates & Dir.East &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x + 1,
        y,
        z,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }
    if (
      gates & Dir.West &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x - 1,
        y,
        z,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }
    if (
      gates & Dir.South &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x,
        y,
        z + 1,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }
    if (
      gates & Dir.North &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x,
        y,
        z - 1,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }

    if (
      y > minY &&
      gates & Dir.Down &&
      BlockToPlaceLiquid.tryToReachSky(
        reachability,
        x,
        y - 1,
        z,
        targetY,
        minY,
        remainingSteps,
      )
    ) {
      return true;
    }

    return false;
  }

  override isReachable(reachability: Reachability) {
    if (this.maxMissingSupportBlocks > 0) {
      return isTurtleReachable(reachability.at(...addVectors(this, UP)));
    }

    const [x, y, z] = this;
    const targetY = Math.min(
      reachability.size[1] - 1,
      y + BlockToPlaceLiquid.skyCheckRange,
    );

    return BlockToPlaceLiquid.tryToReachSky(
      reachability,
      x,
      y + 1,
      z,
      targetY,
      y + 1,
      BlockToPlaceLiquid.skyCheckMaxSteps,
    );
  }

  override isConditionSatisfied(
    reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    let missingSupportBlocks = 0;
    for (const otherBlock of blocksToPlace.values()) {
      if (
        otherBlock[1] <= this[1] &&
        manhattanDistance(otherBlock, this) <= BlockToPlaceLiquid.supportBlockRange &&
        !(otherBlock instanceof BlockToPlaceLiquid)
      ) {
        if (++missingSupportBlocks > this.maxMissingSupportBlocks) {
          return false;
        }
      }
    }
    return true;
  }

  override isPlaceable(
    reachability: Reachability,
    _turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    return this.isConditionSatisfied(reachability, blocksToPlace);
  }

  reachabilityDirections(): undefined {
    return undefined;
  }
}

export class BlockToPlaceWater extends BlockToPlaceLiquid implements BlockToPlace {
  private readonly mightFailHitscan: boolean;

  constructor(
    id: number,
    x: number,
    y: number,
    z: number,
    paletteBlock: PaletteBlock,
    private readonly schematic: Schematic,
    maxMissingSupportBlocks?: number,
  ) {
    super(id, x, y, z, paletteBlock, maxMissingSupportBlocks);

    const waterloggedBlock = this.schematic.at(x, y, z);
    this.mightFailHitscan = mightFailHitscan(waterloggedBlock.Name.value);
  }

  override isPlaceable(
    reachability: Reachability,
    turtle: TurtleState,
    blocksToPlace: Map<string, BlockToPlace>,
  ): boolean {
    if (!this.isConditionSatisfied(reachability, blocksToPlace)) {
      return false;
    }

    if (!this.mightFailHitscan) {
      const reachabilityAtBlock = reachability.at(this[0], this[1], this[2]);
      if (isBlock(reachabilityAtBlock)) {
        return true;
      }
    }

    const { position } = turtle;
    const directionFromTurtle = subVectors(this, position);
    const positionOnFace = addVectors(this, directionFromTurtle);
    const reachabilityOnFace = reachability.at(...positionOnFace);
    if (isBlock(reachabilityOnFace)) {
      const onFaceBlock = this.schematic.at(...positionOnFace);
      return onFaceBlock.Properties?.value.waterlogged === undefined;
    }

    if (directionFromTurtle[1] === 0) {
      const reachabilityBelow = reachability.at(...addVectors(this, DOWN));
      if (isBlock(reachabilityBelow)) {
        const belowBlock = this.schematic.at(...addVectors(this, DOWN));
        return belowBlock.Properties?.value.waterlogged === undefined;
      }
    }

    return false;
  }
}

export class BlockToPlaceLava extends BlockToPlaceLiquid implements BlockToPlace {
  override isConditionSatisfied(
    _reachability: Reachability,
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    let missingSupportBlocks = 0;
    for (const otherBlock of blocksToPlace.values()) {
      if (
        otherBlock[1] <= this[1] &&
        manhattanDistance(otherBlock, this) <= BlockToPlaceLiquid.supportBlockRange &&
        !(otherBlock instanceof BlockToPlaceLava)
      ) {
        if (++missingSupportBlocks > this.maxMissingSupportBlocks) {
          return false;
        }
      }
    }
    return true;
  }
}

export function blockToPlaceLiquidFactory(
  id: number,
  x: number,
  y: number,
  z: number,
  paletteBlock: PaletteBlock,
  schematic: Schematic,
  params?: BlockToPlaceParams,
) {
  let maxMissingSupportBlocks: number | undefined;
  if (params) {
    assert(params.type === 'liquid', 'Invalid blockToPlace params');
    maxMissingSupportBlocks = params.maxMissingSupportBlocks;
  }

  if (!paletteBlock.Properties || paletteBlock.Properties.value.level?.value === '0') {
    const blockName = paletteBlock.Name.value;
    if (blockName === 'minecraft:water') {
      return new BlockToPlaceWater(
        id,
        x,
        y,
        z,
        paletteBlock,
        schematic,
        maxMissingSupportBlocks,
      );
    } else if (blockName === 'minecraft:lava') {
      return new BlockToPlaceLava(id, x, y, z, paletteBlock, maxMissingSupportBlocks);
    } else {
      return new BlockToPlaceLiquid(id, x, y, z, paletteBlock, maxMissingSupportBlocks);
    }
  }
  return undefined;
}
