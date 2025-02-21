import { PaletteBlock } from '../../components/nbt.validator';

export const cobblestoneNbt = {
  Name: {
    type: 'string',
    value: 'minecraft:cobblestone',
  },
} as const satisfies PaletteBlock;

export const airNbt = {
  Name: {
    type: 'string',
    value: 'minecraft:air',
  },
} as const satisfies PaletteBlock;

export const doorNbt = ({
  facing,
}: {
  facing: 'north' | 'east' | 'south' | 'west';
}): PaletteBlock => ({
  Name: {
    type: 'string',
    value: 'minecraft:oak_door',
  },
  Properties: {
    type: 'compound',
    value: {
      facing: {
        type: 'string',
        value: facing,
      },
      half: {
        type: 'string',
        value: 'lower',
      },
      hinge: {
        type: 'string',
        value: 'left',
      },
      open: {
        type: 'string',
        value: 'false',
      },
      powered: {
        type: 'string',
        value: 'false',
      },
    },
  },
});

export const logNbt = ({ axis }: { axis: 'x' | 'y' | 'z' }): PaletteBlock => ({
  Name: {
    type: 'string',
    value: 'minecraft:oak_log',
  },
  Properties: {
    type: 'compound',
    value: {
      axis: {
        type: 'string',
        value: axis,
      },
    },
  },
});

export const pressurePlateNbt = {
  Name: {
    type: 'string',
    value: 'minecraft:stone_pressure_plate',
  },
  Properties: {
    type: 'compound',
    value: {
      powered: {
        type: 'string',
        value: 'false',
      },
    },
  },
} as const satisfies PaletteBlock;
