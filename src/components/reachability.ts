import { BlockToPlace } from '../blocks/block-to-place';
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

  private isDistanceValid(x: number, y: number, z: number, distance: number) {
    if (distance <= 0) return true;
    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const index = x + y * width + z * widthHeight;
    const sourceDistance = distance - 1;

    const gates = this.gateMap[index];
    if (x + 1 < width && gates & Dir.East) {
      const neighborDistance = originDistance[index + 1];
      if (neighborDistance === sourceDistance) return true;
    }
    if (x - 1 >= 0 && gates & Dir.West) {
      const neighborDistance = originDistance[index - 1];
      if (neighborDistance === sourceDistance) return true;
    }
    if (y + 1 < height && gates & Dir.Up) {
      const neighborDistance = originDistance[index + width];
      if (neighborDistance === sourceDistance) return true;
    }
    if (y - 1 >= 0 && gates & Dir.Down) {
      const neighborDistance = originDistance[index - width];
      if (neighborDistance === sourceDistance) return true;
    }
    if (z + 1 < depth && gates & Dir.South) {
      const neighborDistance = originDistance[index + widthHeight];
      if (neighborDistance === sourceDistance) return true;
    }
    if (z - 1 >= 0 && gates & Dir.North) {
      const neighborDistance = originDistance[index - widthHeight];
      if (neighborDistance === sourceDistance) return true;
    }

    return false;
  }

  /**
   * Computes whether the change to the changedPoint requires recalculating the reachability map.
   * Check all of the neighbors of the changed point
   * If the distance set to the neighbor point is originalDistance + 1, then it might be a point that was reached through our point
   * Check the neighbor (based on its gates) if it has any other neighbor with a distance of originalDistance, other than our point
   */
  private shouldRecalculate(changedPoint: Vector, originalDistance: number) {
    const [x, y, z] = changedPoint;
    const { originDistance } = this;
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const index = x + y * width + z * widthHeight;
    const dependantDistance = originalDistance + 1;

    if (x + 1 < width) {
      const neighborDistance = originDistance[index + 1];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x + 1, y, z, neighborDistance)
      ) {
        return true;
      }
    }
    if (x - 1 >= 0) {
      const neighborDistance = originDistance[index - 1];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x - 1, y, z, neighborDistance)
      ) {
        return true;
      }
    }
    if (y + 1 < height) {
      const neighborDistance = originDistance[index + width];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x, y + 1, z, neighborDistance)
      ) {
        return true;
      }
    }
    if (y - 1 >= 0) {
      const neighborDistance = originDistance[index - width];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x, y - 1, z, neighborDistance)
      ) {
        return true;
      }
    }
    if (z + 1 < depth) {
      const neighborDistance = originDistance[index + widthHeight];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x, y, z + 1, neighborDistance)
      ) {
        return true;
      }
    }
    if (z - 1 >= 0) {
      const neighborDistance = originDistance[index - widthHeight];
      if (
        neighborDistance === dependantDistance &&
        !this.isDistanceValid(x, y, z - 1, neighborDistance)
      ) {
        return true;
      }
    }

    return false;
  }

  private recalculate() {
    this.originDistance.set(this.blockedMap);
    this.floodFill(...this.origin, 0);
  }

  private floodFill(x: number, y: number, z: number, distance: number) {
    const [width, height, depth] = this.size;
    const widthHeight = width * height;
    const queue: [x: number, y: number, z: number, distance: number][] = [
      [x, y, z, distance],
    ];

    while (queue.length > 0) {
      const [x, y, z, distance] = queue.shift()!;
      const index = x + y * width + z * widthHeight;
      const currentVisitedDistance = this.originDistance[index];
      if (currentVisitedDistance === ReachabilityState.Blocked) continue;
      if (
        currentVisitedDistance !== ReachabilityState.Unreachable &&
        currentVisitedDistance <= distance
      )
        continue;
      this.originDistance[index] = distance;
      const neighborDistance = distance + 1;

      if (x + 1 < width) {
        const neighborGates = this.gateMap[index + 1];
        if (neighborGates & Dir.West) queue.push([x + 1, y, z, neighborDistance]);
      }
      if (x - 1 >= 0) {
        const neighborGates = this.gateMap[index - 1];
        if (neighborGates & Dir.East) queue.push([x - 1, y, z, neighborDistance]);
      }
      if (y + 1 < height) {
        const neighborGates = this.gateMap[index + width];
        if (neighborGates & Dir.Down) queue.push([x, y + 1, z, neighborDistance]);
      }
      if (y - 1 >= 0) {
        const neighborGates = this.gateMap[index - width];
        if (neighborGates & Dir.Up) queue.push([x, y - 1, z, neighborDistance]);
      }
      if (z + 1 < depth) {
        const neighborGates = this.gateMap[index + widthHeight];
        if (neighborGates & Dir.North) queue.push([x, y, z + 1, neighborDistance]);
      }
      if (z - 1 >= 0) {
        const neighborGates = this.gateMap[index - widthHeight];
        if (neighborGates & Dir.South) queue.push([x, y, z - 1, neighborDistance]);
      }
    }
  }

  floodFillFromTurtle(
    turtlePosition: Vector,
    rachableBlockCallback: (
      props: [x: number, y: number, z: number, distance: number],
    ) => boolean,
  ) {
    const { blockedMap } = this;
    const [width, height, depth] = this.size;
    const queue: [x: number, y: number, z: number, distance: number][] = [
      [...turtlePosition, 0],
    ];
    const visitedPositions = new Set<string>();

    while (queue.length > 0) {
      const queueItem = queue.shift()!;
      const [x, y, z, distance] = queueItem;
      const key = `${x},${y},${z}`;
      if (visitedPositions.has(key)) continue;

      const index = x + y * width + z * width * height;
      const blockedState = blockedMap[index];
      if (rachableBlockCallback(queueItem)) return;
      if (blockedState === ReachabilityState.Blocked) continue; // Only checked after callback, so waterlogged blocks can be double-placed
      visitedPositions.add(key);

      const neighborDistance = distance + 1;
      if (x + 1 < width) queue.push([x + 1, y, z, neighborDistance]);
      if (x - 1 >= 0) queue.push([x - 1, y, z, neighborDistance]);
      if (y + 1 < height) queue.push([x, y + 1, z, neighborDistance]);
      if (y - 1 >= 0) queue.push([x, y - 1, z, neighborDistance]);
      if (z + 1 < depth) queue.push([x, y, z + 1, neighborDistance]);
      if (z - 1 >= 0) queue.push([x, y, z - 1, neighborDistance]);
    }
  }

  block(
    position: Vector,
    dependants: undefined | BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    const [x, y, z] = position;
    const [width, height] = this.size;
    const index = x + y * width + z * width * height;
    const newBlockedMap = this.blockedMap.slice();
    const newOriginDistance = this.originDistance.slice();
    const originalDistance = newOriginDistance[index];
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
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * width * height;
        if (newBlockedMap[index] !== ReachabilityState.Blocked) {
          const newGates = block.reachabilityDirections(newReachability, blocksToPlace);
          if (newGates !== undefined && newGates !== gateMap[index]) {
            newGateMap ??= gateMap.slice();
            newGateMap[index] = newGates;
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
      }
    }

    if (newReachability.shouldRecalculate(position, originalDistance)) {
      newReachability.recalculate();
    }
    return newReachability;
  }

  blockMany(
    positions: Vector[],
    dependants: undefined | BlockToPlace[],
    blocksToPlace: Map<string, BlockToPlace>,
  ) {
    const { originDistance } = this;
    const [width, height] = this.size;
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
      const index = x + y * width + z * width * height;
      newBlockedMap[index] = ReachabilityState.Blocked;
      newOriginDistance[index] = ReachabilityState.Blocked;
    }

    if (dependants) {
      const gateMap = newReachability.gateMap;
      let newGateMap: Uint8Array | undefined;
      for (const block of dependants) {
        const [x, y, z] = block;
        const index = x + y * width + z * width * height;
        if (newBlockedMap[index] !== ReachabilityState.Blocked) {
          const newGates = block.reachabilityDirections(newReachability, blocksToPlace);
          if (newGates !== undefined && newGates !== gateMap[index]) {
            newGateMap ??= gateMap.slice();
            newGateMap[index] = newGates;
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
      }
    }

    for (const pos of positions) {
      const [x, y, z] = pos;
      const index = x + y * width + z * width * height;
      if (this.shouldRecalculate(pos, originDistance[index])) {
        newReachability.recalculate();
        break;
      }
    }

    return newReachability;
  }

  at(x: number, y: number, z: number) {
    const [width, height, depth] = this.size;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth)
      return ReachabilityState.OutOfBounds;
    return this.originDistance[x + y * width + z * width * height];
  }

  gatesAt(x: number, y: number, z: number) {
    const [width, height, depth] = this.size;
    if (x < 0 || x >= width || y < 0 || y >= height || z < 0 || z >= depth) return 0;
    return this.gateMap[x + y * width + z * width * height];
  }

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
}
