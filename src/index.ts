/* eslint-disable @typescript-eslint/no-magic-numbers */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from '@datastructures-js/priority-queue';
import assert from 'assert';
import { readFile, writeFile } from 'fs/promises';
import { parse } from 'prismarine-nbt';
import { BlockToPlace } from './blocks/bases/block-to-place';
import { BlockToPlaceLiquid } from './blocks/block-to-place-liquid';
import { DataDrivenBlock } from './blocks/data-parser/data-driven-block.type';
import { dataDrivenBlockKey } from './blocks/data-parser/data-parser';
import {
  dataDrivenBlocks as defaultDataDrivenBlocks,
  positionOverrides as defaultPositionOverrides,
} from './blocks/data-parser/parsed-data';
import { Action } from './components/action';
import { AstarNode } from './components/astar-node';
import { GameState, GameStateEnvironment } from './components/game-state';
import { HeuristicOptimizer } from './components/heuristic-optimizer';
import { InventoryState } from './components/inventory/inventory';
import { findPath } from './components/pathfinding';
import { Reachability } from './components/reachability';
import { PaddingOptions, Schematic } from './components/schematic';
import { TurtleState } from './components/turtle-state';
import { EAST, manhattanDistance, subVectors, Vector, WEST } from './components/vector';
import { createBlocksToPlace } from './create-blocks-to-place';
import { boundingBox } from './helpers/bounding-box';
import { createBlockDependencyMap } from './helpers/create-block-dependency-map';
import { generateSteps, generateStepsWithResupply } from './helpers/generate-steps';
import { getActionSequenceFromGoalNode } from './helpers/get-action-sequence-from-goal-node';
import { getStateKey, StateKey } from './helpers/get-state-key';
import { splitIntoChunks } from './helpers/split-into-chunks';

// const nbt = await parse(await readFile('brokemoss1_1.nbt'));
const nbt = await parse(await readFile('malkah.nbt'));

//HACK
function cannotBePlacedBeforeLiquid(
  block: BlockToPlace,
  blocksToPlace: Map<string, BlockToPlace>,
) {
  const positionKeyBelow = `${block[0]},${block[1] - 1},${block[2]}`;
  return (
    blocksToPlace.get(positionKeyBelow) instanceof BlockToPlaceLiquid ||
    blocksToPlace.has(positionKeyBelow + 'w')
  );
  // for (const otherBlock of blocksToPlace.values()) {
  //   if (
  //     otherBlock instanceof BlockToPlaceLiquid &&
  //     // otherBlock[0] === block[0] &&
  //     // otherBlock[2] === block[2] &&
  //     otherBlock[1] < block[1]
  //   ) {
  //     return true;
  //   }
  // }
  // return false;
}

function getResuppliesUpperBound(rootGameState: GameState) {
  // TODO: Waterlogged blocks get added later

  const blocks = [...rootGameState.blocksToPlace.values()];
  let inventory = rootGameState.inventoryCredit;
  let block: BlockToPlace | undefined;
  let resupplies = 0;
  while ((block = blocks.pop())) {
    if (inventory.addableItemsetRatio < 1) {
      inventory = inventory.clear();
      resupplies++;
    }

    inventory = inventory.addItems(
      block.items,
      blocks.map((x) => x.items),
    );
  }

  return resupplies;
}

function heuristicFuncFactory(rootGameState: GameState) {
  const [boundingBoxMin, boundingBoxMax] = boundingBox(
    rootGameState.blocksToPlace.values(),
  );
  const boundingBoxSize = subVectors(boundingBoxMax, boundingBoxMin);
  // // const boundingBoxSize: Vector = [...rootGameState.reachability.size];
  const [tspA, tspB, tspC] = boundingBoxSize.sort((a, b) => a - b);
  const boundingDiagonal = manhattanDistance(boundingBoxMin, boundingBoxMax);
  // const boundingDiagonalX2 = boundingDiagonal * 2;

  const maxResupplies = getResuppliesUpperBound(rootGameState);
  const center: Vector = [
    (boundingBoxMin[0] + boundingBoxMax[0]) / 2,
    (boundingBoxMin[1] + boundingBoxMax[1]) / 2,
    (boundingBoxMin[2] + boundingBoxMax[2]) / 2,
  ];
  const resupplyDistance =
    manhattanDistance(rootGameState.env.supplyPointPosition, center) * 2;

  return function calculateHeuristic(gameState: GameState) {
    const { reachability, blocksToPlace, turtle } = gameState;
    const blocksRemaining = blocksToPlace.size;
    if (blocksRemaining === 0) return 0;

    const blocksPerSide = Math.cbrt(blocksRemaining);
    // Calculate a traveling salesman problem manhattan distance upper bound
    // traveling along one row: tspA
    // traveling along one layer: (tspA * blocksPerSide + tspB)
    // traveling along all layers: layer * blocksPerSide + tspC
    const tspUpperBound = (tspA * blocksPerSide + tspB) * blocksPerSide + tspC;

    const remainingResupplies = Math.max(
      maxResupplies - gameState.inventoryCredit.clearCount,
      0,
    );
    const futureResuppliesCost = remainingResupplies * resupplyDistance;

    // Get the minimum distance to the closest unplaced block
    let minDistance = Infinity;

    const { position } = turtle;
    for (const block of blocksToPlace.values()) {
      const distance = manhattanDistance(position, block);
      if (distance < minDistance) {
        minDistance = distance;
      }
    }

    minDistance *= 2; // TODO: measure?

    if (minDistance <= 20) {
      reachability.bfsFromTurtle(turtle.position, ([x, y, z, distance]) => {
        if (distance > 10) {
          minDistance = 20;
          return true;
        }

        const block = blocksToPlace.get(`${x},${y},${z}`);
        if (
          block?.isConditionSatisfied(reachability, blocksToPlace) &&
          gameState.inventoryCredit.canAddItems(block.items) &&
          !cannotBePlacedBeforeLiquid(block, blocksToPlace)
        ) {
          minDistance = distance;
          return true;
        }
        return false;
      });
    }

    if (minDistance <= 3) {
      return tspUpperBound + futureResuppliesCost;
      // return blocksRemaining + remainingResupplies;
    }

    return tspUpperBound + futureResuppliesCost + minDistance / boundingDiagonal;
    // return blocksRemaining + remainingResupplies + minDistance / boundingDiagonalX2;
  };
}

const stepAfterNoImprovement = 1000;
const heuristicMultiplierStep = 0.05;
const initialHeuristicMultiplierCounter = 20;
const trimSize = 10_000;

async function aStarSearch(
  rootGameState: GameState,
  calculateHeuristic: (gameState: GameState) => number,
) {
  const heuristicOptimizer = new HeuristicOptimizer({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplierCounter,
    trimSize,
  });
  const startNode = new AstarNode(
    rootGameState,
    undefined,
    undefined,
    0,
    heuristicOptimizer.fCost(0, calculateHeuristic(rootGameState)),
    0,
  );
  const openSetBuffer: AstarNode[] = [];
  let openSet = new PriorityQueue<AstarNode>(
    (a, b) => a.fCost - b.fCost,
    openSetBuffer,
  );
  const closedSet = new Map<StateKey, number>();

  openSet.push(startNode);

  let logCounter = 0;
  const logInterval = 1000;
  let currentNode: AstarNode | null;
  while ((currentNode = openSet.pop())) {
    if (++logCounter === logInterval) {
      logCounter = 0;
      console.log(
        `Blocks remaining: ${currentNode.gameState.blocksToPlace.size}, fCost: ${currentNode.fCost.toPrecision(4)}, gCost: ${currentNode.gCost.toPrecision(4)}, hCost: ${currentNode.hCost.toPrecision(4)}, inv: ${currentNode.gameState.inventoryCredit.addableItemsetRatio.toPrecision(4)}`,
      );
    }

    openSet = await heuristicOptimizer.next(
      currentNode,
      openSetBuffer,
      openSet,
      closedSet,
    );

    const { gameState } = currentNode;
    const blocksRemaining = gameState.blocksToPlace.size;
    // If we've placed all blocks, return the node
    if (blocksRemaining === 0) {
      return currentNode;
    }

    // Expand the node and explore its children
    const currentAction = currentNode.action;
    const possibleActions: (Action | [Action, GameState])[] =
      gameState.getPossibleActions();
    if (
      gameState.inventoryCredit.addableItemsetRatio !== 1 &&
      (currentAction === 'place' ||
        currentAction === 'placeDown' ||
        currentAction === 'placeUp')
    ) {
      possibleActions.push('resupply');
    }

    for (const action of possibleActions) {
      const [nextGameState, actionCost] = gameState.executeAction(action);
      const blocksPlaced =
        currentNode.totalBlocksPlaced +
        (gameState.blocksToPlace.size - nextGameState.blocksToPlace.size);

      // Generate a unique key for the state (could use turtle position and remaining blocks)
      const stateKey = getStateKey(nextGameState);
      if (closedSet.has(stateKey)) continue;
      closedSet.set(stateKey, blocksPlaced);

      const actionName = typeof action === 'string' ? action : action[0];

      // Calculate costs
      const newGCost = currentNode.gCost + actionCost;
      const newHCost = calculateHeuristic(nextGameState);
      const newFCost = heuristicOptimizer.fCost(newGCost, newHCost);
      const newNode = new AstarNode(
        nextGameState,
        currentNode,
        actionName,
        newGCost,
        newHCost,
        newFCost,
        blocksPlaced,
      );

      openSet.push(newNode);
    }
  }

  // No solution found
  return undefined;
}

const paddingOptions: PaddingOptions = {
  north: false,
  east: false,
  south: false,
  west: false,
  up: false,
};

const water = {
  name: 'minecraft:water',
  type: 'liquid',
  item: {
    name: 'minecraft:water_bucket',
    stackSize: 1,
  },
  maxMissingSupportBlocks: 0,
} as const;

const customPositionOverrides: DataDrivenBlock[] = [
  // {
  //   ...water,
  //   pos: [8, 2, 1],
  //   maxMissingSupportBlocks: 0,
  // },
  // {
  //   ...water,
  //   pos: [1, 7, 10],
  //   maxMissingSupportBlocks: 0,
  // },
];

const schematic = new Schematic(nbt.parsed, paddingOptions);
// const blockParamsMap = new Map<string, BlockToPlaceParams>(
//   blockParams.map(([[x, y, z, w], params]) => [
//     String(schematic.padVector([x, y, z])) + (w ?? ''),
//     params,
//   ]),
// );

const positionOverrides = new Map<string, DataDrivenBlock>(
  [...defaultPositionOverrides.values(), ...customPositionOverrides].map((block) => {
    assert(block.pos, 'Position override block must have a position');
    const paddedBlock = {
      ...block,
      pos: schematic.padVector(block.pos),
    };
    return [dataDrivenBlockKey(paddedBlock), paddedBlock];
  }),
);

console.log('Creating blocks to place...');
const [allBlocksToPlace, gateMap] = createBlocksToPlace(
  schematic,
  defaultDataDrivenBlocks,
  positionOverrides,
);
console.log('Blocks to place created');
const chunks = splitIntoChunks(allBlocksToPlace, Infinity, 3);
console.log(`Total chunks to process: ${chunks.length}`);

// Turtle starts from bottom left corner facing east
const initialTurtle = new TurtleState([0, 0, 0], EAST);
const supplyPointPosition: Vector = [0, 0, 0];
const supplyPointDirection = WEST; // Behind the turtle at the start
const blockDependencyMap = createBlockDependencyMap(allBlocksToPlace);
const gameStateEnv: GameStateEnvironment = {
  supplyPointPosition,
  supplyPointDirection,
  blockDependencyMap,
};

const initialReachability = new Reachability(
  schematic.size,
  initialTurtle.position,
  gateMap,
);
const initialInventory = new InventoryState();

let currentGameState: GameState | undefined;

const fullActionSequence: Action[] = [];
const startTime = Date.now();
for (let i = 0; i < chunks.length; i++) {
  console.log(
    `Processing chunk ${i + 1}/${chunks.length} with ${chunks[i]!.size} blocks`,
  );

  const blocksToPlace = chunks[i]!;
  const chunkGameState = new GameState(
    gameStateEnv,
    blocksToPlace,
    currentGameState?.turtle ?? initialTurtle,
    currentGameState?.reachability ?? initialReachability,
    currentGameState?.inventoryCredit.resetPossibleItems() ?? initialInventory,
  );

  for (const block of blocksToPlace.values()) {
    if (!block.isReachable(chunkGameState.reachability)) {
      throw new Error(`Block ${block} is not satisfiable`);
    }
  }

  const heuristicFunc = heuristicFuncFactory(chunkGameState);
  const goalNode = await aStarSearch(chunkGameState, heuristicFunc);

  if (!goalNode) {
    throw new Error(`No solution found for chunk ${i + 1}`);
  }

  const bestActionSequence = getActionSequenceFromGoalNode(goalNode);

  console.log(
    `Chunk ${i + 1}: Best action sequence length: ${bestActionSequence.length}`,
  );

  fullActionSequence.push(...bestActionSequence);

  currentGameState = goalNode.gameState;

  console.log(
    `Chunk ${i + 1} processed. Turtle position: ${
      currentGameState.turtle.position
    }, direction: ${currentGameState.turtle.direction}`,
  );
}
const endTime = Date.now();
const duration = endTime - startTime;
const durationMinutes = Math.floor(duration / 60000);
const durationSeconds = ((duration % 60000) / 1000).toFixed(0);
console.log(`Execution time: ${durationMinutes}m ${durationSeconds}s`);

// Simulate the turtle actions and generate the Lua script
const initialGameState = new GameState(
  gameStateEnv,
  allBlocksToPlace,
  initialTurtle,
  initialReachability,
  initialInventory,
);

const luaInit = `local selectedSlot = turtle.getSelectedSlot()
function select(slot)
  if slot ~= selectedSlot then
    turtle.select(slot)
    selectedSlot = slot
  end
end

function clear()
  term.clear()
  term.setCursorPos(1, 1)
end

function selectItem(itemName)
  if not itemName:find(":") then
    itemName = "minecraft:" .. itemName
  end
  for slot = 1, 16 do
    local itemDetail = turtle.getItemDetail(slot)
    if itemDetail and itemDetail.name == itemName then
      select(slot)
      return true
    end
  end
  return false
end

function ensureSelect(itemName)
  if not selectItem(itemName) then
    error("Item " .. itemName .. " not found")
  end
end

function clearFirstSlot(direction)
  local inventory = peripheral.wrap(direction)
  local firstEmptySlot = nil
  for slot = 1, inventory.size() do
    if not inventory.getItemDetail(slot) then
      firstEmptySlot = slot
      break
    end
  end

  if firstEmptySlot then
    if firstEmptySlot ~= 1 then
      inventory.pushItems(direction, 1, nil, firstEmptySlot)
    end
    return true
  end
  return false
end
function suckSlot(direction, slot, limit)
  local itemCount =
    peripheral.call(direction, "pushItems", direction, slot, limit, 1)
  if itemCount == 0 then return 0 end

  if direction == "front" then
    turtle.suck()
  elseif direction == "top" then
    turtle.suckUp()
  elseif direction == "bottom" then
    turtle.suckDown()
  else
    error("Invalid direction")
  end

  return itemCount
end

function isEmptyItemsTable(items)
  for _, count in pairs(items) do
    if count > 0 then return false end
  end
  return true
end

function pullItems(items, direction)
  if isEmptyItemsTable(items) then return end

  local inventory = peripheral.wrap(direction)
  if not inventory then error("No inventory found") end

  if not clearFirstSlot(direction) then error("No empty slot found") end

  for slot = 2, inventory.size() do
    local itemDetail = inventory.getItemDetail(slot)
    if itemDetail then
      local neededItems = items[itemDetail.name]
      if neededItems and neededItems > 0 then
        items[itemDetail.name] = neededItems
          - suckSlot(direction, slot, neededItems)
      end
    end
  end
end

function dump(direction)
  local inventory = peripheral.wrap(direction)
  if not inventory then error("No inventory found") end

  for slot = 1, 16 do
    if turtle.getItemCount(slot) > 0 then
      if inventory.size() < #inventory.list() + 2 then return false end

      select(slot)

      if direction == "front" then
        turtle.drop()
      elseif direction == "top" then
        turtle.dropUp()
      elseif direction == "bottom" then
        turtle.dropDown()
      else
        error("Invalid direction")
      end
    end
  end

  return true
end

function dumpAll(inventories)
  while true do
    for _, inventory in ipairs(inventories) do
      local direction = peripheral.getName(inventory)
      if dump(direction) then return end
    end

    clear()
    print("Please clear the turtle's inventory")
    sleep(1)
  end
end

function refuel(fuelRequirement)
  if turtle.getFuelLevel() >= fuelRequirement then return end

  while true do
    for slot = 1, 16 do
      if turtle.getItemCount(slot) > 0 then
        select(slot)

        while turtle.refuel(1) and turtle.getFuelLevel() < fuelRequirement do
          -- refuel
        end
      end
    end

    local requiredFuel = fuelRequirement - turtle.getFuelLevel()
    if requiredFuel <= 0 then return end

    clear()
    print("Please add fuel to the turtle: " .. requiredFuel)
    sleep(1)
  end
end

function resupply(itemCounts)
  local items = {}
  for key, value in pairs(itemCounts) do
    if key:find(":") then
      items[key] = value
    else
      items["minecraft:" .. key] = value
    end
  end

  local inventories = { peripheral.find("inventory") }
  if #inventories == 0 then error("No inventory found") end

  dumpAll(inventories)

  while true do
    for _, inventory in ipairs(inventories) do
      if isEmptyItemsTable(items) then break end
      local direction = peripheral.getName(inventory)
      pullItems(items, direction)
    end
    if isEmptyItemsTable(items) then break end

    clear()
    print("Please add the following items to one of the chests:")
    for item, count in pairs(items) do
      if count > 0 then
        if item:find("^minecraft:") then item = item:sub(11) end
        print(item .. ": " .. count)
      end
    end

    sleep(1)
  end

  clear()
end

function createTokenHandlers()
  local function forward()
    local needsClear = false
    while not turtle.forward() do
      print("Failed to move forward")
      needsClear = true
      turtle.attack()
    end
    if needsClear then clear() end
  end

  local function up()
    local needsClear = false
    while not turtle.up() do
      print("Failed to move up")
      needsClear = true
      turtle.attackUp()
    end
    if needsClear then clear() end
  end

  local function down()
    local needsClear = false
    while not turtle.down() do
      print("Failed to move down")
      needsClear = true
      turtle.attackDown()
    end
    if needsClear then clear() end
  end

  local function back()
    local needsClear = false
    while not turtle.back() do
      print("Failed to move back")
      needsClear = true
      turtle.turnLeft()
      turtle.turnLeft()
      while turtle.attack() do
        -- attack
      end
      turtle.turnLeft()
      turtle.turnLeft()
    end
    if needsClear then clear() end
  end

  local function turnLeft()
    turtle.turnLeft()
  end

  local function turnRight()
    turtle.turnRight()
  end

  local function place(itemName)
    ensureSelect(itemName)

    local needsClear = false
    while not turtle.place() do
      print("Failed to place")
      needsClear = true
      turtle.attack()
    end
    if needsClear then clear() end
  end

  local function placeUp(itemName)
    ensureSelect(itemName)

    local needsClear = false
    while not turtle.placeUp() do
      print("Failed to placeUp")
      needsClear = true
      turtle.attackUp()
    end
    if needsClear then clear() end
  end

  local function placeDown(itemName)
    ensureSelect(itemName)

    local needsClear = false
    while not turtle.placeDown() do
      print("Failed to placeDown")
      needsClear = true
      turtle.attackDown()
    end
    if needsClear then clear() end
  end

  local function complex(json)
    local params = textutils.unserialiseJSON("[" .. json)
    local command = table.remove(params, 1)
    if command == "redstone" then
      redstone.setAnalogOutput(params[1], params[2])
    else
      error("Unknown complex command: " .. command)
    end
  end

  return {
    ["+"] = forward,
    ["-"] = back,
    ["^"] = up,
    ["v"] = down,
    ["<"] = turnLeft,
    [">"] = turnRight,
    [":"] = place,
    ["'"] = placeUp,
    [","] = placeDown,
    ["["] = complex
  }
end

local tokenHandlers = createTokenHandlers()
function execute(script)
  local lines = script:gmatch("([^\\r\\n]+)")
  for line in lines do
    local firstChar = line:sub(1, 1)
    local handler = tokenHandlers[firstChar]
    if not handler then error("No handler for token: " .. firstChar) end
    local params = nil
    if #line > 1 then
      params = line:sub(2)
    end
    handler(params)
  end
end
`;

const luaCleanup = `]])
clear()
dumpAll({ peripheral.find("inventory") })
print("Build completed")
`;

const hopperCoords = new Set<string>();
const [luaScript, gameState] = generateStepsWithResupply(
  fullActionSequence,
  initialGameState,
  hopperCoords,
);
const pathToOrigin = findPath(
  gameState.turtle.position,
  gameState.turtle.direction,
  initialTurtle.position,
  initialTurtle.direction,
  schematic.size,
  gameState.reachability.originDistance,
);
assert(pathToOrigin, 'No path to origin found');
const [luaScriptToOrigin] = generateSteps(pathToOrigin, gameState, hopperCoords);
const moveActions = ['forward', 'back', 'up', 'down'];
const totalMoves = [...fullActionSequence, ...pathToOrigin].reduce(
  (acc, action) => (moveActions.includes(action) ? acc + 1 : acc),
  0,
);
console.log(`Fuel cost: ${totalMoves}`);

const luaScriptWithRefuel = luaScript.replace('--REFUEL', `refuel(${totalMoves})`);

const fileName = `build_${new Date()
  .toISOString()
  .slice(0, 16)
  .replace(/[-:]/g, '')
  .replace('T', '_')}.lua`;
await writeFile(
  fileName,
  [luaInit, luaScriptWithRefuel, luaScriptToOrigin, luaCleanup].join('\n'),
);

console.log(`Lua script generated: ${fileName}`);
