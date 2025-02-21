import { PriorityQueue } from '@js-sdsl/priority-queue';
import { AstarNode } from './astar-node';

export class HeuristicOptimizer {
  private readonly stepAfterNoImprovement: number;
  private readonly heuristicMultiplierStep: number;
  private heuristicMultiplier: number;
  private noImprovementCounter = 0;
  private blocksPlaced = 0;

  /** The best node found so far, for debugging purposes. */
  best?: AstarNode;

  private static trimBuffers(
    openSetBuffer: AstarNode[],
    closedSet: Map<string, number>,
    threshold: number,
  ) {
    openSetBuffer.sort((a, b) => b.totalBlocksPlaced - a.totalBlocksPlaced);
    const cutoff = openSetBuffer.findIndex(
      (node) => node.totalBlocksPlaced < threshold,
    );
    if (cutoff !== -1) {
      openSetBuffer.length = cutoff;
    }

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

  constructor({
    stepAfterNoImprovement,
    heuristicMultiplierStep,
    initialHeuristicMultiplier,
  }: Readonly<{
    stepAfterNoImprovement: number;
    heuristicMultiplierStep: number;
    initialHeuristicMultiplier: number;
  }>) {
    this.stepAfterNoImprovement = stepAfterNoImprovement;
    this.heuristicMultiplierStep = heuristicMultiplierStep;
    this.heuristicMultiplier = initialHeuristicMultiplier;
  }

  fCost(gCost: number, hCost: number) {
    return gCost + hCost * this.heuristicMultiplier;
  }

  async next(
    currentNode: AstarNode,
    openSetBuffer: AstarNode[],
    openSet: PriorityQueue<AstarNode>,
    closedSet: Map<string, number>,
  ) {
    if (currentNode.totalBlocksPlaced > this.blocksPlaced) {
      console.log(
        `Blocks remaining: ${currentNode.gameState.blocksToPlace.size}, fCost: ${currentNode.fCost}, gCost: ${currentNode.gCost}, hCost: ${currentNode.hCost}`,
      );

      this.blocksPlaced = currentNode.totalBlocksPlaced;
      this.best = currentNode;
      if (this.heuristicMultiplier > 0) {
        this.heuristicMultiplier -= this.heuristicMultiplierStep;
        if (this.heuristicMultiplier < 0) this.heuristicMultiplier = 0;

        HeuristicOptimizer.recalculateFcosts(openSetBuffer, this.heuristicMultiplier);
        openSet = new PriorityQueue<AstarNode>(
          openSetBuffer,
          (a, b) => a.fCost - b.fCost,
          false,
        );
      }
      this.noImprovementCounter = 0;
    } else {
      this.noImprovementCounter++;
      if (this.noImprovementCounter >= this.stepAfterNoImprovement) {
        console.log(
          `Blocks remaining: ${currentNode.gameState.blocksToPlace.size}, fCost: ${currentNode.fCost}, gCost: ${currentNode.gCost}, hCost: ${currentNode.hCost}`,
        );

        this.heuristicMultiplier += this.heuristicMultiplierStep;

        this.noImprovementCounter = 0;
        HeuristicOptimizer.trimBuffers(
          openSetBuffer,
          closedSet,
          this.blocksPlaced >> 1,
        );
        HeuristicOptimizer.recalculateFcosts(openSetBuffer, this.heuristicMultiplier);
        openSet = new PriorityQueue<AstarNode>(
          openSetBuffer,
          (a, b) => a.fCost - b.fCost,
          false,
        );

        await Promise.resolve();
      }
    }

    return openSet;
  }
}
