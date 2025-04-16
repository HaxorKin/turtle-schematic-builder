/* eslint-disable @typescript-eslint/no-magic-numbers */

export type Vector = [number, number, number];
interface VectorLike {
  0: number;
  1: number;
  2: number;
}

export const NORTH: Vector = [0, 0, -1];
export const EAST: Vector = [1, 0, 0];
export const SOUTH: Vector = [0, 0, 1];
export const WEST: Vector = [-1, 0, 0];
export const UP: Vector = [0, 1, 0];
export const DOWN: Vector = [0, -1, 0];
export const NULL_VECTOR: Vector = [0, 0, 0];
export const facingMapping = {
  north: NORTH,
  east: EAST,
  south: SOUTH,
  west: WEST,
  up: UP,
  down: DOWN,
} as const;

export const addVectors = (a: VectorLike, b: VectorLike): Vector => [
  a[0] + b[0],
  a[1] + b[1],
  a[2] + b[2],
];

export const subVectors = (a: VectorLike, b: VectorLike): Vector => [
  a[0] - b[0],
  a[1] - b[1],
  a[2] - b[2],
];

export const invertVector = (a: VectorLike): Vector => [-a[0], -a[1], -a[2]];

export const vectorsEqual = (a: VectorLike, b: VectorLike) =>
  a[0] === b[0] && a[1] === b[1] && a[2] === b[2];

export const manhattanDistance = (a: VectorLike, b: VectorLike) =>
  Math.abs(a[0] - b[0]) + Math.abs(a[1] - b[1]) + Math.abs(a[2] - b[2]);
