/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from '@datastructures-js/priority-queue';
import { StateKey } from '../helpers/get-state-key';
import { AstarNode } from './astar-node';

export class HeuristicOptimizer {
  /** The best node found so far, for debugging purposes. */
  best?: AstarNode;

  private readonly stepAfterNoImprovement: number;
  private readonly heuristicMultiplierStep: number;
  private heuristicMultiplier: number;
  private readonly trimThreshold: number;
  private noImprovementCounter = 0;
  private blocksPlaced = 0;

  constructor({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplier,
    trimThreshold,
  }: Readonly<{
    stepAfterNoImprovement: number;
    heuristicMultiplierStep: number;
    initialHeuristicMultiplier: number;
    trimThreshold: number;
  }>) {
    this.stepAfterNoImprovement = stepAfterNoImprovement;
    this.heuristicMultiplierStep = heuristicMultiplierStep;
    this.heuristicMultiplier = initialHeuristicMultiplier;
    this.trimThreshold = trimThreshold;
  }

  private static trimBuffers(
    openSetBuffer: AstarNode[],
    closedSet: Map<StateKey, number>,
    threshold: number,
  ) {
    if (threshold <= 0) {
      return;
    }

    // Partition the array so elements with totalBlocksPlaced >= threshold are at the beginning
    let partitionIndex = 0;
    for (let i = 0; i < openSetBuffer.length; i++) {
      const node = openSetBuffer[i]!;
      if (node.totalBlocksPlaced >= threshold) {
        if (i !== partitionIndex) {
          // Swap elements
          [openSetBuffer[i], openSetBuffer[partitionIndex]] = [
            openSetBuffer[partitionIndex]!,
            node,
          ];
        }
        partitionIndex++;
      }
    }
    // Trim the array to contain only elements that meet the threshold
    openSetBuffer.length = partitionIndex;

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
      this.blocksPlaced = currentNode.totalBlocksPlaced;
      this.best = currentNode;
      if (this.heuristicMultiplier > 0) {
        this.heuristicMultiplier -= this.heuristicMultiplierStep;
        if (this.heuristicMultiplier < 0) this.heuristicMultiplier = 0;

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
        this.heuristicMultiplier += this.heuristicMultiplierStep;

        this.noImprovementCounter = 0;
        HeuristicOptimizer.trimBuffers(
          openSetBuffer,
          closedSet,
          Math.floor(this.blocksPlaced * this.trimThreshold),
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
