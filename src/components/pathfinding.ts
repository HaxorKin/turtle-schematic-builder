import { PriorityQueue } from '@datastructures-js/priority-queue';
import { SimpleAction } from './action';
import { ReachabilityState } from './reachability';
import {
  addVectors,
  DOWN,
  invertVector,
  manhattanDistance,
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
  action?: SimpleAction;
  parent?: AstarNode;
}

export function findPath(
  from: Vector,
  fromDirection: Vector,
  to: Vector,
  toDirection: Vector,
  size: Vector,
  blockedMap: Int16Array,
): SimpleAction[] | undefined {
  const queue = new PriorityQueue<AstarNode>((a, b) => a.fCost - b.fCost);
  const visited = new Set<string>();

  const getNeighbors = getNeighborNodes.bind(null, size, blockedMap, to, visited);

  const startHCost = manhattanDistance(from, to);
  const startNode: AstarNode = {
    position: from,
    direction: fromDirection,
    gCost: 0,
    hCost: startHCost,
    fCost: startHCost,
  };

  queue.push(startNode);

  let currentNode: AstarNode | null;
  while ((currentNode = queue.pop())) {
    const { position, direction } = currentNode;

    // Goal check
    if (vectorsEqual(position, to) && vectorsEqual(direction, toDirection)) {
      return getActions(currentNode);
    }

    const key = `${position};${direction}`;
    if (visited.has(key)) continue;
    visited.add(key);

    // Expand neighbors
    const neighbors = getNeighbors(currentNode);
    for (const neighbor of neighbors) {
      queue.push(neighbor);
    }
  }

  return undefined;
}

function getNeighborNodes(
  size: Vector,
  blockedMap: Int16Array,
  to: Vector,
  visited: Set<string>,
  parent: AstarNode,
): AstarNode[] {
  const { position, direction, gCost, hCost } = parent;

  const neighbors: AstarNode[] = [];

  const movements: { action: SimpleAction; vector: Vector }[] = [
    { action: 'forward', vector: direction },
    { action: 'back', vector: invertVector(direction) },
    { action: 'up', vector: UP },
    { action: 'down', vector: DOWN },
  ];

  const directionSuffix = `;${direction}`;
  for (const { action, vector } of movements) {
    const newPos = addVectors(position, vector);
    if (
      isWithinBounds(newPos, size) &&
      !visited.has(`${newPos}${directionSuffix}`) &&
      isReachable(newPos, size, blockedMap)
    ) {
      const moveCost = 1;
      const newGCost = gCost + moveCost;
      const newHCost = manhattanDistance(newPos, to);
      neighbors.push({
        position: newPos,
        direction,
        gCost: newGCost,
        hCost: newHCost,
        fCost: newGCost + newHCost,
        action,
        parent,
      });
    }
  }

  // Turning actions
  const turns: { action: SimpleAction; newDirection: Vector }[] = [
    { action: 'turnLeft', newDirection: turnLeft(direction) },
    { action: 'turnRight', newDirection: turnRight(direction) },
  ];

  const positionPrefix = `${position};`;
  for (const { action, newDirection } of turns) {
    if (visited.has(`${positionPrefix}${newDirection}`)) continue;

    const turnCost = 0.5;
    const newGCost = gCost + turnCost;
    neighbors.push({
      position,
      direction: newDirection,
      gCost: newGCost,
      hCost,
      fCost: newGCost + hCost,
      action,
      parent,
    });
  }

  return neighbors;
}

function getActions(node: AstarNode): SimpleAction[] {
  const actions: SimpleAction[] = [];
  let currentNode: AstarNode | undefined = node;

  while (currentNode) {
    if (currentNode.action) {
      actions.unshift(currentNode.action);
    }
    currentNode = currentNode.parent;
  }

  return actions;
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
