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
): { Name: MappedNbt<string>; Properties: MappedNbt<Omit<T, 'name'>> };

function createBlockNbt<T extends { name: string } & CompoundMappedNbtInput>({
  name,
  ...properties
}: T) {
  const block: {
    Name: MappedNbt<string>;
    Properties?: MappedNbt<Omit<T, 'name'>>;
  } = {
    Name: createNbt(name),
  };
  if (Object.keys(properties).length > 0) {
    block.Properties = createNbt(properties);
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
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock =>
  createBlockNbt({
    name: 'minecraft:oak_door',
    facing,
    half: 'lower',
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

export const pressurePlateNbt = createBlockNbt({
  name: 'minecraft:stone_pressure_plate',
  powered: 'false',
} as const) satisfies PaletteBlock;
