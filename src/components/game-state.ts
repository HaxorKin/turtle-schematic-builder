/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from 'assert';
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { BlockToPlaceLiquid, BlockToPlaceWater } from '../blocks/block-to-place-liquid';
import { BlockToPlacePistonhead } from '../blocks/block-to-place-piston';
import { blocksToPlaceItems } from '../helpers/blocks-to-place-items';
import { isBlock, isTurtleReachable } from '../helpers/reachability-helpers';
import { Action, actionCosts, SimpleAction } from './action';
import { dirCount } from './dir';
import { InventoryState } from './inventory/inventory';
import { findPath } from './pathfinding';
import { Reachability, ReachabilityState } from './reachability';
import { TurtleState } from './turtle-state';
import { addVectors, DOWN, subVectors, UP, Vector } from './vector';

export interface GameStateEnvironment {
  readonly supplyPointPosition: Vector;
  readonly supplyPointDirection: Vector;

  /**
   * A map of blocks, where the key is a block that can affect the reachability
   * of other blocks, and the value is an array of blocks that are affected.
   */
  readonly blockDependencyMap: Map<BlockToPlace, BlockToPlace[]>;
}

export class GameState {
  constructor(
    public readonly env: GameStateEnvironment,
    public readonly blocksToPlace: Map<string, BlockToPlace>,
    public readonly turtle: TurtleState,
    public readonly reachability: Reachability,
    public readonly inventoryCredit: InventoryState,
  ) {}

  getPossibleActions(): (SimpleAction | [SimpleAction, GameState])[] {
    const { reachability, turtle, inventoryCredit } = this;
    if (inventoryCredit.addableItemsetRatio === 0) {
      return [];
    }

    const actions: (SimpleAction | [SimpleAction, GameState])[] = [
      'turnLeft',
      'turnRight',
    ];
    const { position, direction } = turtle;

    const forwardPosition = addVectors(position, direction);
    const backwardPosition = subVectors(position, direction);
    const upPosition = addVectors(position, UP);
    const downPosition = addVectors(position, DOWN);

    if (isTurtleReachable(reachability.at(...forwardPosition))) {
      actions.push('forward');
    }
    const gameStateAfterPlace = this.tryToPlaceBlock(forwardPosition);
    if (gameStateAfterPlace) {
      actions.push(['place', gameStateAfterPlace]);
    }
    const gameStateAfterPlaceUp = this.tryToPlaceBlock(upPosition);
    if (gameStateAfterPlaceUp) {
      actions.push(['placeUp', gameStateAfterPlaceUp]);
    }
    const gameStateAfterPlaceDown = this.tryToPlaceBlock(downPosition);
    if (gameStateAfterPlaceDown) {
      actions.push(['placeDown', gameStateAfterPlaceDown]);
    }
    if (isTurtleReachable(reachability.at(...backwardPosition))) {
      actions.push('back');
    }
    if (isTurtleReachable(reachability.at(...upPosition))) {
      actions.push('up');
    }
    if (isTurtleReachable(reachability.at(...downPosition))) {
      actions.push('down');
    }

    return actions;
  }

  getResupplyActions() {
    const actions = findPath(
      this.turtle.position,
      this.turtle.direction,
      this.env.supplyPointPosition,
      this.env.supplyPointDirection,
      this.reachability.size,
      this.reachability.blockedMap,
    );
    assert(actions, 'No path to supply point found');
    return actions;
  }

  executeAction(
    action: Action | [Action, GameState],
  ): [gameState: GameState, cost: number] {
    if (typeof action === 'object') {
      const [actionType, gameState] = action;
      return [gameState, actionCosts[actionType]];
    }

    let newTurtle: TurtleState;
    switch (action) {
      case 'forward':
        newTurtle = this.turtle.forward();
        break;
      case 'back':
        newTurtle = this.turtle.back();
        break;
      case 'up':
        newTurtle = this.turtle.up();
        break;
      case 'down':
        newTurtle = this.turtle.down();
        break;
      case 'turnLeft':
        newTurtle = this.turtle.turnLeft();
        break;
      case 'turnRight':
        newTurtle = this.turtle.turnRight();
        break;
      case 'place':
        return this.placeAction(this.turtle.direction);
      case 'placeUp':
        return this.placeAction(UP);
      case 'placeDown':
        return this.placeAction(DOWN);
      case 'resupply':
        return this.resupplyAction();
      default:
        throw new Error(`${action} is not supported here`);
    }

    return [
      new GameState(
        this.env,
        this.blocksToPlace,
        newTurtle,
        this.reachability,
        this.inventoryCredit,
      ),
      actionCosts[action],
    ];
  }

  private getDeadlockableDependants(
    reachability: Reachability,
    blocks: BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
    deadlockableDependants: BlockToPlace[],
  ): boolean {
    deadlockableDependants.length = 0;
    const [width, height] = reachability.size;
    const { gateMap } = reachability;
    const originalGateMap = this.reachability.gateMap;

    for (const block of blocks) {
      const [x, y, z] = block;

      const index = x + y * width + z * width * height;
      if (
        reachability.blockedMap[index] === ReachabilityState.Blocked ||
        (block instanceof BlockToPlaceLiquid && !blocksToPlace.has(String(block)))
      ) {
        continue;
      }

      const reachabilityDirections = gateMap[index]!;
      if (reachabilityDirections === 0) return false;
      const reachabilityCount = dirCount(reachabilityDirections);
      const oldReachabilityCount = dirCount(originalGateMap[index]!);
      if (
        reachabilityCount < oldReachabilityCount &&
        block.isDeadlockable(reachabilityCount)
      ) {
        deadlockableDependants.push(block);
      }
    }

    return true;
  }

  private canCompleteDependencyChain(
    reachability: Reachability,
    blocks: BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    const { blockDependencyMap } = this.env;
    const deadlockableDependants: BlockToPlace[] = [];
    while (true) {
      if (
        !this.getDeadlockableDependants(
          reachability,
          blocks,
          blocksToPlace,
          deadlockableDependants,
        )
      ) {
        return false;
      }
      if (deadlockableDependants.length === 0) return true;

      blocks = deadlockableDependants.flatMap(
        (block) => blockDependencyMap.get(block) ?? [],
      );
      reachability = reachability.blockMany(
        deadlockableDependants,
        blocks,
        blocksToPlace,
      );
    }
  }

  private isTurtleTrapped(newReachability: Reachability) {
    const { position } = this.turtle;
    const turtleReachability = newReachability.at(...position);
    if (isTurtleReachable(turtleReachability)) {
      return false;
    }

    if (isBlock(turtleReachability)) {
      const { blocksToPlace } = this;
      const blockToPlace = blocksToPlace.get(String(position));
      if (blockToPlace instanceof BlockToPlacePistonhead) {
        const [x, y, z] = position;
        return !(
          isTurtleReachable(newReachability.at(x, y + 1, z)) ||
          isTurtleReachable(newReachability.at(x, y - 1, z)) ||
          isTurtleReachable(newReachability.at(x + 1, y, z)) ||
          isTurtleReachable(newReachability.at(x - 1, y, z)) ||
          isTurtleReachable(newReachability.at(x, y, z + 1)) ||
          isTurtleReachable(newReachability.at(x, y, z - 1))
        );
      }
    }

    return true;
  }

  private tryToPlaceBlock(position: Vector) {
    const { reachability, blocksToPlace, turtle } = this;
    const blockToPlace = blocksToPlace.get(String(position));
    if (
      !blockToPlace?.isPlaceable(reachability, turtle, blocksToPlace) ||
      !this.inventoryCredit.canAddItems(blockToPlace.items)
    ) {
      return undefined;
    }

    const newGameState = this.place(blockToPlace);
    const newReachability = newGameState.reachability;
    const newBlocksToPlace = newGameState.blocksToPlace;

    if (blockToPlace instanceof BlockToPlaceWater) {
      return newGameState;
    }

    if (
      this.isTurtleTrapped(newReachability) ||
      newBlocksToPlace.values().some((block) => !block.isReachable(newReachability))
    ) {
      return undefined;
    }

    let dependants: BlockToPlace[] | undefined;
    if (!blockToPlace.extraBlocks) {
      dependants = this.env.blockDependencyMap.get(blockToPlace);
    } else {
      const multiBlock = [blockToPlace, ...blockToPlace.extraBlocks];

      dependants = multiBlock.flatMap(
        (block) => this.env.blockDependencyMap.get(block) ?? [],
      );
    }

    if (
      dependants &&
      dependants.length > 0 &&
      !this.canCompleteDependencyChain(newReachability, dependants, newBlocksToPlace)
    ) {
      return undefined;
    }

    return newGameState;
  }

  private place(blockToPlace: BlockToPlace): GameState {
    const blockToPlaceKey = String(blockToPlace);

    let newReachability: Reachability;
    const newBlocksToPlace = new Map(this.blocksToPlace);

    if (blockToPlace instanceof BlockToPlaceWater) {
      newReachability = this.reachability;
      newBlocksToPlace.delete(blockToPlaceKey);
    } else if (!blockToPlace.extraBlocks) {
      const dependants = this.env.blockDependencyMap.get(blockToPlace);
      newReachability = this.reachability.block(
        blockToPlace,
        dependants,
        this.blocksToPlace,
      );
      newBlocksToPlace.delete(blockToPlaceKey);

      const waterBlockKey = blockToPlaceKey + 'w';
      const waterBlock = newBlocksToPlace.get(waterBlockKey);
      if (waterBlock) {
        newBlocksToPlace.delete(waterBlockKey);
        newBlocksToPlace.set(blockToPlaceKey, waterBlock);
      }
    } else {
      const multiBlock = [blockToPlace, ...blockToPlace.extraBlocks];
      const dependants = multiBlock.flatMap(
        (block) => this.env.blockDependencyMap.get(block) ?? [],
      );
      newReachability = this.reachability.blockMany(
        multiBlock,
        dependants,
        this.blocksToPlace,
      );
      for (const block of multiBlock) {
        // Some piston heads might have the same position
        newBlocksToPlace.delete(String(block));
      }
    }

    return new GameState(
      this.env,
      newBlocksToPlace,
      this.turtle,
      newReachability,
      this.inventoryCredit.addItems(
        blockToPlace.items,
        blocksToPlaceItems(newBlocksToPlace),
      ),
    );
  }

  private placeAction(direction: Vector): [gameState: GameState, cost: number] {
    const blockPosition = addVectors(this.turtle.position, direction);
    const blockToPlace = this.blocksToPlace.get(String(blockPosition));
    assert(blockToPlace, 'No block to place');
    return [this.place(blockToPlace), actionCosts.place];
  }

  private resupplyAction(): [gameState: GameState, cost: number] {
    const { supplyPointPosition, supplyPointDirection } = this.env;

    const resupplyActions = this.getResupplyActions();
    const costSum = resupplyActions.reduce(
      (sum, action) => sum + actionCosts[action],
      0,
    );
    const newTurtle = new TurtleState(supplyPointPosition, supplyPointDirection);
    return [
      new GameState(
        this.env,
        this.blocksToPlace,
        newTurtle,
        this.reachability,
        this.inventoryCredit.clear(),
      ),
      costSum * this.inventoryCredit.addableItemsetRatio,
    ];
  }
}
