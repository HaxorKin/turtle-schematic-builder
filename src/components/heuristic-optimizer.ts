/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from '@datastructures-js/priority-queue';
import assert from 'assert';
import { clamp } from '../helpers/clamp';
import { StateKey } from '../helpers/get-state-key';
import { AstarNode } from './astar-node';

export class HeuristicOptimizer {
  /** The best node found so far, for debugging purposes. */
  best?: AstarNode;

  private readonly stepAfterNoImprovement: number;
  private readonly heuristicMultiplierStep: number;
  private heuristicMultiplierCounter: number;
  private heuristicMultiplier: number;
  private readonly trimSize: number;
  private noImprovementCounter = 0;
  private blocksPlaced = 0;
  private heuristicMultiplierCounterSum = 0;

  constructor({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplierCounter,
    trimSize,
  }: Readonly<{
    stepAfterNoImprovement: number;
    heuristicMultiplierStep: number;
    initialHeuristicMultiplierCounter: number;
    trimSize: number;
  }>) {
    assert(Number.isSafeInteger(initialHeuristicMultiplierCounter));
    assert(stepAfterNoImprovement > 0);
    assert(heuristicMultiplierStep > 0);
    assert(trimSize > 0);

    this.stepAfterNoImprovement = stepAfterNoImprovement;
    this.heuristicMultiplierStep = heuristicMultiplierStep;
    this.heuristicMultiplierCounter = initialHeuristicMultiplierCounter;
    this.heuristicMultiplier =
      initialHeuristicMultiplierCounter * heuristicMultiplierStep;
    this.trimSize = trimSize;
  }

  private static trimBuffers(
    openSetBuffer: AstarNode[],
    closedSet: Map<StateKey, number>,
    trimSize: number,
  ) {
    openSetBuffer.sort(
      (a, b) => b.totalBlocksPlaced - a.totalBlocksPlaced || a.fCost - b.fCost,
    );
    openSetBuffer.length = Math.min(openSetBuffer.length, trimSize);

    const threshold = openSetBuffer.at(-1)!.totalBlocksPlaced;
    for (const [key, value] of closedSet) {
      if (value < threshold) {
        closedSet.delete(key);
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
    closedSet: Map<StateKey, number>,
  ) {
    if (currentNode.totalBlocksPlaced > this.blocksPlaced) {
      this.heuristicMultiplierCounterSum +=
        this.heuristicMultiplierCounter *
        (currentNode.totalBlocksPlaced - this.blocksPlaced);

      this.blocksPlaced = currentNode.totalBlocksPlaced;
      this.best = currentNode;
      if (this.heuristicMultiplierCounter > 0) {
        this.heuristicMultiplierCounter = clamp(
          0,
          Math.round(this.heuristicMultiplierCounterSum / this.blocksPlaced) - 1,
          this.heuristicMultiplierCounter - 1,
        );

        HeuristicOptimizer.recalculateFcosts(openSetBuffer, this.heuristicMultiplier);
        openSet = new PriorityQueue<AstarNode>(
          (a, b) => a.fCost - b.fCost,
          openSetBuffer,
        );
      }
      this.noImprovementCounter = 0;
    } else {
      this.noImprovementCounter++;
      if (this.noImprovementCounter >= this.stepAfterNoImprovement) {
        this.heuristicMultiplier =
          ++this.heuristicMultiplierCounter * this.heuristicMultiplierStep;

        this.noImprovementCounter = 0;
        HeuristicOptimizer.trimBuffers(openSetBuffer, closedSet, this.trimSize);
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
