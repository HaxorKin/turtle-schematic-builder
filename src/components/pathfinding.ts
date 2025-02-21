import { PriorityQueue } from '@js-sdsl/priority-queue';
import { Action } from './action';
import { ReachabilityState } from './reachability';
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

interface AstarNode {
  position: Vector;
  direction: Vector;
  gCost: number;
  hCost: number;
  fCost: number;
  actions: Action[];
}

export function findPath(
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

  let currentNode: AstarNode | undefined;
  while ((currentNode = queue.pop())) {
    const { position, direction, gCost, hCost, actions } = currentNode;

    // Goal check
    if (vectorsEqual(position, to) && vectorsEqual(direction, toDirection)) {
      return actions;
    }

    const key = `${position};${direction}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // Expand neighbors
    const neighbors = getNeighbors(
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

function getNeighbors(
  position: Vector,
  direction: Vector,
  gCost: number,
  hCost: number,
  actions: Action[],
  size: Vector,
  blockedMap: Int16Array,
): AstarNode[] {
  const neighbors: AstarNode[] = [];

  const movements: { action: Action; vector: Vector }[] = [
    { action: 'forward', vector: direction },
    { action: 'back', vector: subVectors(NULL_VECTOR, direction) },
    { action: 'up', vector: UP },
    { action: 'down', vector: DOWN },
  ];

  for (const { action, vector } of movements) {
    const newPos = addVectors(position, vector);
    if (isWithinBounds(newPos, size) && isReachable(newPos, size, blockedMap)) {
      const moveCost = 1;
      const newGCost = gCost + moveCost;
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
    { action: 'turnLeft', newDirection: turnLeft(direction) },
    { action: 'turnRight', newDirection: turnRight(direction) },
  ];

  for (const { action, newDirection } of turns) {
    const turnCost = 0.5;
    const newGCost = gCost + turnCost;
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

function turnLeft([x, , z]: Vector): Vector {
  return [z, 0, -x];
}

function turnRight([x, , z]: Vector): Vector {
  return [-z, 0, x];
}

function isWithinBounds(position: Vector, size: Vector): boolean {
  const [x, y, z] = position;
  const [width, height, depth] = size;
  return x >= 0 && x < width && y >= 0 && y < height && z >= 0 && z < depth;
}

function isReachable(position: Vector, size: Vector, blockedMap: Int16Array): boolean {
  const [x, y, z] = position;
  const index = x + y * size[0] + z * size[0] * size[1];
  return blockedMap[index] !== (ReachabilityState.Blocked as number);
}
