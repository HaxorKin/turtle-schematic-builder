// eslint-disable-next-line max-classes-per-file
import assert from 'assert';
import { BlockToPlace } from '../../blocks/bases/block-to-place';
import { isHopper } from '../../blocks/block-to-place-hopper';
import { Action, SimpleAction } from '../action';
import { GameState } from '../game-state';
import { InventoryState } from '../inventory/inventory';
import { findPath } from '../pathfinding';
import { addVectors, DOWN, UP, Vector } from '../vector';
import { simplifyItemName } from './simplify-item-name';

interface BuildScriptInstruction {
  toString: () => string;
  fuel?: number;
}

class LuaInstruction implements BuildScriptInstruction {
  constructor(
    public readonly code: string,
    public readonly fuel?: number,
  ) {}

  toString() {
    return this.code;
  }
}

class ExecuteInstruction implements BuildScriptInstruction {
  readonly steps: string[] = [];
  fuel = 0;

  toString() {
    return `lib.execute([[\n${this.steps.join('\n')}\n]])`;
  }

  addStep(step: string | [string, number]) {
    if (typeof step === 'string') {
      this.steps.push(step);
    } else {
      const [code, fuel] = step;
      this.steps.push(code);
      this.fuel += fuel;
    }
  }
}

class DeferredInstruction implements BuildScriptInstruction {
  private _code?: string;
  private _fuel?: number;

  constructor(readonly name: string) {}

  get code() {
    const code = this._code;
    if (code === undefined) {
      throw new Error(`DeferredInstruction [${this.name}]: Code not set`);
    }
    return code;
  }

  set code(code: string) {
    this._code = code;
    this._fuel ??= 0;
  }

  get fuel() {
    const fuel = this._fuel;
    if (fuel === undefined) {
      throw new Error(`DeferredInstruction [${this.name}]: Fuel not set`);
    }
    return fuel;
  }

  set fuel(fuel: number) {
    this._fuel = fuel;
  }

  toString() {
    return this.code;
  }
}

class BuildScriptGenerator {
  private readonly instructions: BuildScriptInstruction[] = [];
  private deferredResupply: DeferredInstruction | undefined;

  private static generateSuck(inventory: InventoryState) {
    const slots = inventory.toSlots();
    const sums: Record<string, number> = {};
    for (const [itemName, count] of slots) {
      const simplifiedKey = simplifyItemName(itemName);
      sums[simplifiedKey] = (sums[simplifiedKey] ?? 0) + count;
    }

    // eslint-disable-next-line @typescript-eslint/no-magic-numbers
    return `lib.resupply(textutils.unserialiseJSON([[${JSON.stringify(sums, null, 2)}]])--[[@as table]])`;
  }

  getFuelCost() {
    return this.instructions.reduce(
      (acc, instruction) => acc + (instruction.fuel ?? 0),
      0,
    );
  }

  addLua(...code: string[]) {
    this.instructions.push(...code.map((x) => new LuaInstruction(x)));
  }

  addStep(...steps: (string | [string, number])[]) {
    if (steps.length === 0) return;

    const lastInstruction = this.instructions.at(-1);
    let executeInstruction: ExecuteInstruction | undefined;
    if (lastInstruction instanceof ExecuteInstruction) {
      executeInstruction = lastInstruction;
    } else {
      executeInstruction = new ExecuteInstruction();
      this.instructions.push(executeInstruction);
    }

    for (const step of steps) {
      executeInstruction.addStep(step);
    }
  }

  addResupply(inventory?: InventoryState) {
    if (inventory) {
      const { deferredResupply } = this;
      assert(
        deferredResupply,
        'Deferred resupply instruction not found. Be sure to call ensureDeferredResupply() before adding resupply.',
      );
      const resupplyCode = BuildScriptGenerator.generateSuck(inventory);
      deferredResupply.code = resupplyCode;
    }

    this.setDeferredResupply();
  }

  addDeferred(name: string, fuel?: number) {
    const deferredInstruction = new DeferredInstruction(name);
    if (fuel !== undefined) {
      deferredInstruction.fuel = fuel;
    }
    this.instructions.push(deferredInstruction);

    return (code: string, fuel?: number) => {
      deferredInstruction.code = code;
      if (fuel !== undefined) {
        deferredInstruction.fuel = fuel;
      }
    };
  }

  format(): string {
    return this.instructions.join('\n') + '\n';
  }

  stopResupply() {
    const { deferredResupply, instructions } = this;
    if (!deferredResupply) return;

    instructions.splice(instructions.indexOf(deferredResupply), 1);
    this.deferredResupply = undefined;
  }

  private setDeferredResupply() {
    this.deferredResupply = new DeferredInstruction('resupply');
    this.instructions.push(this.deferredResupply);
  }
}

export class BuildSimulator {
  private readonly script = new BuildScriptGenerator();
  private readonly hopperCoords = new Set<string>();

  constructor(private readonly initialGameState: GameState) {}

  private static createPlaceInstructions(
    prefix: ':' | "'" | ',',
    block: BlockToPlace,
  ): string[] {
    return block.items.flatMap((item) =>
      Array<string>(item.amount).fill(prefix + item.name),
    );
  }

  process(actions: Action[]) {
    const { script } = this;

    script.addLua('local lib = require("lib")');

    script.addLua('turtle.turnLeft()', 'turtle.turnLeft()');
    const resolveRefuel = script.addDeferred('refuel', 0);
    script.addLua('lib.dumpInventory()');
    script.addResupply();
    script.addLua('turtle.turnLeft()', 'turtle.turnLeft()');

    const gameState = this.processActions(actions);

    this.returnToOrigin(gameState);

    script.addLua('lib.clear()', 'lib.dumpInventory()', 'print("Build completed")');

    script.addResupply(gameState.inventoryCredit);
    script.stopResupply();
    const fuelCost = script.getFuelCost();
    resolveRefuel(`lib.refuel(${fuelCost})`);

    return script.format();
  }

  private returnToOrigin(gameState: GameState) {
    const pathToOrigin = findPath(
      gameState.turtle.position,
      gameState.turtle.direction,
      gameState.env.supplyPointPosition,
      gameState.env.supplyPointDirection,
      gameState.reachability.size,
      gameState.reachability.originDistance,
    );
    assert(pathToOrigin, 'No path to origin found');
    this.processActions(pathToOrigin, gameState);
  }

  private processActions(
    actions: Action[],
    initialGameState: GameState = this.initialGameState,
  ) {
    let currentGameState = initialGameState;

    for (const action of actions) {
      if (action === 'resupply') {
        for (const action of currentGameState.getResupplyActions()) {
          currentGameState = this.processAction(action, currentGameState);
        }
        currentGameState = this.processResupply(currentGameState);
      } else {
        currentGameState = this.processAction(action, currentGameState);
      }
    }

    return currentGameState;
  }

  private isOnHopper(gameState: GameState): boolean {
    return this.hopperCoords.has(String(addVectors(gameState.turtle.position, DOWN)));
  }

  private processAction(action: SimpleAction, currentGameState: GameState): GameState {
    const wasOnHopper = this.isOnHopper(currentGameState);
    const [nextGameState] = currentGameState.executeAction(action);
    const isOnHoppper = this.isOnHopper(nextGameState);

    if (!wasOnHopper && isOnHoppper) {
      this.script.addStep('["redstone","bottom",1]');
    }

    switch (action) {
      case 'forward':
        this.processMoveAction('+');
        break;
      case 'back':
        this.processMoveAction('-');
        break;
      case 'up':
        this.processMoveAction('^');
        break;
      case 'down':
        this.processMoveAction('v');
        break;
      case 'turnLeft':
        this.processTurnAction('<');
        break;
      case 'turnRight':
        this.processTurnAction('>');
        break;
      case 'place':
        this.processPlaceAction(
          ':',
          currentGameState.turtle.direction,
          currentGameState,
        );
        break;
      case 'placeUp':
        this.processPlaceAction("'", UP, currentGameState);
        break;
      case 'placeDown':
        this.processPlaceAction(',', DOWN, currentGameState);
        break;
      default:
        throw new Error(`Unknown action: ${action}`);
    }

    if (wasOnHopper && !isOnHoppper) {
      this.script.addStep('["redstone","bottom",0]');
    }

    return nextGameState;
  }

  private processMoveAction(symbol: '+' | '-' | '^' | 'v') {
    this.script.addStep([symbol, 1]);
  }

  private processTurnAction(symbol: '<' | '>') {
    this.script.addStep(symbol);
  }

  private processPlaceAction(
    prefix: ':' | "'" | ',',
    direction: Vector,
    currentGameState: GameState,
  ) {
    const blockPosition = addVectors(currentGameState.turtle.position, direction);
    const blockKey = String(blockPosition);
    const block = currentGameState.blocksToPlace.get(blockKey);
    assert(block, 'Block to place not found');

    if (isHopper(block)) {
      this.hopperCoords.add(blockKey);
    }

    this.script.addStep(...BuildSimulator.createPlaceInstructions(prefix, block));
  }

  private processResupply(currentGameState: GameState) {
    const { inventoryCredit } = currentGameState;
    this.script.addResupply(inventoryCredit);
    return new GameState(
      currentGameState.env,
      currentGameState.blocksToPlace,
      currentGameState.turtle,
      currentGameState.reachability,
      inventoryCredit.clear(),
      currentGameState.blocksToPlaceHash,
    );
  }
}
