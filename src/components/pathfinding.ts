import { PriorityQueue } from '@js-sdsl/priority-queue';
import { Action } from './action';
import {
  addVectors,
  DOWN,
  manhattanDistance,
  NULL_VECTOR,
  subVectors,
  UP,
  Vector,
  vectorsEqual,
} from './vector';

type AstarNode = {
  position: Vector;
  direction: Vector;
  gCost: number;
  hCost: number;
  fCost: number;
  actions: Action[];
};

export class Pathfinding {
  static findPath(
    from: Vector,
    fromDirection: Vector,
    to: Vector,
    toDirection: Vector,
    size: Vector,
    blockedMap: Int16Array,
  ): Action[] | undefined {
    const queue = new PriorityQueue<AstarNode>([], (a, b) => a.fCost - b.fCost, false);
    const visited = new Set<string>();

    const startHCost = manhattanDistance(from, to);
    const startNode: AstarNode = {
      position: from,
      direction: fromDirection,
      gCost: 0,
      hCost: startHCost,
      fCost: startHCost,
      actions: [],
    };

    queue.push(startNode);

    while (!queue.empty()) {
      const currentNode = queue.pop()!;
      const { position, direction, gCost, hCost, actions } = currentNode;

      // Goal check
      if (vectorsEqual(position, to) && vectorsEqual(direction, toDirection)) {
        return actions;
      }

      const key = `${position};${direction}`;
      if (visited.has(key)) continue;
      visited.add(key);

      // Expand neighbors
      const neighbors = this.getNeighbors(
        position,
        direction,
        gCost,
        hCost,
        actions,
        size,
        blockedMap,
      );
      for (const neighbor of neighbors) {
        const neighborKey = `${neighbor.position};${neighbor.direction}`;
        if (visited.has(neighborKey)) continue;

        neighbor.fCost = neighbor.gCost + manhattanDistance(neighbor.position, to);
        queue.push(neighbor);
      }
    }

    return undefined;
  }

  private static getNeighbors(
    position: Vector,
    direction: Vector,
    gCost: number,
    hCost: number,
    actions: Action[],
    size: Vector,
    blockedMap: Int16Array,
  ): AstarNode[] {
    const neighbors: AstarNode[] = [];

    const movements: { action: Action; vector: Vector; cost: number }[] = [
      { action: 'forward', vector: direction, cost: 1 },
      { action: 'back', vector: subVectors(NULL_VECTOR, direction), cost: 1 },
      { action: 'up', vector: UP, cost: 1 },
      { action: 'down', vector: DOWN, cost: 1 },
    ];

    for (const { action, vector, cost } of movements) {
      const newPos = addVectors(position, vector);
      if (
        this.isWithinBounds(newPos, size) &&
        this.isReachable(newPos, size, blockedMap)
      ) {
        const newGCost = gCost + cost;
        const newHCost = manhattanDistance(newPos, position);
        neighbors.push({
          position: newPos,
          direction,
          gCost: newGCost,
          hCost: newHCost,
          fCost: newGCost + newHCost,
          actions: [...actions, action],
        });
      }
    }

    // Turning actions
    const turns: { action: Action; newDirection: Vector }[] = [
      { action: 'turnLeft', newDirection: this.turnLeft(direction) },
      { action: 'turnRight', newDirection: this.turnRight(direction) },
    ];

    for (const { action, newDirection } of turns) {
      const newGCost = gCost + 0.5;
      neighbors.push({
        position,
        direction: newDirection,
        gCost: newGCost,
        hCost,
        fCost: newGCost + hCost,
        actions: [...actions, action],
      });
    }

    return neighbors;
  }

  private static turnLeft([x, , z]: Vector): Vector {
    return [z, 0, -x];
  }

  private static turnRight([x, , z]: Vector): Vector {
    return [-z, 0, x];
  }

  private static isWithinBounds(position: Vector, size: Vector): boolean {
    const [x, y, z] = position;
    const [width, height, depth] = size;
    return x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth;
  }

  private static isReachable(
    position: Vector,
    size: Vector,
    blockedMap: Int16Array,
  ): boolean {
    const [x, y, z] = position;
    const index = x + y * size[0] + z * size[0] * size[1];
    return blockedMap[index] !== -2;
  }
}
