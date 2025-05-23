/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { PriorityQueue } from '@datastructures-js/priority-queue';
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { setTryToAdd } from '../helpers/try-to-add';
import { Dir } from './dir';
import { Vector } from './vector';

export type PathNode = number;
// Node type for pathfinding
type AStarNode = [
  fScore: number,
  cacheIndex: number,
  x: number,
  y: number,
  z: number,
  distance: number,
  index: number,
  parent?: AStarNode,
];

export const enum ReachabilityState {
  Blocked = -2,
  Unreachable = -1,
  OutOfBounds = -3,
}

export class Reachability {
  public readonly originDistance: Int16Array;

  constructor(
    readonly size: Vector,
    readonly origin: Vector,
    readonly gateMap: Uint8Array,
    blockedMap?: Int16Array,
    originDistance?: Int16Array,
  ) {
    if (!originDistance) {
      if (!blockedMap) {
        this.originDistance = new Int16Array(size[0] * size[1] * size[2]).fill(
          ReachabilityState.Unreachable,
        );
      } else {
        this.originDistance = blockedMap.map((x) =>
          x === (ReachabilityState.Blocked as number)
            ? ReachabilityState.Blocked
            : ReachabilityState.Unreachable,
        );
      }

      this.floodFill(...origin, 0);
    } else {
      this.originDistance = originDistance;
    }
  }

  bfsFromTurtle(
    turtlePosition: Vector,
    rachableBlockCallback: (
      props: [x: number, y: number, z: number, distance: number, index: number],
    ) => boolean,
  ) {
    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const [x, y, z] = turtlePosition;
    const index = x + y * width + z * widthHeight;
    const queue: [x: number, y: number, z: number, distance: number, index: number][] =
      [[...turtlePosition, 0, index]];
    const visitedPositions = new Set<number>();
    visitedPositions.add(index);

    let queueItem: [number, number, number, number, number] | undefined;
    while ((queueItem = queue.shift())) {
      const [x, y, z, distance, index] = queueItem;
      if (rachableBlockCallback(queueItem)) return;

      if (originDistance[index] === ReachabilityState.Blocked) continue; // Only checked after callback, so waterlogged blocks can be double-placed

      const neighborDistance = distance + 1;
      if (x + 1 < width) {
        const neighborIndex = index + 1;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x + 1, y, z, neighborDistance, neighborIndex]);
        }
      }
      if (x - 1 >= 0) {
        const neighborIndex = index - 1;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x - 1, y, z, neighborDistance, neighborIndex]);
        }
      }
      if (y + 1 < height) {
        const neighborIndex = index + width;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x, y + 1, z, neighborDistance, neighborIndex]);
        }
      }
      if (y - 1 >= 0) {
        const neighborIndex = index - width;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x, y - 1, z, neighborDistance, neighborIndex]);
        }
      }
      if (z + 1 < depth) {
        const neighborIndex = index + widthHeight;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x, y, z + 1, neighborDistance, neighborIndex]);
        }
      }
      if (z - 1 >= 0) {
        const neighborIndex = index - widthHeight;
        if (setTryToAdd(visitedPositions, neighborIndex)) {
          queue.push([x, y, z - 1, neighborDistance, neighborIndex]);
        }
      }
    }
  }

  /**
   * PathNodes are in reverse order, from destination to source.
   * @throws {Error} When destination is blocked or unreachable.
   */
  path(from: Vector, to: Vector, cache?: PathNode[]): PathNode[] {
    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const [fromX, fromY, fromZ] = from;
    const [toX, toY, toZ] = to;

    // Quick exit for identical source and destination
    if (fromX === toX && fromY === toY && fromZ === toZ) {
      return [];
    }

    const srcIndex = fromX + fromY * width + fromZ * widthHeight;

    if (cache) {
      const cacheIndex = cache.indexOf(srcIndex);
      if (cacheIndex !== -1) {
        return cache.slice(0, cacheIndex + 1);
      }
    }

    const destIndex = toX + toY * width + toZ * widthHeight;

    // Manhattan distance heuristic
    const heuristic = (x: number, y: number, z: number): number => {
      return Math.abs(x - toX) + Math.abs(y - toY) + Math.abs(z - toZ);
    };

    // Create priority queue with min-heap based on fScore
    const queue = new PriorityQueue<AStarNode>((a, b) => a[0] - b[0] || b[1] - a[1]);

    // Add starting node
    queue.enqueue([
      heuristic(fromX, fromY, fromZ),
      -1,
      fromX,
      fromY,
      fromZ,
      0,
      srcIndex,
    ]);

    const visitedPositions = new Set<number>();
    visitedPositions.add(srcIndex);

    let astarNode: AStarNode | null;
    while ((astarNode = queue.dequeue())) {
      const [, cacheIndex, x, y, z, distance, index] = astarNode;

      // Check if we've reached the destination
      if (index === destIndex) {
        const parentNode = astarNode[7];
        return this.getPathNodes(parentNode);
      }

      // Check if we reached a cached position
      if (cacheIndex !== -1) {
        const parentNode = astarNode[7];
        return this.getPathNodes(parentNode, cache!.slice(0, cacheIndex + 1));
      }

      const neighborDistance = distance + 1;

      // Check all six directions
      const currentNode = astarNode;
      const checkNeighbor = (x: number, y: number, z: number, index: number) => {
        let cacheIndex: number | undefined;

        if (index !== destIndex) {
          // Skip blocked positions
          if (originDistance[index] === ReachabilityState.Blocked) {
            return;
          }

          if (!setTryToAdd(visitedPositions, index)) {
            return;
          }

          cacheIndex = cache?.indexOf(index);
        }

        // Calculate f-score (g + h) and add to queue
        const fScore = neighborDistance + heuristic(x, y, z);
        queue.enqueue([
          fScore,
          cacheIndex ?? -1,
          x,
          y,
          z,
          neighborDistance,
          index,
          currentNode,
        ]);
      };

      if (x + 1 < width) {
        checkNeighbor(x + 1, y, z, index + 1);
      }
      if (x - 1 >= 0) {
        checkNeighbor(x - 1, y, z, index - 1);
      }
      if (y + 1 < height) {
        checkNeighbor(x, y + 1, z, index + width);
      }
      if (y - 1 >= 0) {
        checkNeighbor(x, y - 1, z, index - width);
      }
      if (z + 1 < depth) {
        checkNeighbor(x, y, z + 1, index + widthHeight);
      }
      if (z - 1 >= 0) {
        checkNeighbor(x, y, z - 1, index - widthHeight);
      }
    }

    // If we exhaust the queue without finding the destination, it's unreachable
    throw new Error('Destination is unreachable');
  }

  block(
    position: Vector,
    dependants: undefined | BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    const { originDistance } = this;
    const [x, y, z] = position;
    const [width, height] = this.size;
    const widthHeight = width * height;
    const index = x + y * width + z * widthHeight;
    const newOriginDistance = originDistance.slice();
    const originalDistance = originDistance[index]!;
    newOriginDistance[index] = ReachabilityState.Blocked;
    let newReachability = new Reachability(
      this.size,
      this.origin,
      this.gateMap,
      undefined,
      newOriginDistance,
    );

    if (dependants) {
      const gateMap = newReachability.gateMap;
      let newGateMap: Uint8Array | undefined;
      let changedPositions: Vector[] | undefined;
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * widthHeight;
        if (newOriginDistance[index] !== ReachabilityState.Blocked) {
          const newGates = block.reachabilityDirections(newReachability, blocksToPlace);
          if (newGates !== undefined && newGates !== gateMap[index]) {
            newGateMap ??= gateMap.slice();
            changedPositions ??= [];
            newGateMap[index] = newGates;
            changedPositions.push(block);
          }
        }
      }
      if (newGateMap) {
        newReachability = new Reachability(
          this.size,
          this.origin,
          newGateMap,
          undefined,
          newOriginDistance,
        );

        for (const pos of changedPositions!) {
          const [x, y, z] = pos;
          const index = x + y * width + z * widthHeight;
          const originalDistance = originDistance[index]!;
          newReachability.recalculateFromPos(pos, originalDistance);
        }
      }
    }

    newReachability.recalculateFromPos(position, originalDistance);

    return newReachability;
  }

  blockMany(
    positions: Vector[],
    dependants: undefined | BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    const { originDistance } = this;
    const [width, height] = this.size;
    const widthHeight = width * height;
    const newOriginDistance = this.originDistance.slice();
    let newReachability = new Reachability(
      this.size,
      this.origin,
      this.gateMap,
      undefined,
      newOriginDistance,
    );

    for (const pos of positions) {
      const [x, y, z] = pos;
      const index = x + y * width + z * widthHeight;
      newOriginDistance[index] = ReachabilityState.Blocked;
    }

    if (dependants) {
      const gateMap = newReachability.gateMap;
      let newGateMap: Uint8Array | undefined;
      let changedPositions: Vector[] | undefined;
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * widthHeight;
        if (newOriginDistance[index] !== ReachabilityState.Blocked) {
          const newGates = block.reachabilityDirections(newReachability, blocksToPlace);
          if (newGates !== undefined && newGates !== gateMap[index]) {
            newGateMap ??= gateMap.slice();
            changedPositions ??= [];
            newGateMap[index] = newGates;
            changedPositions.push(block);
          }
        }
      }
      if (newGateMap) {
        newReachability = new Reachability(
          this.size,
          this.origin,
          newGateMap,
          undefined,
          newOriginDistance,
        );

        for (const pos of changedPositions!) {
          const [x, y, z] = pos;
          const index = x + y * width + z * widthHeight;
          const originalDistance = originDistance[index]!;
          newReachability.recalculateFromPos(pos, originalDistance);
        }
      }
    }

    for (const pos of positions) {
      const [x, y, z] = pos;
      const index = x + y * width + z * widthHeight;
      const originalDistance = originDistance[index]!;
      newReachability.recalculateFromPos(pos, originalDistance);
    }

    return newReachability;
  }

  at(x: number, y: number, z: number) {
    const [width, height, depth] = this.size;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) {
      return ReachabilityState.OutOfBounds;
    }
    return this.originDistance[x + y * width + z * width * height]!;
  }

  gatesAt(x: number, y: number, z: number) {
    const [width, height, depth] = this.size;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return 0;
    return this.gateMap[x + y * width + z * width * height]!;
  }

  private getPathNodes(
    astarNode: AStarNode | undefined,
    pathNodes: PathNode[] = [],
  ): PathNode[] {
    let currentNode: AStarNode | undefined = astarNode;
    while (currentNode) {
      const index = currentNode[6];
      pathNodes.push(index);
      currentNode = currentNode[7];
    }
    // Not reversed, for efficiency
    return pathNodes;
  }

  private isDistanceInvalid(
    index: number,
    x: number,
    y: number,
    z: number,
    distance: number,
    dirtyPositions: Map<number, Vector>,
  ) {
    if (distance <= 0) return false;

    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const gates = this.gateMap[index]!;
    const sourceDistance = distance - 1;

    if (x + 1 < width && gates & Dir.East) {
      const neighborIndex = index + 1;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }
    if (x - 1 >= 0 && gates & Dir.West) {
      const neighborIndex = index - 1;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }
    if (y + 1 < height && gates & Dir.Up) {
      const neighborIndex = index + width;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }
    if (y - 1 >= 0 && gates & Dir.Down) {
      const neighborIndex = index - width;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }
    if (z + 1 < depth && gates & Dir.South) {
      const neighborIndex = index + widthHeight;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }
    if (z - 1 >= 0 && gates & Dir.North) {
      const neighborIndex = index - widthHeight;
      const neighborDistance = originDistance[neighborIndex];
      if (neighborDistance === sourceDistance && !dirtyPositions.has(neighborIndex)) {
        return false;
      }
    }

    return true;
  }

  private getUpdatedReachability(index: number, changedPoint: Vector) {
    const { originDistance } = this;
    if (originDistance[index] === ReachabilityState.Blocked) {
      return ReachabilityState.Blocked;
    }

    const [x, y, z] = changedPoint;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;

    const gates = this.gateMap[index]!;
    let minDistance = Infinity;

    if (x + 1 < width && gates & Dir.East) {
      const neighborIndex = index + 1;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (x - 1 >= 0 && gates & Dir.West) {
      const neighborIndex = index - 1;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (y + 1 < height && gates & Dir.Up) {
      const neighborIndex = index + width;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (y - 1 >= 0 && gates & Dir.Down) {
      const neighborIndex = index - width;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (z + 1 < depth && gates & Dir.South) {
      const neighborIndex = index + widthHeight;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (z - 1 >= 0 && gates & Dir.North) {
      const neighborIndex = index - widthHeight;
      const neighborDistance = originDistance[neighborIndex]!;
      if (neighborDistance >= 0 && neighborDistance < minDistance) {
        minDistance = neighborDistance;
      }
    }

    if (minDistance === Infinity) {
      return ReachabilityState.Unreachable;
    } else {
      return minDistance + 1;
    }
  }

  private recalculateFromPos(changedPoint: Vector, originalReachability: number) {
    const [width, height] = this.size;
    const widthHeight = width * height;
    const [x, y, z] = changedPoint;
    const index = x + y * width + z * widthHeight;

    const newReachability = this.getUpdatedReachability(index, changedPoint);
    if (newReachability === originalReachability) {
      return;
    }

    if (
      originalReachability >= 0 &&
      (newReachability < 0 || newReachability > originalReachability)
    ) {
      this.recalculateWorseReachability(changedPoint, originalReachability);
    } else if (
      newReachability >= 0 &&
      (originalReachability < 0 || newReachability < originalReachability)
    ) {
      this.floodFill(...changedPoint, newReachability);
    }
  }

  private recalculateWorseReachability(changedPoint: Vector, originalDistance: number) {
    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const [x, y, z] = changedPoint;
    const index = x + y * width + z * widthHeight;

    const dirtyPositions = new Map<number, Vector>();
    dirtyPositions.set(index, [x, y, z]);

    const recalculatePositions: [
      index: number,
      ...changedPoint: Vector,
      originalDistance: number,
    ][] = [[index, ...changedPoint, originalDistance]];

    const checkPoint = (
      index: number,
      x: number,
      y: number,
      z: number,
      dependantDistance: number,
    ) => {
      const distance = originDistance[index];
      if (
        distance === dependantDistance &&
        !dirtyPositions.has(index) &&
        this.isDistanceInvalid(index, x, y, z, distance, dirtyPositions)
      ) {
        recalculatePositions.push([index, x, y, z, dependantDistance]);
        dirtyPositions.set(index, [x, y, z]);
      }
    };

    let nextRecalculate: [number, number, number, number, number] | undefined;
    while ((nextRecalculate = recalculatePositions.shift())) {
      const [index, x, y, z, originalDistance] = nextRecalculate;
      const dependantDistance = originalDistance + 1;

      if (x + 1 < width) {
        checkPoint(index + 1, x + 1, y, z, dependantDistance);
      }
      if (x - 1 >= 0) {
        checkPoint(index - 1, x - 1, y, z, dependantDistance);
      }
      if (y + 1 < height) {
        checkPoint(index + width, x, y + 1, z, dependantDistance);
      }
      if (y - 1 >= 0) {
        checkPoint(index - width, x, y - 1, z, dependantDistance);
      }
      if (z + 1 < depth) {
        checkPoint(index + widthHeight, x, y, z + 1, dependantDistance);
      }
      if (z - 1 >= 0) {
        checkPoint(index - widthHeight, x, y, z - 1, dependantDistance);
      }
    }

    if (originDistance[index] === ReachabilityState.Blocked) {
      if (dirtyPositions.size === 1) {
        // Nothing else changed
        return;
      }

      dirtyPositions.delete(index);
    }

    this.fillDirtyPositions(dirtyPositions);
  }

  private floodFill(x: number, y: number, z: number, distance: number) {
    const { originDistance, gateMap } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const index = x + y * width + z * widthHeight;

    const queue: [index: number, x: number, y: number, z: number, distance: number][] =
      [];

    const addPoint = (
      dir: Dir,
      index: number,
      x: number,
      y: number,
      z: number,
      distance: number,
    ) => {
      const neighborGates = gateMap[index]!;
      if ((neighborGates & dir) === 0) {
        return;
      }

      const currentVisitedDistance = originDistance[index]!;
      if (
        currentVisitedDistance === (ReachabilityState.Blocked as number) ||
        (currentVisitedDistance !== (ReachabilityState.Unreachable as number) &&
          currentVisitedDistance <= distance)
      ) {
        return;
      }

      originDistance[index] = distance;
      queue.push([index, x, y, z, distance]);
    };

    addPoint(Dir.All, index, x, y, z, distance);

    let nextPoint: [number, number, number, number, number] | undefined;
    while ((nextPoint = queue.shift())) {
      const [index, x, y, z, distance] = nextPoint;

      const neighborDistance = distance + 1;

      if (x + 1 < width) {
        addPoint(Dir.West, index + 1, x + 1, y, z, neighborDistance);
      }
      if (x - 1 >= 0) {
        addPoint(Dir.East, index - 1, x - 1, y, z, neighborDistance);
      }
      if (y + 1 < height) {
        addPoint(Dir.Down, index + width, x, y + 1, z, neighborDistance);
      }
      if (y - 1 >= 0) {
        addPoint(Dir.Up, index - width, x, y - 1, z, neighborDistance);
      }
      if (z + 1 < depth) {
        addPoint(Dir.North, index + widthHeight, x, y, z + 1, neighborDistance);
      }
      if (z - 1 >= 0) {
        addPoint(Dir.South, index - widthHeight, x, y, z - 1, neighborDistance);
      }
    }
  }

  private fillDirtyPositions(dirtyPositions: Map<number, Vector>): void {
    const { originDistance, gateMap } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;

    // Find all neighbors of dirty positions that are not dirty and are reachable
    const queue: [number, number, number, number, number][] = [];
    for (const [index, [x, y, z]] of dirtyPositions) {
      const gates = gateMap[index]!;
      let minDistance = Infinity;

      // East
      if (x + 1 < width && gates & Dir.East) {
        const neighborIndex = index + 1;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }
      // West
      if (x - 1 >= 0 && gates & Dir.West) {
        const neighborIndex = index - 1;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }
      // Up
      if (y + 1 < height && gates & Dir.Up) {
        const neighborIndex = index + width;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }
      // Down
      if (y - 1 >= 0 && gates & Dir.Down) {
        const neighborIndex = index - width;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }
      // South
      if (z + 1 < depth && gates & Dir.South) {
        const neighborIndex = index + widthHeight;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }
      // North
      if (z - 1 >= 0 && gates & Dir.North) {
        const neighborIndex = index - widthHeight;
        if (!dirtyPositions.has(neighborIndex)) {
          const neighborDistance = originDistance[neighborIndex]!;
          if (neighborDistance >= 0 && neighborDistance < minDistance) {
            minDistance = neighborDistance;
          }
        }
      }

      if (minDistance !== Infinity) {
        queue.push([index, x, y, z, minDistance + 1]);
      }
    }

    for (const [index, , , , distance] of queue) {
      originDistance[index] = distance;
      dirtyPositions.delete(index);
    }

    const addPoint = (
      dir: Dir,
      index: number,
      x: number,
      y: number,
      z: number,
      distance: number,
    ) => {
      const gates = gateMap[index]!;
      if ((gates & dir) === 0) {
        return;
      }
      const currentDistance = originDistance[index]!;
      if (currentDistance === (ReachabilityState.Blocked as number)) {
        return;
      }

      if (!dirtyPositions.delete(index) && distance >= currentDistance) {
        return;
      }

      originDistance[index] = distance;
      queue.push([index, x, y, z, distance]);
    };

    // BFS to fill in distances for dirty positions
    let nextPoint: [number, number, number, number, number] | undefined;
    while ((nextPoint = queue.shift())) {
      const [index, x, y, z, distance] = nextPoint;

      const neighborDistance = distance + 1;

      if (x + 1 < width) {
        addPoint(Dir.West, index + 1, x + 1, y, z, neighborDistance);
      }
      if (x - 1 >= 0) {
        addPoint(Dir.East, index - 1, x - 1, y, z, neighborDistance);
      }
      if (y + 1 < height) {
        addPoint(Dir.Down, index + width, x, y + 1, z, neighborDistance);
      }
      if (y - 1 >= 0) {
        addPoint(Dir.Up, index - width, x, y - 1, z, neighborDistance);
      }
      if (z + 1 < depth) {
        addPoint(Dir.North, index + widthHeight, x, y, z + 1, neighborDistance);
      }
      if (z - 1 >= 0) {
        addPoint(Dir.South, index - widthHeight, x, y, z - 1, neighborDistance);
      }
    }

    for (const index of dirtyPositions.keys()) {
      originDistance[index] = ReachabilityState.Unreachable;
    }
  }
}
