import assert from 'assert';
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { isHopper } from '../blocks/block-to-place-hopper';
import { Action, SimpleAction } from '../components/action';
import { GameState } from '../components/game-state';
import { InventoryState } from '../components/inventory/inventory';
import { InventoryItem } from '../components/inventory/inventory-item';
import { addVectors, DOWN, UP } from '../components/vector';

function simplifyItemName(itemName: string): string {
  return itemName.replace(/^minecraft:/, '');
}

function createPlaceInstruction(prefix: ':' | "'" | ',', block: BlockToPlace): string {
  return block.items
    .flatMap((item: InventoryItem) => Array(item.amount).fill(prefix + item.name))
    .join('\n');
}

function processAction(
  action: Exclude<Action, 'resupply'>,
  currentGameState: GameState,
  hopperCoords: Set<string>,
): [newGameState: GameState, luaLine: string] {
  const wasOnHopper = hopperCoords.has(
    String(addVectors(currentGameState.turtle.position, DOWN)),
  );

  let instruction: string;
  switch (action) {
    case 'forward':
      instruction = '+';
      break;
    case 'back':
      instruction = '-';
      break;
    case 'up':
      instruction = '^';
      break;
    case 'down':
      instruction = 'v';
      break;
    case 'turnLeft':
      instruction = '<';
      break;
    case 'turnRight':
      instruction = '>';
      break;
    case 'place': {
      const turtleDirection = currentGameState.turtle.direction;
      const blockPosition = addVectors(
        currentGameState.turtle.position,
        turtleDirection,
      );
      const blockKey = String(blockPosition);
      const block = currentGameState.blocksToPlace.get(blockKey);
      assert(block, 'Block to place not found');

      if (isHopper(block)) {
        hopperCoords.add(blockKey);
      }

      instruction = createPlaceInstruction(':', block);
      break;
    }
    case 'placeUp': {
      const blockPosition = addVectors(currentGameState.turtle.position, UP);
      const blockKey = String(blockPosition);
      const block = currentGameState.blocksToPlace.get(blockKey);
      assert(block, 'Block to place not found');

      if (isHopper(block)) {
        hopperCoords.add(blockKey);
      }

      instruction = createPlaceInstruction("'", block);
      break;
    }
    case 'placeDown': {
      const blockPosition = addVectors(currentGameState.turtle.position, DOWN);
      const blockKey = String(blockPosition);
      const block = currentGameState.blocksToPlace.get(blockKey);
      assert(block, 'Block to place not found');

      if (isHopper(block)) {
        hopperCoords.add(blockKey);
      }

      instruction = createPlaceInstruction(',', block);
      break;
    }
    default:
      throw new Error(`Unknown action: ${action}`);
  }

  [currentGameState] = currentGameState.executeAction(action as Action);
  const isOnHoppper = hopperCoords.has(
    String(addVectors(currentGameState.turtle.position, DOWN)),
  );

  if (wasOnHopper && !isOnHoppper) {
    instruction = `${instruction}\n["redstone","bottom",0]`;
  } else if (!wasOnHopper && isOnHoppper) {
    instruction = `["redstone","bottom",1]\n${instruction}`;
  }

  return [currentGameState, instruction];
}

function generateSuck(inventory: InventoryState) {
  const slots = inventory.toSlots();
  const sums: Record<string, number> = {};
  for (const [itemName, count] of slots) {
    const simplifiedKey = simplifyItemName(itemName);
    sums[simplifiedKey] = (sums[simplifiedKey] ?? 0) + count;
  }

  // eslint-disable-next-line @typescript-eslint/no-magic-numbers
  return `resupply(textutils.unserialiseJSON([[${JSON.stringify(sums, null, 2)}]]))`;
}

export function generateSteps(
  actionSequence: SimpleAction[],
  initialGameState: GameState,
  hopperCoords: Set<string>,
): [string, GameState] {
  let currentGameState = initialGameState;
  const luaLines: string[] = [];

  for (const action of actionSequence) {
    const [newGameState, luaLine] = processAction(
      action,
      currentGameState,
      hopperCoords,
    );
    luaLines.push(luaLine);
    currentGameState = newGameState;
  }

  return [luaLines.join('\n') + '\n', currentGameState];
}

export function generateStepsWithResupply(
  actionSequence: Action[],
  initialGameState: GameState,
  hopperCoords: Set<string>,
): [string, GameState] {
  let currentGameState = initialGameState;
  const luaLines: string[] = [
    'turtle.turnLeft()',
    'turtle.turnLeft()',
    '--REFUEL',
    'turtle.turnLeft()',
    'turtle.turnLeft()',
    'execute([[',
  ];
  let previousResupplyIndex = 3;

  for (const action of actionSequence) {
    if (action === 'resupply') {
      for (const action of currentGameState.getResupplyActions()) {
        const [newGameState, luaLine] = processAction(
          action,
          currentGameState,
          hopperCoords,
        );
        luaLines.push(luaLine);
        currentGameState = newGameState;
      }
      luaLines.push(']])');

      luaLines.splice(
        previousResupplyIndex,
        0,
        generateSuck(currentGameState.inventoryCredit),
      );
      previousResupplyIndex = luaLines.length;
      currentGameState = new GameState(
        currentGameState.env,
        currentGameState.blocksToPlace,
        currentGameState.turtle,
        currentGameState.reachability,
        currentGameState.inventoryCredit.clear(),
      );
      luaLines.push('execute([[');
    } else {
      const [newGameState, luaLine] = processAction(
        action,
        currentGameState,
        hopperCoords,
      );
      luaLines.push(luaLine);
      currentGameState = newGameState;
    }
  }

  luaLines.splice(
    previousResupplyIndex,
    0,
    generateSuck(currentGameState.inventoryCredit),
  );
  return [luaLines.join('\n') + '\n', currentGameState];
}
