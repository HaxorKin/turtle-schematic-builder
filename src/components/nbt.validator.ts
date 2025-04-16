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
      'type?': {
        type: `'string'`,
        value: `string`,
      },
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
      'in_wall?': {
        type: `'string'`,
        value: `'true' | 'false'`,
      },
      'face?': {
        type: `'string'`,
        value: `'floor' | 'wall' | 'ceiling'`,
      },
      'orientation?': {
        type: `'string'`,
        value: `'up_west' | 'up_east' | 'up_north' | 'up_south' | 'down_west' | 'down_east' | 'down_north' | 'down_south' | 'west_up' | 'east_up' | 'north_up' | 'south_up'`,
      },
      'attachment?': {
        type: `'string'`,
        value: `'ceiling' | 'floor' | 'single_wall' | 'double_wall'`,
      },
      'rotation?': {
        type: `'string'`,
        value: `'0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | '11' | '12' | '13' | '14' | '15'`,
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
