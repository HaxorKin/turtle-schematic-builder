import assert from 'assert';
import { BlockToPlace } from './blocks/bases/block-to-place';
import { blockToPlaceAxisFactory } from './blocks/block-to-place-axis';
import { blockToPlaceBottomSupportedFactory } from './blocks/block-to-place-bottom-supported';
import { blockToPlaceBottomSupportedFacingFactory } from './blocks/block-to-place-bottom-supported-facing';
import { blockToPlaceBottomSupportedTwoTallFactory } from './blocks/block-to-place-bottom-supported-two-tall';
import { blockToPlaceDoorFactory } from './blocks/block-to-place-door';
import { blockToPlaceFaceAttachedFacingFactory } from './blocks/block-to-place-face-attached-facing';
import { blockToPlaceFaceFacingFactory } from './blocks/block-to-place-face-facing';
import { blockToPlaceFacingFactory } from './blocks/block-to-place-facing';
import { blockToPlaceFacingHorizontalFactory } from './blocks/block-to-place-facing-horizontal';
import { blockToPlaceGroundSignFactory } from './blocks/block-to-place-ground-sign';
import { blockToPlaceGroundTorchFactory } from './blocks/block-to-place-ground-torch';
import { blockToPlaceHopperFactory } from './blocks/block-to-place-hopper';
import { blockToPlaceLiquidFactory } from './blocks/block-to-place-liquid';
import { blockToPlaceNormalFactory } from './blocks/block-to-place-normal';
import { blockToPlacePistonFactory } from './blocks/block-to-place-piston';
import { blockToPlaceSlabFactory } from './blocks/block-to-place-slab';
import { blockToPlaceStairlikeFactory } from './blocks/block-to-place-stairlike';
import { blockToPlaceTopSupportedFactory } from './blocks/block-to-place-top-supported';
import { blockToPlaceWallAttachedFactory } from './blocks/block-to-place-wall-attached';
import { blockToPlaceWallSignFactory } from './blocks/block-to-place-wall-sign';
import { blockToPlaceWallTorchFactory } from './blocks/block-to-place-wall-torch';
import { DataDrivenBlock } from './blocks/data-parser/data-driven-block.type';
import {
  dataDrivenBlocks as defaultDataDrivenBlocks,
  positionOverrides as defaultPositionOverrides,
} from './blocks/data-parser/parsed-data';
import { Dir } from './components/dir';
import {
  getInventoryItems,
  InventoryItem,
} from './components/inventory/inventory-item';
import { PaletteBlock } from './components/nbt.validator';
import { Reachability } from './components/reachability';
import { Schematic } from './components/schematic';
import { Vector } from './components/vector';
import { WeakrefMap } from './helpers/weakrefmap';

type FactoryArgs<K extends DataDrivenBlock['type']> = [
  id: number,
  pos: Vector,
  items: InventoryItem[],
  dataDrivenBlock: Extract<DataDrivenBlock, { type: K }>,
  paletteBlock: PaletteBlock,
  schematic: Schematic,
];

type FactoryMapping = {
  [K in DataDrivenBlock['type']]: (...args: FactoryArgs<K>) => BlockToPlace | undefined;
};

const factoryMapping: FactoryMapping = {
  todo: (...args) => {
    const dataArgIndex = 3;
    const blockName = args[dataArgIndex].name;
    console.warn(`Block ${blockName} not supported`);
    return undefined;
  },
  ignored: () => undefined,

  axis: blockToPlaceAxisFactory,
  bottomSupported: blockToPlaceBottomSupportedFactory,
  bottomSupportedFacing: blockToPlaceBottomSupportedFacingFactory,
  bottomSupportedTwoTall: blockToPlaceBottomSupportedTwoTallFactory,
  door: blockToPlaceDoorFactory,
  faceAttachedFacing: blockToPlaceFaceAttachedFacingFactory,
  faceFacing: blockToPlaceFaceFacingFactory,
  facing: blockToPlaceFacingFactory,
  facingHorizontal: blockToPlaceFacingHorizontalFactory,
  groundSign: blockToPlaceGroundSignFactory,
  groundTorch: blockToPlaceGroundTorchFactory,
  hopper: blockToPlaceHopperFactory,
  liquid: blockToPlaceLiquidFactory,
  normal: blockToPlaceNormalFactory,
  piston: blockToPlacePistonFactory,
  slab: blockToPlaceSlabFactory,
  stairlike: blockToPlaceStairlikeFactory,
  topSupported: blockToPlaceTopSupportedFactory,
  wallAttached: blockToPlaceWallAttachedFactory,
  wallSign: blockToPlaceWallSignFactory,
  wallTorch: blockToPlaceWallTorchFactory,
} as const;

function callFactory<T extends DataDrivenBlock['type']>(
  blockType: T,
  ...args: FactoryArgs<T>
) {
  const factory = factoryMapping[blockType];
  return factory(...args);
}

type GetPositionOverrideFn = (
  x: number,
  y: number,
  z: number,
  blockName: string,
) => DataDrivenBlock | undefined;

interface CreateBlockToPlaceParams {
  blockIdCounter: number;
  x: number;
  y: number;
  z: number;
  paletteBlock: PaletteBlock;
  schematic: Schematic;
  dataDrivenBlocks: Map<string, DataDrivenBlock>;
  getPositionOverride: GetPositionOverrideFn;
}

const dataDrivenBlockFallbackCache = new WeakrefMap<string, DataDrivenBlock>();
function getDataDrivenBlock(
  dataDrivenBlocks: Map<string, DataDrivenBlock>,
  blockName: string,
) {
  let dataDrivenBlock = dataDrivenBlocks.get(blockName);
  if (dataDrivenBlock) {
    return dataDrivenBlock;
  }

  dataDrivenBlock = dataDrivenBlockFallbackCache.get(blockName);
  if (dataDrivenBlock) {
    return dataDrivenBlock;
  }

  dataDrivenBlock = {
    name: blockName,
    type: 'normal',
  };
  dataDrivenBlockFallbackCache.set(blockName, dataDrivenBlock);
  return dataDrivenBlock;
}

function getDataDrivenBlockWithOverride(
  x: number,
  y: number,
  z: number,
  dataDrivenBlocks: Map<string, DataDrivenBlock>,
  paletteBlock: PaletteBlock,
  getPositionOverride: GetPositionOverrideFn,
): DataDrivenBlock | undefined {
  const blockName = paletteBlock.Name.value;
  if (blockName === 'minecraft:air') {
    return undefined;
  }

  const dataDrivenBlock =
    getPositionOverride(x, y, z, blockName) ??
    getDataDrivenBlock(dataDrivenBlocks, blockName);

  if (dataDrivenBlock.type === 'ignored') {
    return undefined;
  }

  return dataDrivenBlock;
}

function createBlockToPlace({
  blockIdCounter,
  x,
  y,
  z,
  paletteBlock,
  schematic,
  dataDrivenBlocks,
  getPositionOverride,
}: CreateBlockToPlaceParams): [BlockToPlace | undefined, DataDrivenBlock | undefined] {
  const dataDrivenBlock = getDataDrivenBlockWithOverride(
    x,
    y,
    z,
    dataDrivenBlocks,
    paletteBlock,
    getPositionOverride,
  );
  if (!dataDrivenBlock) {
    return [undefined, undefined];
  }

  const items = getInventoryItems(dataDrivenBlock, paletteBlock);

  return [
    callFactory(
      dataDrivenBlock.type,
      blockIdCounter,
      [x, y, z],
      items,
      dataDrivenBlock,
      paletteBlock,
      schematic,
    ),
    dataDrivenBlock,
  ];
}

function isWaterlogged(block: PaletteBlock): boolean {
  return block.Properties?.value.waterlogged?.value === 'true';
}

const waterlogWaterPaletteBlock: PaletteBlock = {
  Name: { type: 'string', value: 'minecraft:water' },
};

interface ProcessBlockParams {
  schematic: Schematic;
  x: number;
  y: number;
  z: number;
  blockIdCounter: number;
  allBlocksToPlace: Map<string, BlockToPlace>;
  dataDrivenBlocks: Map<string, DataDrivenBlock>;
  getPositionOverride: GetPositionOverrideFn;
}

function processBlock({
  schematic,
  x,
  y,
  z,
  blockIdCounter,
  allBlocksToPlace,
  dataDrivenBlocks,
  getPositionOverride,
}: ProcessBlockParams): boolean {
  const paletteBlock = schematic.at(x, y, z);
  const [blockToPlace, dataDrivenBlock] = createBlockToPlace({
    blockIdCounter,
    x,
    y,
    z,
    paletteBlock,
    schematic,
    dataDrivenBlocks,
    getPositionOverride,
  });

  if (blockToPlace) {
    for (const block of [blockToPlace, ...(blockToPlace.extraBlocks ?? [])]) {
      allBlocksToPlace.set(String(block), block);
    }

    if (isWaterlogged(paletteBlock)) {
      const waterlogData = getDataDrivenBlockWithOverride(
        x,
        y,
        z,
        dataDrivenBlocks,
        waterlogWaterPaletteBlock,
        getPositionOverride,
      );
      assert(waterlogData?.type === 'liquid');

      const waterBlock = blockToPlaceLiquidFactory(
        blockIdCounter,
        blockToPlace,
        getInventoryItems(waterlogData, waterlogWaterPaletteBlock),
        waterlogData,
        waterlogWaterPaletteBlock,
        schematic,
        dataDrivenBlock?.mightFailHitscan,
      );
      assert(waterBlock, 'Failed to create water block');
      allBlocksToPlace.set(`${blockToPlace}w`, waterBlock);
    }

    return true;
  }
  return false;
}

function setGates(
  reachability: Reachability,
  gateMap: Uint8Array,
  allBlocksToPlace: Map<string, BlockToPlace>,
) {
  const [width, height] = reachability.size;
  const widthHeight = width * height;

  for (const [key, block] of allBlocksToPlace) {
    if (key.endsWith('w')) {
      continue;
    }
    const gates = block.reachabilityDirections(reachability, allBlocksToPlace);
    if (gates !== undefined) {
      if (gates === 0) {
        throw new Error(`Block ${block} cannot be reached`);
      }
      const [x, y, z] = block;
      gateMap[x + y * width + z * widthHeight] = gates;
    }
  }
}

export function createBlocksToPlace(
  schematic: Schematic,
  dataDrivenBlocks = defaultDataDrivenBlocks,
  positionOverrides = defaultPositionOverrides,
  reachability?: Reachability,
): [Map<string, BlockToPlace>, Uint8Array] {
  const [schematicWidth, schematicHeight, schematicDepth] = schematic.size;
  const gateMap = new Uint8Array(
    schematicWidth * schematicHeight * schematicDepth,
  ).fill(Dir.All);

  reachability ??= new Reachability(schematic.size, [0, 0, 0], gateMap);

  let blockIdCounter = 0;
  const allBlocksToPlace = new Map<string, BlockToPlace>();
  const unusedPositionOverrides = new Set<string>(positionOverrides.keys());
  const getPositionOverride = (x: number, y: number, z: number, blockName: string) => {
    const positionOverrideKey = `${x},${y},${z}:${blockName}`;
    const positionOverride = positionOverrides.get(positionOverrideKey);
    if (positionOverride) {
      unusedPositionOverrides.delete(positionOverrideKey);
    }
    return positionOverride;
  };

  for (let x = 0; x < schematicWidth; x++) {
    for (let y = 0; y < schematicHeight; y++) {
      for (let z = 0; z < schematicDepth; z++) {
        if (
          processBlock({
            schematic,
            x,
            y,
            z,
            blockIdCounter,
            allBlocksToPlace,
            dataDrivenBlocks,
            getPositionOverride,
          })
        ) {
          blockIdCounter++;
        }
      }
    }
  }

  if (unusedPositionOverrides.size > 0) {
    throw new Error(
      `Block parameters not used:\n${[...unusedPositionOverrides].join('\n')}`,
    );
  }

  setGates(reachability, gateMap, allBlocksToPlace);
  return [allBlocksToPlace, gateMap];
}
