import assert from 'assert';
import { BlockToPlace } from './blocks/bases/block-to-place';
import { blockToPlaceAxisFactory } from './blocks/block-to-place-axis';
import { blockToPlaceBottomSupportedFactory } from './blocks/block-to-place-bottom-supported';
import { blockToPlaceDoorFactory } from './blocks/block-to-place-door';
import { blockToPlaceFacingFactory } from './blocks/block-to-place-facing';
import { blockToPlaceFacingHorizontalFactory } from './blocks/block-to-place-facing-horizontal';
import { blockToPlaceGroundTorchFactory } from './blocks/block-to-place-ground-torch';
import { blockToPlaceHopperFactory } from './blocks/block-to-place-hopper';
import { blockToPlaceLiquidFactory } from './blocks/block-to-place-liquid';
import { blockToPlaceNormalFactory } from './blocks/block-to-place-normal';
import { BlockToPlaceParams } from './blocks/block-to-place-params';
import { blockToPlacePistonFactory } from './blocks/block-to-place-piston';
import { blockToPlaceRepeaterlikeFactory } from './blocks/block-to-place-repeaterlike';
import { blockToPlaceStairlikeFactory } from './blocks/block-to-place-stairlike';
import { blockToPlaceWallAttachedFactory } from './blocks/block-to-place-wall-attached';
import { blockToPlaceWallSignFactory } from './blocks/block-to-place-wall-sign';
import { blockToPlaceWallTorchFactory } from './blocks/block-to-place-wall-torch';
import { copperTypes, woodTypes } from './blocks/block.constants';
import { Dir } from './components/dir';
import { PaletteBlock } from './components/nbt.validator';
import { Reachability } from './components/reachability';
import { Schematic } from './components/schematic';

const normalBlocks = [
  'minecraft:cobblestone',
  'minecraft:cobblestone_wall',
  'minecraft:composter',
  'minecraft:crafting_table',
  'minecraft:glass_pane',
  'minecraft:moss_block',
  'minecraft:mossy_cobblestone',
  'minecraft:oak_fence',
  'minecraft:oak_planks',
  'minecraft:stone',
];

const stairlikeBlocks = [
  ...[...woodTypes, ...copperTypes].map((type) => `minecraft:${type}_stairs`),
  ...['iron', ...woodTypes, ...copperTypes].map((type) => `minecraft:${type}_trapdoor`),
];
const axisBlocks = woodTypes.map((type) => `minecraft:${type}_log`);
const bottomSupportedBlocks = [
  'minecraft:oak_pressure_plate',
  'minecraft:stone_pressure_plate',
  'minecraft:redstone_wire',
];
const doorBlocks = ['minecraft:oak_door'];
const groundTorchBlocks = [
  'minecraft:torch',
  'minecraft:soul_torch',
  'minecraft:redstone_torch',
];
const wallTorchBlocks = [
  'minecraft:wall_torch',
  'minecraft:soul_wall_torch',
  'minecraft:redstone_wall_torch',
];
const wallSignBlocks = woodTypes.map((type) => `minecraft:${type}_wall_sign`);

const wallAttachedBlocks = ['minecraft:ladder'];

const facingBlocks = ['minecraft:observer', 'minecraft:dispenser', 'minecraft:dropper'];
const pistonBlocks = ['minecraft:piston', 'minecraft:sticky_piston'];

const facingHorizontalBlocks = [
  ...woodTypes.map((type) => `minecraft:${type}_fence_gate`),
  'minecraft:chest',
  'minecraft:trapped_chest',
  'minecraft:ender_chest',
  'minecraft:furnace',

  'computercraft:turtle_normal',
  'computercraft:turtle_advanced',
];

const hopperBlocks = ['minecraft:hopper'];
const repeaterlikeBlocks = ['minecraft:repeater', 'minecraft:comparator'];

const liquidBlocks = ['minecraft:water', 'minecraft:lava'];

const factoryMapping = Object.fromEntries(
  (
    [
      [stairlikeBlocks, blockToPlaceStairlikeFactory],
      [axisBlocks, blockToPlaceAxisFactory],
      [bottomSupportedBlocks, blockToPlaceBottomSupportedFactory],
      [doorBlocks, blockToPlaceDoorFactory],
      [groundTorchBlocks, blockToPlaceGroundTorchFactory],
      [wallTorchBlocks, blockToPlaceWallTorchFactory],
      [wallSignBlocks, blockToPlaceWallSignFactory],
      [wallAttachedBlocks, blockToPlaceWallAttachedFactory],
      [normalBlocks, blockToPlaceNormalFactory],
      [facingBlocks, blockToPlaceFacingFactory],
      [facingHorizontalBlocks, blockToPlaceFacingHorizontalFactory],
      [hopperBlocks, blockToPlaceHopperFactory],
      [repeaterlikeBlocks, blockToPlaceRepeaterlikeFactory],
      [liquidBlocks, blockToPlaceLiquidFactory],
      [pistonBlocks, blockToPlacePistonFactory],
    ] as const
  ).flatMap(([blockNames, factory]) =>
    blockNames.map((blockName) => [blockName, factory] as const),
  ),
);

function createBlockToPlace(
  blockIdCounter: number,
  x: number,
  y: number,
  z: number,
  block: PaletteBlock,
  schematic: Schematic,
  blockParameters: Map<string, BlockToPlaceParams>,
): BlockToPlace | undefined {
  const blockName = block.Name.value;
  if (blockName === 'minecraft:air') {
    return undefined;
  }

  const factory = factoryMapping[blockName];
  if (!factory) {
    console.log(`Block ${blockName} not supported`);
    return undefined;
  }

  const blockKey = `${x},${y},${z}`;
  const blockParams = blockParameters.get(blockKey);
  if (blockParams) {
    blockParameters.delete(blockKey);
  }
  return factory(blockIdCounter, x, y, z, block, schematic, blockParams);
}

function isWaterlogged(block: PaletteBlock): boolean {
  return block.Properties?.value.waterlogged?.value === 'true';
}

const waterlogWaterPaletteBlock: PaletteBlock = {
  Name: { type: 'string', value: 'minecraft:water' },
};

interface ProcessBlockParams {
  schematic: Schematic;
  reachability: Reachability;
  x: number;
  y: number;
  z: number;
  blockIdCounter: number;
  allBlocksToPlace: Map<string, BlockToPlace>;
  blockParameters: Map<string, BlockToPlaceParams>;
  gateMap: Uint8Array;
}

function processBlock({
  schematic,
  reachability,
  x,
  y,
  z,
  blockIdCounter,
  allBlocksToPlace,
  blockParameters,
  gateMap,
}: ProcessBlockParams): boolean {
  const paletteBlock = schematic.at(x, y, z);
  const blockToPlace = createBlockToPlace(
    blockIdCounter,
    x,
    y,
    z,
    paletteBlock,
    schematic,
    blockParameters,
  );

  if (blockToPlace) {
    const [width, height] = schematic.size;

    for (const block of [blockToPlace, ...(blockToPlace.extraBlocks ?? [])]) {
      allBlocksToPlace.set(String(block), block);

      const gates = block.reachabilityDirections(reachability, allBlocksToPlace);
      if (gates !== undefined) {
        if (gates === 0) {
          throw new Error(`Block ${block} cannot be reached`);
        }
        const [x, y, z] = block;
        gateMap[x + y * width + z * width * height] = gates;
      }
    }

    if (isWaterlogged(paletteBlock)) {
      const waterloggedKey = String(blockToPlace) + 'w';
      const waterloggedParams = blockParameters.get(waterloggedKey);
      if (waterloggedParams) {
        blockParameters.delete(waterloggedKey);
      }

      const waterBlock = blockToPlaceLiquidFactory(
        blockIdCounter,
        x,
        y,
        z,
        waterlogWaterPaletteBlock,
        schematic,
        waterloggedParams,
      );
      assert(waterBlock, 'Failed to create water block');
      allBlocksToPlace.set(waterloggedKey, waterBlock);
    }

    return true;
  }
  return false;
}

export function createBlocksToPlace(
  schematic: Schematic,
  blockParameters: Map<string, BlockToPlaceParams> | undefined,
  reachability?: Reachability,
): [Map<string, BlockToPlace>, Uint8Array] {
  const [schematicWidth, schematicHeight, schematicDepth] = schematic.size;
  const gateMap = new Uint8Array(
    schematicWidth * schematicHeight * schematicDepth,
  ).fill(Dir.All);

  reachability ??= new Reachability(schematic.size, [0, 0, 0], gateMap.slice());

  let blockIdCounter = 0;
  const allBlocksToPlace = new Map<string, BlockToPlace>();
  blockParameters = new Map(blockParameters); // Copy the map to avoid modifying the original

  for (let x = 0; x < schematicWidth; x++) {
    for (let y = 0; y < schematicHeight; y++) {
      for (let z = 0; z < schematicDepth; z++) {
        if (
          processBlock({
            schematic,
            reachability,
            x,
            y,
            z,
            blockIdCounter,
            allBlocksToPlace,
            blockParameters,
            gateMap,
          })
        ) {
          blockIdCounter++;
        }
      }
    }
  }

  if (blockParameters.size > 0) {
    throw new Error(
      `Block parameters not used: ${[...blockParameters.keys()].join(', ')}`,
    );
  }

  return [allBlocksToPlace, gateMap];
}
