import assert from 'assert';
import { NBT } from 'prismarine-nbt';
import { BlockToPlace } from '../../blocks/bases/block-to-place';
import { BlockToPlaceBase } from '../../blocks/bases/block-to-place-base';
import { GameState, GameStateEnvironment } from '../../components/game-state';
import { InventoryState } from '../../components/inventory/inventory';
import { PaletteBlock, SchematicNbt } from '../../components/nbt.validator';
import { Reachability, ReachabilityState } from '../../components/reachability';
import { Schematic } from '../../components/schematic';
import { TurtleState } from '../../components/turtle-state';
import { EAST, NORTH, NULL_VECTOR, SOUTH, Vector, WEST } from '../../components/vector';
import { createBlocksToPlace } from '../../create-blocks-to-place';
import { createBlockDependencyMap } from '../create-block-dependency-map';
import { isBlock } from '../reachability-helpers';
import { airNbt } from './mock-nbts';
import { graphemes } from './text';

class BlockToPlaceTestDummy extends BlockToPlaceBase {
  extraBlocks?: BlockToPlace[];

  constructor(
    id: number,
    pos: Vector,
    public dependencyDirections: number | undefined,
    private readonly _reachabilityDirections?: number,
  ) {
    super(id, pos, []);
  }

  reachabilityDirections(): number | undefined {
    return this._reachabilityDirections;
  }
}

let id = 0;
export function createBlock(
  x: number,
  y: number,
  z: number,
  {
    dependencyDirections,
    reachabilityDirections,
  }: {
    dependencyDirections?: number;
    reachabilityDirections?: number;
  } = {},
) {
  const block = new BlockToPlaceTestDummy(
    ++id,
    [x, y, z],
    dependencyDirections,
    reachabilityDirections,
  );

  return [String(block), block] as const;
}

export type PlacementTestPalette = Record<
  string,
  [PaletteBlock, 'placed' | 'unplaced']
>;
export interface PlacementTestParams {
  /**
   * A string representing the layers of the schematic.
   * Each character represents a block in the palette.
   * The rows are separated by a newline character.
   * The layers are separated by an empty line.
   */
  layers: string;
  palette: PlacementTestPalette;
  origin?: Vector;
  turtleIsOver?: string;
}

export function placementTest({
  layers,
  palette,
  origin = NULL_VECTOR,
  turtleIsOver,
}: PlacementTestParams) {
  const parsedLayers = layers
    .trim()
    .split(/\n[ \t]*\n/)
    .map((layer) => layer.split('\n').map((row) => graphemes(row.trim())));

  const width = parsedLayers[0]?.[0]?.length;
  const depth = parsedLayers[0]?.length;

  assert(width, 'Width must be greater than 0');
  assert(depth, 'Depth must be greater than 0');

  // Assert that all layers have the same width and depth
  for (const layer of parsedLayers) {
    assert(layer.length === depth, 'All layers must have the same depth');
    for (const row of layer) {
      assert(row.length === width, 'All rows must have the same width');
    }
  }

  const nbt = mockNbt({ layers: parsedLayers, palette, turtleIsOver });
  const [turtle, action] = placementTestTurtle(parsedLayers);

  const blockedMap = placementTestBlockedMap(parsedLayers, palette);

  const schematic = new Schematic(nbt as unknown as NBT);

  const [allBlocksToPlace, gateMap] = createBlocksToPlace(schematic, undefined);

  const gameStateEnv: GameStateEnvironment = {
    supplyPointPosition: origin,
    supplyPointDirection: WEST, // Behind the turtle at the start
    blockDependencyMap: createBlockDependencyMap(allBlocksToPlace),
  };
  const reachability = new Reachability(schematic.size, origin, gateMap, blockedMap);
  const inventory = new InventoryState();

  const unplacedBlocks = new Map(
    allBlocksToPlace.entries().filter(
      ([, [x, y, z]]) => !isBlock(reachability.at(x, y, z)), //TODO: Check how it works with water
    ),
  );
  const gameState = new GameState(
    gameStateEnv,
    unplacedBlocks,
    turtle,
    reachability,
    inventory,
  );

  const possibleActions = gameState.getPossibleActions();
  const possibleActionNames = possibleActions.map((action) =>
    typeof action === 'string' ? action : action[0],
  );
  return possibleActionNames.includes(action);
}

function mockNbt({
  layers,
  palette,
  turtleIsOver,
}: {
  layers: string[][][];
  palette: Record<string, [PaletteBlock, ...unknown[]]>;
  turtleIsOver?: string;
}): SchematicNbt {
  const width = layers[0]?.[0]?.length;
  const depth = layers[0]?.length;
  const height = layers.length;

  assert(width, 'Width must be greater than 0');
  assert(depth, 'Depth must be greater than 0');

  const paletteValues = [airNbt, ...Object.values(palette).map(([block]) => block)];
  const paletteIndexes = new Map<string, number>(
    Object.keys(palette).map((key, index) => [key, index + 1]),
  );
  const getPaletteIndex = (char: string) => {
    if ('✖️🔼🔽◀️▶️⏫⏬⏩⏪⬆️⬇️➡️⬅️'.includes(char)) {
      if (char === '✖️' || !turtleIsOver) {
        return 0;
      }
      char = turtleIsOver;
    }

    const index = paletteIndexes.get(char);
    if (index === undefined) {
      throw new Error(`Unknown block character: ${char}`);
    }
    return index;
  };
  const blockIndexToPos = (index: number) => {
    const x = index % width;
    const z = Math.floor(index / width) % depth;
    const y = Math.floor(index / (width * depth));
    return [x, y, z];
  };

  return {
    type: 'compound',
    value: {
      size: {
        type: 'list',
        value: {
          type: 'int',
          value: [width, height, depth],
        },
      },
      blocks: {
        type: 'list',
        value: {
          type: 'compound',
          value: layers
            .flat()
            .flat()
            .map((char, index) => ({
              pos: {
                type: 'list',
                value: {
                  type: 'int',
                  value: blockIndexToPos(index),
                },
              },
              state: {
                type: 'int',
                value: getPaletteIndex(char),
              },
            })),
        },
      },
      palette: {
        type: 'list',
        value: {
          type: 'compound',
          value: paletteValues,
        },
      },
    },
  };
}

const actionAndDirectionMapping: Record<
  string,
  ['place' | 'placeUp' | 'placeDown', Vector]
> = {
  '🔼': ['place', NORTH],
  '🔽': ['place', SOUTH],
  '▶️': ['place', EAST],
  '◀️': ['place', WEST],
  '⏫': ['placeUp', NORTH],
  '⏬': ['placeUp', SOUTH],
  '⏩': ['placeUp', EAST],
  '⏪': ['placeUp', WEST],
  '⬆️': ['placeDown', NORTH],
  '⬇️': ['placeDown', SOUTH],
  '➡️': ['placeDown', EAST],
  '⬅️': ['placeDown', WEST],
};

function placementTestTurtle(
  layers: string[][][],
): [TurtleState, 'place' | 'placeUp' | 'placeDown'] {
  for (let y = 0; y < layers.length; y++) {
    const layer = layers[y];
    assert(layer);
    for (let z = 0; z < layer.length; z++) {
      const row = layer[z];
      assert(row);
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        assert(char);
        const actionAndDirection = actionAndDirectionMapping[char];
        if (actionAndDirection) {
          const [action, direction] = actionAndDirection;
          return [new TurtleState([x, y, z], direction), action];
        }
      }
    }
  }

  throw new Error('No turtle found');
}

function placementTestBlockedMap(
  layers: string[][][],
  palette: Record<string, [unknown, 'placed' | 'unplaced']>,
): Int16Array {
  const width = layers[0]?.[0]?.length;
  const depth = layers[0]?.length;
  const height = layers.length;

  assert(width, 'Width must be greater than 0');
  assert(depth, 'Depth must be greater than 0');

  const blockedMap = new Int16Array(width * height * depth).fill(
    ReachabilityState.Unreachable,
  );

  for (let y = 0; y < layers.length; y++) {
    const layer = layers[y];
    assert(layer);
    for (let z = 0; z < layer.length; z++) {
      const row = layer[z];
      assert(row);
      for (let x = 0; x < row.length; x++) {
        const char = row[x];
        assert(char);
        if (
          !'✖️🔼🔽◀️▶️⏫⏬⏩⏪⬆️⬇️➡️⬅️'.includes(char) &&
          palette[char satisfies string]?.[1] === 'placed'
        ) {
          const index = x + y * width + z * width * height;
          blockedMap[index] = ReachabilityState.Blocked;
        }
      }
    }
  }

  return blockedMap;
}

export function createPlacementTest(palette: PlacementTestPalette) {
  return ({
    it: name,
    layers,
    fail,
    origin = NULL_VECTOR,
    turtleIsOver,
  }: {
    it: string;
    layers: string;
    fail?: boolean;
    origin?: Vector;
    turtleIsOver?: string;
  }) => {
    it(name, () => {
      // When I check if it is placeable
      const result = placementTest({ layers, palette, origin, turtleIsOver });

      // Then it should be placeable
      expect(result).toBe(!fail);
    });
  };
}
