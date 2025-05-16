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
import { BuildSimulator } from './components/lua/generate-steps';
import { PathNode, Reachability } from './components/reachability';
import { PaddingOptions, Schematic } from './components/schematic';
import { TurtleState } from './components/turtle-state';
import {
  EAST,
  manhattanDistance,
  subVectors,
  Vector,
  vectorsEqual,
  WEST,
} from './components/vector';
import { createBlocksToPlace } from './create-blocks-to-place';
import { boundingBox } from './helpers/bounding-box';
import { createBlockDependencyMap } from './helpers/create-block-dependency-map';
import { getActionSequenceFromGoalNode } from './helpers/get-action-sequence-from-goal-node';
import { getStateKey, StateKey } from './helpers/get-state-key';
import { noop } from './helpers/noop';
import { splitIntoChunks } from './helpers/split-into-chunks';
import { mapTryToAdd, setTryToAdd } from './helpers/try-to-add';

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
  // const boundingDiagonal = manhattanDistance(boundingBoxMin, boundingBoxMax);
  // const boundingDiagonalX2 = boundingDiagonal * 2;

  const maxResupplies = getResuppliesUpperBound(rootGameState);
  const center: Vector = [
    (boundingBoxMin[0] + boundingBoxMax[0]) / 2,
    (boundingBoxMin[1] + boundingBoxMax[1]) / 2,
    (boundingBoxMin[2] + boundingBoxMax[2]) / 2,
  ];
  const resupplyDistance =
    manhattanDistance(rootGameState.env.supplyPointPosition, center) * 2;

  type TargetBlockMapEntry = [BlockToPlace, PathNode[], BlockToPlace?, PathNode[]?];
  const targetBlockMap = new WeakMap<GameState, TargetBlockMapEntry>();
  const incompleteChunksCache = new WeakMap<Reachability, number>();

  const [width, height, depth] = rootGameState.reachability.size;
  const chunkSize = 3;

  // compute number of chunks in each dimension
  const numChunksX = Math.ceil(width / chunkSize);
  const numChunksY = Math.ceil(height / chunkSize);
  const numChunksZ = Math.ceil(depth / chunkSize);
  const numChunksXY = numChunksX * numChunksY;
  const totalChunks = numChunksXY * numChunksZ;

  // use a Uint8Array to mark incomplete chunks
  const incompleteChunks = new Uint8Array(totalChunks);
  let maxIncompleteChunks = 0;
  for (const block of rootGameState.blocksToPlace.values()) {
    const [x, y, z] = block;
    const chunkX = Math.floor(x / chunkSize);
    const chunkY = Math.floor(y / chunkSize);
    const chunkZ = Math.floor(z / chunkSize);
    const index = chunkX + chunkY * numChunksX + chunkZ * numChunksXY;
    if (!incompleteChunks[index]) {
      incompleteChunks[index] = 1;
      maxIncompleteChunks++;
    }
  }

  function minDistanceHeuristic(
    gameState: GameState,
    isClosedTargetBlock: (block: BlockToPlace) => boolean,
    parentGameState?: GameState,
  ) {
    const {
      reachability,
      blocksToPlace,
      blocksToPlaceHash,
      turtle: { position },
    } = gameState;
    let minDistance: number | undefined;
    let path: PathNode[] | undefined;

    reachability.bfsFromTurtle(position, ([x, y, z, distance]) => {
      if (distance > 3) {
        return true;
      }

      const block = blocksToPlace.get(`${x},${y},${z}`);
      if (
        block?.isConditionSatisfied(reachability, blocksToPlace) &&
        gameState.inventoryCredit.canAddItems(block.items) &&
        !cannotBePlacedBeforeLiquid(block, blocksToPlace) &&
        !isClosedTargetBlock(block)
      ) {
        minDistance = distance;
        return true;
      }
      return false;
    });
    if (minDistance !== undefined) {
      return minDistance;
    }

    let targetBlock: BlockToPlace | undefined;
    let parentClosestBlock: BlockToPlace | undefined;
    let parentClosestBlockPath: PathNode[] | undefined;
    let minManhattanDistance = Infinity;
    if (blocksToPlaceHash === parentGameState?.blocksToPlaceHash) {
      const parentTargetBlockEntry = targetBlockMap.get(parentGameState);
      if (parentTargetBlockEntry) {
        let parentTargetBlock: BlockToPlace;
        let parentPath: PathNode[];
        [parentTargetBlock, parentPath, parentClosestBlock, parentClosestBlockPath] =
          parentTargetBlockEntry;
        if (!isClosedTargetBlock(parentTargetBlock)) {
          targetBlock = parentTargetBlock;
          path = reachability.path(position, targetBlock, parentPath);
          minDistance = path.length;
          if (minDistance < parentPath.length) {
            targetBlockMap.set(gameState, [
              targetBlock,
              path,
              parentClosestBlock,
              parentClosestBlockPath,
            ]);
            return minDistance;
          }
          minManhattanDistance = manhattanDistance(position, targetBlock);
        }
      }
    }

    let closestBlock: BlockToPlace | undefined;
    for (const block of blocksToPlace.values()) {
      const distance = manhattanDistance(position, block);
      if (
        distance < minManhattanDistance &&
        block.isConditionSatisfied(reachability, blocksToPlace) &&
        gameState.inventoryCredit.canAddItems(block.items) &&
        !cannotBePlacedBeforeLiquid(block, blocksToPlace) &&
        !isClosedTargetBlock(block)
      ) {
        minManhattanDistance = distance;
        closestBlock = block;
      }
    }

    let closestBlockPath: PathNode[] | undefined;
    if (!closestBlock) {
      if (!targetBlock) {
        return 0;
      }
    } else if (closestBlock !== targetBlock) {
      const closestBlockPathCache =
        parentClosestBlock === closestBlock ? parentClosestBlockPath : undefined;
      // closestBlock might be blocked (for waterlogging) so use it as the starting point,
      // which is not checked
      closestBlockPath = reachability.path(
        position,
        closestBlock,
        closestBlockPathCache,
      );
      const closestBlockDistance = closestBlockPath.length;
      if (minDistance === undefined || closestBlockDistance < minDistance) {
        path = closestBlockPath;
        minDistance = closestBlockDistance;
        targetBlock = closestBlock;
      }
    }

    targetBlockMap.set(gameState, [
      targetBlock!,
      path!,
      closestBlock,
      closestBlockPath,
    ]);
    return minDistance!;
  }

  return function calculateHeuristic(
    gameState: GameState,
    isClosedTargetBlock: (block: BlockToPlace) => boolean,
    closedTargetBlockCount: number,
    parentGameState?: GameState,
    parentHeuristic?: number,
  ) {
    const { blocksToPlace, turtle, blocksToPlaceHash, reachability } = gameState;
    if (
      parentGameState &&
      vectorsEqual(turtle.position, parentGameState.turtle.position) &&
      blocksToPlaceHash === parentGameState.blocksToPlaceHash
    ) {
      const targetBlockEntry = targetBlockMap.get(parentGameState);
      if (targetBlockEntry) targetBlockMap.set(gameState, targetBlockEntry);
      return parentHeuristic!;
    }

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
    const minDistance = minDistanceHeuristic(
      gameState,
      isClosedTargetBlock,
      parentGameState,
    );

    const baseHeuristic = tspUpperBound + futureResuppliesCost + closedTargetBlockCount;
    if (minDistance <= 3) {
      return baseHeuristic;
    }

    let incompleteChunksCount = incompleteChunksCache.get(reachability);
    if (incompleteChunksCount === undefined) {
      incompleteChunksCount = 0;
      incompleteChunks.fill(0);
      for (const block of blocksToPlace.values()) {
        const [x, y, z] = block;
        const chunkX = Math.floor(x / chunkSize);
        const chunkY = Math.floor(y / chunkSize);
        const chunkZ = Math.floor(z / chunkSize);
        const index = chunkX + chunkY * numChunksX + chunkZ * numChunksXY;
        if (!incompleteChunks[index]) {
          incompleteChunks[index] = 1;
          incompleteChunksCount++;
        }
      }
      incompleteChunksCache.set(reachability, incompleteChunksCount);
    }
    const incompleteChunksRate = incompleteChunksCount / maxIncompleteChunks;

    return baseHeuristic + minDistance * incompleteChunksRate;
  };
}

const stepAfterNoImprovement = 300;
const heuristicMultiplierStep = 0.05;
const initialHeuristicMultiplierCounter = 20;
const trimSize = 10_000;
const retries = 10;

const returnFalse = () => false;
function getClosedTargetBlockFunc(
  gameState: GameState,
  closedTargetBlocks: Map<number, [Set<BlockToPlace>, number]>,
): [(block: BlockToPlace) => boolean, number] {
  const currentClosedTargetBlocks = closedTargetBlocks.get(
    gameState.blocksToPlaceHash,
  )?.[0];

  if (!currentClosedTargetBlocks) {
    return [returnFalse, 0];
  }

  return [
    (block: BlockToPlace) => currentClosedTargetBlocks.has(block),
    currentClosedTargetBlocks.size,
  ];
}

async function aStarSearch(
  rootGameState: GameState,
  calculateHeuristic: (
    gameState: GameState,
    isClosedTargetBlock: (block: BlockToPlace) => boolean,
    closedTargetBlockCount: number,
    parentGameState?: GameState,
    parentHeuristic?: number,
  ) => number,
  log: (node: AstarNode) => void = noop,
  logInterval = 1000,
) {
  const heuristicOptimizer = new HeuristicOptimizer({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplierCounter,
    trimSize,
    previousBestsToKeep: retries,
  });
  const startNode = new AstarNode(
    rootGameState,
    undefined,
    undefined,
    0,
    heuristicOptimizer.fCost(0, calculateHeuristic(rootGameState, returnFalse, 0)),
    0,
  );
  const openSetBuffer: AstarNode[] = [];
  let openSet = new PriorityQueue<AstarNode>(
    (a, b) => a.fCost - b.fCost,
    openSetBuffer,
  );
  const closedSet = new Map<StateKey, bigint>();
  const closedTargetBlocks = new Map<number, [Set<BlockToPlace>, number]>();

  openSet.push(startNode);

  let logCounter = 0;
  let currentNode: AstarNode | null;
  let retry = 0;
  while (true) {
    while ((currentNode = openSet.pop())) {
      const gameState = currentNode.gameState;
      if (!gameState) {
        // Might be in case of best was added back multiple times
        continue;
      }

      if (++logCounter === logInterval) {
        logCounter = 0;
        log(currentNode);
      }

      openSet = await heuristicOptimizer.next(
        currentNode,
        openSetBuffer,
        openSet,
        closedSet,
        closedTargetBlocks,
      );

      const blocksRemaining = gameState.blocksToPlace.size;
      // If we've placed all blocks, return the node
      if (blocksRemaining === 0) {
        return currentNode;
      }

      const { totalBlocksPlaced } = currentNode;

      const currentOpenSet = openSet; // For the linter
      function blockSecondaryConstraintFail(
        blockToPlace: BlockToPlace,
        gameState: GameState,
      ) {
        const { blocksToPlaceHash } = gameState;
        const record = closedTargetBlocks.get(blocksToPlaceHash);
        let closedBlocksSet: Set<BlockToPlace>;
        if (!record) {
          closedBlocksSet = new Set();
          closedTargetBlocks.set(blocksToPlaceHash, [
            closedBlocksSet,
            totalBlocksPlaced,
          ]);
        } else {
          closedBlocksSet = record[0];
        }

        if (setTryToAdd(closedBlocksSet, blockToPlace)) {
          currentOpenSet.remove(
            (node) => node.gameState!.blocksToPlaceHash === blocksToPlaceHash,
          );
          const blocksToPlaceHashMask = 0xffffffffn;
          const blocksToPlaceHashBigint = BigInt(blocksToPlaceHash);
          for (const [key, value] of closedSet) {
            if ((value & blocksToPlaceHashMask) === blocksToPlaceHashBigint) {
              closedSet.delete(key);
            }
          }
          const { best } = heuristicOptimizer;
          if (best && best.gameState!.blocksToPlaceHash === blocksToPlaceHash) {
            currentOpenSet.push(best);
          }
        }
      }

      const [isClosedTargetBlock] = getClosedTargetBlockFunc(
        gameState,
        closedTargetBlocks,
      );

      // Expand the node and explore its children
      const currentAction = currentNode.action;
      const possibleActions: (Action | [Action, GameState])[] =
        gameState.getPossibleActions(isClosedTargetBlock, blockSecondaryConstraintFail);
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
          totalBlocksPlaced +
          (gameState.blocksToPlace.size - nextGameState.blocksToPlace.size);

        const blocksPlacedBitIndex = 32n;
        const closedStateRecord =
          (BigInt(blocksPlaced) << blocksPlacedBitIndex) |
          BigInt(nextGameState.blocksToPlaceHash);

        // Generate a unique key for the state (could use turtle position and remaining blocks)
        const stateKey = getStateKey(nextGameState);
        if (!mapTryToAdd(closedSet, stateKey, closedStateRecord)) continue;

        const actionName = typeof action === 'string' ? action : action[0];

        const [isClosedTargetBlock, closedTargetBlockCount] = getClosedTargetBlockFunc(
          nextGameState,
          closedTargetBlocks,
        );

        // Calculate costs
        const newGCost = currentNode.gCost + actionCost;
        const newHCost = calculateHeuristic(
          nextGameState,
          isClosedTargetBlock,
          closedTargetBlockCount,
          currentNode.gameState,
          currentNode.hCost,
        );
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

      if (currentNode !== heuristicOptimizer.best) {
        currentNode.freeAfterExpansion();
      }
    }

    if (!heuristicOptimizer.best || retry >= retries) break;
    console.warn('No solution found, retrying...');
    closedSet.clear();

    let best = heuristicOptimizer.best;
    if (retry > 0) {
      best = heuristicOptimizer.previousBests.at(-retry) ?? best;
    }
    openSet.push(best);
    retry++;
  }

  // No solution found
  return undefined;
}

const paddingOptions: PaddingOptions = {
  north: true,
  west: true,
  up: true,

  // south: true,
  // east: true,
  // down: true,
};

// const water = {
//   name: 'minecraft:water',
//   type: 'liquid',
//   item: {
//     name: 'minecraft:water_bucket',
//     stackSize: 1,
//   },
//   maxMissingSupportBlocks: 0,
// } as const;

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
const chunks = splitIntoChunks(allBlocksToPlace, Infinity, Infinity);
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

  const startTime = Date.now();
  let blocksPlaced = 0;
  let blocksRemaining = Infinity;

  const heuristicFunc = heuristicFuncFactory(chunkGameState);
  const goalNode = await aStarSearch(chunkGameState, heuristicFunc, (node) => {
    const gameState = node.gameState;
    if (!gameState) return;

    if (node.totalBlocksPlaced > blocksPlaced) {
      blocksPlaced = node.totalBlocksPlaced;
      blocksRemaining = gameState.blocksToPlace.size;
    }

    const elapsedTime = (Date.now() - startTime) / 1000;
    const rate = blocksPlaced / elapsedTime;
    const remainingTime = blocksRemaining / rate;
    const remainingTimeHours = Math.floor(remainingTime / 3600);
    const remainingTimeMinutes = Math.floor((remainingTime % 3600) / 60);
    const remainingTimeSeconds = Math.floor(remainingTime % 60);
    const hPart = remainingTimeHours
      ? `${String(remainingTimeHours).padStart(2, '0')}h `
      : '';
    const mPart =
      remainingTimeHours || remainingTimeMinutes
        ? `${String(remainingTimeMinutes).padStart(2, '0')}m `
        : '';
    const eta = `${hPart}${mPart}${String(remainingTimeSeconds).padStart(2, '0')}s`;
    console.log(
      `Blocks remaining: ${gameState.blocksToPlace.size}, fCost: ${node.fCost.toPrecision(4)}, gCost: ${node.gCost.toPrecision(4)}, hCost: ${node.hCost.toPrecision(4)}, inv: ${gameState.inventoryCredit.addableItemsetRatio.toPrecision(4)}, eta: ${eta}`,
    );
  });

  if (!goalNode) {
    throw new Error(`No solution found for chunk ${i + 1}`);
  }

  const bestActionSequence = getActionSequenceFromGoalNode(goalNode);

  console.log(
    `Chunk ${i + 1}: Best action sequence length: ${bestActionSequence.length}`,
  );

  fullActionSequence.push(...bestActionSequence);

  currentGameState = goalNode.gameState;
  assert(currentGameState, 'Current game state should not be undefined');

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
const luaScript = new BuildSimulator(initialGameState).process(fullActionSequence);

const fileName = `build_${new Date()
  .toISOString()
  .slice(0, 16)
  .replace(/[-:]/g, '')
  .replace('T', '_')}.lua`;

await writeFile(fileName, luaScript);

console.log(`Lua script generated: ${fileName}`);
