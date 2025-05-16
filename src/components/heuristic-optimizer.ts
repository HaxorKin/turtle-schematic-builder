/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from '@datastructures-js/priority-queue';
import assert from 'assert';
import { clamp } from '../helpers/clamp';
import { StateKey } from '../helpers/get-state-key';
import { AstarNode } from './astar-node';

export class HeuristicOptimizer {
  /** The best node found so far, for debugging purposes. */
  best?: AstarNode;
  previousBests: AstarNode[] = [];

  private readonly stepAfterNoImprovement: number;
  private readonly heuristicMultiplierStep: number;
  private heuristicMultiplierCounter: number;
  private heuristicMultiplier: number;
  private readonly trimSize: number;
  private noImprovementCounter = 0;
  private blocksPlaced = 0;
  private heuristicMultiplierCounterSum = 0;
  private readonly previousBestsToKeep: number;

  constructor({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplierCounter,
    trimSize,
    previousBestsToKeep,
  }: Readonly<{
    stepAfterNoImprovement: number;
    heuristicMultiplierStep: number;
    initialHeuristicMultiplierCounter: number;
    trimSize: number;
    previousBestsToKeep: number;
  }>) {
    assert(Number.isSafeInteger(initialHeuristicMultiplierCounter));
    assert(stepAfterNoImprovement > 0);
    assert(heuristicMultiplierStep > 0);
    assert(trimSize > 0);
    assert(previousBestsToKeep > 0);

    this.stepAfterNoImprovement = stepAfterNoImprovement;
    this.heuristicMultiplierStep = heuristicMultiplierStep;
    this.heuristicMultiplierCounter = initialHeuristicMultiplierCounter;
    this.heuristicMultiplier =
      initialHeuristicMultiplierCounter * heuristicMultiplierStep;
    this.trimSize = trimSize;
    this.previousBestsToKeep = previousBestsToKeep;
  }

  private static trimBuffers(
    openSetBuffer: AstarNode[],
    closedSet: Map<StateKey, bigint>,
    closedTargetBlocks: Map<unknown, [unknown, number]>,
    trimSize: number,
  ) {
    if (openSetBuffer.length <= trimSize) {
      return;
    }

    openSetBuffer.sort(
      (a, b) => b.totalBlocksPlaced - a.totalBlocksPlaced || a.fCost - b.fCost,
    );
    openSetBuffer.length = trimSize;

    const threshold = openSetBuffer.at(-1)!.totalBlocksPlaced;
    const blocksPlacedBitIndex = 32n;
    for (const [key, value] of closedSet) {
      const blocksPlaced = value >> blocksPlacedBitIndex;
      if (blocksPlaced < threshold) {
        closedSet.delete(key);
      }
    }
    for (const [key, [, value]] of closedTargetBlocks) {
      if (value < threshold) {
        closedTargetBlocks.delete(key);
      }
    }
  }

  private static recalculateFcosts(
    openSetBuffer: AstarNode[],
    heuristicMultiplier: number,
  ) {
    for (const node of openSetBuffer) {
      node.fCost = node.gCost + node.hCost * heuristicMultiplier;
    }
  }

  fCost(gCost: number, hCost: number) {
    return gCost + hCost * this.heuristicMultiplier;
  }

  async next(
    currentNode: AstarNode,
    openSetBuffer: AstarNode[],
    openSet: PriorityQueue<AstarNode>,
    closedSet: Map<StateKey, bigint>,
    closedTargetBlocks: Map<unknown, [unknown, number]>,
  ) {
    const totalBlocksPlaced = currentNode.totalBlocksPlaced;
    const mostBlocksPlaced = this.blocksPlaced;
    if (totalBlocksPlaced > mostBlocksPlaced) {
      this.heuristicMultiplierCounterSum +=
        this.heuristicMultiplierCounter * (totalBlocksPlaced - mostBlocksPlaced);

      this.blocksPlaced = totalBlocksPlaced;
      if (this.best) {
        const { previousBests } = this;
        if (previousBests.length >= this.previousBestsToKeep) {
          previousBests.shift();
        }
        previousBests.push(this.best);
      }
      this.best = currentNode;
      if (this.heuristicMultiplierCounter > 0) {
        this.heuristicMultiplierCounter = clamp(
          0,
          Math.floor(this.heuristicMultiplierCounterSum / this.blocksPlaced),
          this.heuristicMultiplierCounter - 1,
        );
        this.heuristicMultiplier =
          this.heuristicMultiplierCounter * this.heuristicMultiplierStep;

        HeuristicOptimizer.recalculateFcosts(openSetBuffer, this.heuristicMultiplier);
        openSet = new PriorityQueue<AstarNode>(
          (a, b) => a.fCost - b.fCost,
          openSetBuffer,
        );
      }
      this.noImprovementCounter = 0;
    } else {
      this.noImprovementCounter++;
      if (
        totalBlocksPlaced === mostBlocksPlaced &&
        this.best &&
        currentNode.gCost < this.best.gCost
      ) {
        this.best = currentNode;
      }

      if (this.noImprovementCounter >= this.stepAfterNoImprovement) {
        this.heuristicMultiplier =
          ++this.heuristicMultiplierCounter * this.heuristicMultiplierStep;

        this.noImprovementCounter = 0;
        HeuristicOptimizer.trimBuffers(
          openSetBuffer,
          closedSet,
          closedTargetBlocks,
          this.trimSize,
        );
        HeuristicOptimizer.recalculateFcosts(openSetBuffer, this.heuristicMultiplier);
        openSet = new PriorityQueue<AstarNode>(
          (a, b) => a.fCost - b.fCost,
          openSetBuffer,
        );

        // Yield for better GC
        await Promise.resolve();
      }
    }

    return openSet;
  }
}
