import { type } from 'arktype';

const schematicVector = type({
  type: `'list'`,
  value: {
    type: `'int'`,
    value: `number[]`,
  },
});

const schematicBlock = type({
  pos: schematicVector,
  state: {
    type: `'int'`,
    value: `number`,
  },
});

const schematicBlocks = type({
  type: `'list'`,
  value: {
    type: `'compound'`,
    value: type(schematicBlock, '[]'),
  },
});

const paletteItem = type({
  Name: {
    type: `'string'`,
    value: `string`,
  },
  'Properties?': {
    type: `'compound'`,
    value: {
      'axis?': {
        type: `'string'`,
        value: `'x' | 'y' | 'z'`,
      },
      'waterlogged?': {
        type: `'string'`,
        value: `'true' | 'false'`,
      },
      'facing?': {
        type: `'string'`,
        value: `'north' | 'east' | 'south' | 'west' | 'up' | 'down'`,
      },
      'half?': {
        type: `'string'`,
        value: `'upper' | 'lower' | 'top' | 'bottom'`,
      },
      'level?': {
        type: `'string'`,
        value: `string.integer`,
      },
      'hinge?': {
        type: `'string'`,
        value: `'left' | 'right'`,
      },
      'open?': {
        type: `'string'`,
        value: `'true' | 'false'`,
      },
      'powered?': {
        type: `'string'`,
        value: `'true' | 'false'`,
      },
    },
  },
});

const schematicPalette = type({
  type: `'list'`,
  value: {
    type: `'compound'`,
    value: type(paletteItem, '[]'),
  },
});

export const schematicNbt = type({
  type: `'compound'`,
  value: {
    size: schematicVector,
    blocks: schematicBlocks,
    palette: schematicPalette,
  },
});

export type SchematicNbt = typeof schematicNbt.infer;
export type PaletteBlock = typeof paletteItem.infer;
