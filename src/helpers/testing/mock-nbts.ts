import { Except } from 'type-fest';
import { PaletteBlock } from '../../components/nbt.validator';

type MappedNbtInput = string | CompoundMappedNbtInput;

interface CompoundMappedNbtInput {
  [key: string]: MappedNbtInput | string;
}

type MappedNbt<T> = T extends string
  ? { type: 'string'; value: T }
  : T extends CompoundMappedNbtInput
    ? { type: 'compound'; value: { [K in keyof T]: MappedNbt<T[K]> } }
    : never;

function createNbt<T extends MappedNbtInput>(obj: T): MappedNbt<T>;
function createNbt(obj: MappedNbtInput) {
  if (typeof obj === 'string') {
    return { type: 'string', value: obj };
  }

  const compound = Object.fromEntries(
    Object.entries(obj).map(([key, value]) => [key, createNbt(value)]),
  );

  return { type: 'compound', value: compound };
}

function createBlockNbt(params: { name: string }): { Name: MappedNbt<string> };
function createBlockNbt<T extends { name: string } & CompoundMappedNbtInput>(
  params: T,
): { Name: MappedNbt<string>; Properties: MappedNbt<Except<T, 'name'>> };

function createBlockNbt<T extends { name: string } & CompoundMappedNbtInput>({
  name,
  ...properties
}: T) {
  const block: {
    Name: MappedNbt<string>;
    Properties?: MappedNbt<Except<T, 'name'>>;
  } = {
    Name: createNbt(name),
  };
  if (Object.keys(properties).length > 0) {
    block.Properties = createNbt(properties as T as Except<T, 'name'>);
  }
  return block;
}

export const cobblestoneNbt = createBlockNbt({
  name: 'minecraft:cobblestone',
} as const) satisfies PaletteBlock;

export const airNbt = createBlockNbt({
  name: 'minecraft:air',
} as const) satisfies PaletteBlock;

export const doorNbt = ({
  facing,
  half = 'lower',
}: {
  facing: 'north' | 'east' | 'south' | 'west';
  half?: 'upper' | 'lower';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:oak_door',
    facing,
    half,
    hinge: 'left',
    open: 'false',
    powered: 'false',
  } as const);

export const logNbt = ({ axis }: { axis: 'x' | 'y' | 'z' }): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:oak_log',
    axis,
  } as const);

export const fenceGateNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:oak_fence_gate',
    facing,
    in_wall: 'false',
    powered: 'false',
    open: 'false',
  } as const);

export const repeaterNbt = ({
  facing,
  delay = 1,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
  delay?: number;
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:repeater',
    facing,
    delay: String(delay),
    powered: 'false',
  } as const);

export const observerNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west' | 'up' | 'down';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:observer',
    facing,
    powered: 'false',
  } as const);

export const hopperNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west' | 'down';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:hopper',
    facing,
    enabled: 'true',
  } as const);

export const pressurePlateNbt = createBlockNbt({
  name: 'minecraft:stone_pressure_plate',
  powered: 'false',
} as const) satisfies PaletteBlock;

export const torchNbt = createBlockNbt({
  name: 'minecraft:torch',
} as const) satisfies PaletteBlock;

export const wallTorchNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:wall_torch',
    facing,
  } as const);

export const ladderNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:ladder',
    facing,
  } as const);

export const wallSignNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:oak_wall_sign',
    facing,
    waterlogged: 'false',
  } as const);
