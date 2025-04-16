/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { Dir } from './dir';
import { Vector } from './vector';

export const enum ReachabilityState {
  Blocked = -2,
  Unreachable = -1,
  OutOfBounds = -3,
}

export class Reachability {
  public readonly blockedMap: Int16Array;
  public readonly originDistance: Int16Array;

  constructor(
    readonly size: Vector,
    readonly origin: Vector,
    readonly gateMap: Uint8Array,
    blockedMap?: Int16Array,
    originDistance?: Int16Array,
  ) {
    blockedMap ??= new Int16Array(size[0] * size[1] * size[2]).fill(
      ReachabilityState.Unreachable,
    );
    this.blockedMap = blockedMap;
    if (!originDistance) {
      this.originDistance = blockedMap.slice();
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
    const { blockedMap } = this;
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

      const blockedState = blockedMap[index];
      if (blockedState === ReachabilityState.Blocked) continue; // Only checked after callback, so waterlogged blocks can be double-placed

      const neighborDistance = distance + 1;
      if (x + 1 < width) {
        const neighborIndex = index + 1;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x + 1, y, z, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
      if (x - 1 >= 0) {
        const neighborIndex = index - 1;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x - 1, y, z, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
      if (y + 1 < height) {
        const neighborIndex = index + width;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x, y + 1, z, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
      if (y - 1 >= 0) {
        const neighborIndex = index - width;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x, y - 1, z, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
      if (z + 1 < depth) {
        const neighborIndex = index + widthHeight;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x, y, z + 1, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
      if (z - 1 >= 0) {
        const neighborIndex = index - widthHeight;
        if (!visitedPositions.has(neighborIndex)) {
          queue.push([x, y, z - 1, neighborDistance, neighborIndex]);
          visitedPositions.add(neighborIndex);
        }
      }
    }
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
    const newBlockedMap = this.blockedMap.slice();
    const newOriginDistance = originDistance.slice();
    const originalDistance = originDistance[index]!;
    newBlockedMap[index] = ReachabilityState.Blocked;
    newOriginDistance[index] = ReachabilityState.Blocked;
    let newReachability = new Reachability(
      this.size,
      this.origin,
      this.gateMap,
      newBlockedMap,
      newOriginDistance,
    );

    if (dependants) {
      const gateMap = newReachability.gateMap;
      let newGateMap: Uint8Array | undefined;
      let changedPositions: Vector[] | undefined;
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * widthHeight;
        if (newBlockedMap[index] !== ReachabilityState.Blocked) {
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
          newBlockedMap,
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
    const newBlockedMap = this.blockedMap.slice();
    const newOriginDistance = this.originDistance.slice();
    let newReachability = new Reachability(
      this.size,
      this.origin,
      this.gateMap,
      newBlockedMap,
      newOriginDistance,
    );

    for (const pos of positions) {
      const [x, y, z] = pos;
      const index = x + y * width + z * widthHeight;
      newBlockedMap[index] = ReachabilityState.Blocked;
      newOriginDistance[index] = ReachabilityState.Blocked;
    }

    if (dependants) {
      const gateMap = newReachability.gateMap;
      let newGateMap: Uint8Array | undefined;
      let changedPositions: Vector[] | undefined;
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * widthHeight;
        if (newBlockedMap[index] !== ReachabilityState.Blocked) {
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
          newBlockedMap,
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

  private isDistanceInvalid(
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
    const index = x + y * width + z * widthHeight;
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

    const dirtyPositions = new Map<number, Vector>();

    const recalculatePositions: [...changedPoint: Vector, originalDistance: number][] =
      [[...changedPoint, originalDistance]];

    let nextRecalculate: [number, number, number, number] | undefined;
    while ((nextRecalculate = recalculatePositions.shift())) {
      const [x, y, z, originalDistance] = nextRecalculate;
      const index = x + y * width + z * widthHeight;
      const dependantDistance = originalDistance + 1;
      dirtyPositions.set(index, [x, y, z]);

      if (x + 1 < width) {
        const neighborIndex = index + 1;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x + 1, y, z, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x + 1, y, z, neighborDistance]);
        }
      }

      if (x - 1 >= 0) {
        const neighborIndex = index - 1;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x - 1, y, z, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x - 1, y, z, neighborDistance]);
        }
      }

      if (y + 1 < height) {
        const neighborIndex = index + width;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x, y + 1, z, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x, y + 1, z, neighborDistance]);
        }
      }

      if (y - 1 >= 0) {
        const neighborIndex = index - width;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x, y - 1, z, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x, y - 1, z, neighborDistance]);
        }
      }

      if (z + 1 < depth) {
        const neighborIndex = index + widthHeight;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x, y, z + 1, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x, y, z + 1, neighborDistance]);
        }
      }

      if (z - 1 >= 0) {
        const neighborIndex = index - widthHeight;
        const neighborDistance = originDistance[neighborIndex];
        if (
          neighborDistance === dependantDistance &&
          this.isDistanceInvalid(x, y, z - 1, neighborDistance, dirtyPositions)
        ) {
          recalculatePositions.push([x, y, z - 1, neighborDistance]);
        }
      }
    }

    const [x, y, z] = changedPoint;
    const index = x + y * width + z * widthHeight;
    if (originDistance[index] === ReachabilityState.Blocked) {
      dirtyPositions.delete(index);
    }

    this.fillDirtyPositions(dirtyPositions);
  }

  private floodFill(x: number, y: number, z: number, distance: number) {
    const { originDistance, gateMap } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const queue: [x: number, y: number, z: number, distance: number][] = [
      [x, y, z, distance],
    ];

    let nextPoint: [number, number, number, number] | undefined;
    while ((nextPoint = queue.shift())) {
      const [x, y, z, distance] = nextPoint;
      const index = x + y * width + z * widthHeight;
      const currentVisitedDistance = originDistance[index]!;
      if (
        currentVisitedDistance === (ReachabilityState.Blocked as number) ||
        (currentVisitedDistance !== (ReachabilityState.Unreachable as number) &&
          currentVisitedDistance <= distance)
      ) {
        continue;
      }
      originDistance[index] = distance;
      const neighborDistance = distance + 1;

      if (x + 1 < width) {
        const neighborGates = gateMap[index + 1]!;
        if (neighborGates & Dir.West) queue.push([x + 1, y, z, neighborDistance]);
      }
      if (x - 1 >= 0) {
        const neighborGates = gateMap[index - 1]!;
        if (neighborGates & Dir.East) queue.push([x - 1, y, z, neighborDistance]);
      }
      if (y + 1 < height) {
        const neighborGates = gateMap[index + width]!;
        if (neighborGates & Dir.Down) queue.push([x, y + 1, z, neighborDistance]);
      }
      if (y - 1 >= 0) {
        const neighborGates = gateMap[index - width]!;
        if (neighborGates & Dir.Up) queue.push([x, y - 1, z, neighborDistance]);
      }
      if (z + 1 < depth) {
        const neighborGates = gateMap[index + widthHeight]!;
        if (neighborGates & Dir.North) queue.push([x, y, z + 1, neighborDistance]);
      }
      if (z - 1 >= 0) {
        const neighborGates = gateMap[index - widthHeight]!;
        if (neighborGates & Dir.South) queue.push([x, y, z - 1, neighborDistance]);
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

    // BFS to fill in distances for dirty positions
    while (queue.length > 0) {
      const [index, x, y, z, distance] = queue.shift()!;
      const currentDistance = originDistance[index]!;
      if (currentDistance === (ReachabilityState.Blocked as number)) continue;

      if (!dirtyPositions.delete(index) && distance >= currentDistance) continue;

      originDistance[index] = distance;

      const neighborDistance = distance + 1;

      // East
      if (x + 1 < width) {
        const neighborIndex = index + 1;
        if (gateMap[neighborIndex]! & Dir.West) {
          queue.push([neighborIndex, x + 1, y, z, neighborDistance]);
        }
      }
      // West
      if (x - 1 >= 0) {
        const neighborIndex = index - 1;
        if (gateMap[neighborIndex]! & Dir.East) {
          queue.push([neighborIndex, x - 1, y, z, distance + 1]);
        }
      }
      // Up
      if (y + 1 < height) {
        const neighborIndex = index + width;
        if (gateMap[neighborIndex]! & Dir.Down) {
          queue.push([neighborIndex, x, y + 1, z, distance + 1]);
        }
      }
      // Down
      if (y - 1 >= 0) {
        const neighborIndex = index - width;
        if (gateMap[neighborIndex]! & Dir.Up) {
          queue.push([neighborIndex, x, y - 1, z, distance + 1]);
        }
      }
      // South
      if (z + 1 < depth) {
        const neighborIndex = index + widthHeight;
        if (gateMap[neighborIndex]! & Dir.North) {
          queue.push([neighborIndex, x, y, z + 1, distance + 1]);
        }
      }
      // North
      if (z - 1 >= 0) {
        const neighborIndex = index - widthHeight;
        if (gateMap[neighborIndex]! & Dir.South) {
          queue.push([neighborIndex, x, y, z - 1, distance + 1]);
        }
      }
    }

    // The remaining dirtyPositions are unreachable
    for (const [index] of dirtyPositions) {
      originDistance[index] = ReachabilityState.Unreachable;
    }
  }
}
