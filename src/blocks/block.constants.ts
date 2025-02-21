export const woodTypes = [
  'oak',
  'spruce',
  'birch',
  'jungle',
  'acacia',
  'dark_oak',
  'mangrove',
  'cherry',
  'bamboo',
  'crimson',
  'warped',
] as const;
export const copperTypes = [
  'copper',
  'exposed_copper',
  'weathered_copper',
  'oxidized_copper',
  'waxed_copper',
  'waxed_exposed_copper',
  'waxed_weathered_copper',
  'waxed_oxidized_copper',
] as const;
export const coralTypes = ['tube', 'brain', 'bubble', 'fire', 'horn'] as const;
export const dyeColors = [
  'white',
  'light_gray',
  'gray',
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'lime',
  'green',
  'cyan',
  'light_blue',
  'blue',
  'purple',
  'magenta',
  'pink',
] as const;

export const blockItemMapping: Readonly<Record<string, string>> = {
  'minecraft:water': 'minecraft:water_bucket',
  'minecraft:lava': 'minecraft:lava_bucket',

  'minecraft:wall_torch': 'minecraft:torch',
  'minecraft:soul_wall_torch': 'minecraft:soul_torch',
  'minecraft:redstone_wall_torch': 'minecraft:redstone_torch',

  'minecraft:redstone_wire': 'minecraft:redstone',

  ...Object.fromEntries(
    woodTypes.map((type) => [`minecraft:${type}_wall_sign`, `minecraft:${type}_sign`]),
  ),
};

export const nonInvertedFacingHorizontalBlocks = new Set([
  ...woodTypes.map((type) => `minecraft:${type}_fence_gate`),

  'computercraft:turtle_normal',
  'computercraft:turtle_advanced',
]);

export const nonInvertedFacingBlocks = new Set(['minecraft:observer']);

export const invertedStairlikeBlocks = new Set([
  ...['iron', ...woodTypes, ...copperTypes].map((type) => `minecraft:${type}_trapdoor`),
]);

export const nonInvertedRepeaterlikeBlocks = new Set();

const itemStackLimits: Readonly<Record<string, number>> = {
  'minecraft:water_bucket': 1,
  'minecraft:lava_bucket': 1,
  'minecraft:shulker_box': 1,

  ...Object.fromEntries(woodTypes.map((type) => [`minecraft:${type}_sign`, 16])),
};

const mightFailHitscanBlocks = new Set([
  'minecraft:water',
  'minecraft:lava',
  'minecraft:big_dripleaf',
  'minecraft:small_amethyst_bud',
  'minecraft:medium_amethyst_bud',
  'minecraft:large_amethyst_bud',
  'minecraft:amethyst_cluster',
  'minecraft:rail',
  'minecraft:powered_rail',
  'minecraft:detector_rail',
  'minecraft:activator_rail',
  'minecraft:glow_lichen',
  'minecraft:hanging_roots',
  'minecraft:mangrove_propagule',
  'minecraft:campfire',
  'minecraft:soul_campfire',
  'minecraft:scaffolding',

  ['iron', ...woodTypes, ...copperTypes].map((type) => `minecraft:${type}_trapdoor`),

  'minecraft:candle',
  dyeColors.map((color) => `minecraft:${color}_candle`),
  coralTypes.flatMap((type) => [
    `minecraft:${type}_coral_fan`,
    `minecraft:dead_${type}_coral_fan`,
  ]),
]);

export const getItemStackLimit = (itemName: string): number =>
  itemStackLimits[itemName] ?? 64;

export const mightFailHitscan = (blockName: string): boolean =>
  mightFailHitscanBlocks.has(blockName);
