/* eslint-disable @typescript-eslint/no-magic-numbers */
import { DOWN, EAST, NORTH, SOUTH, UP, Vector, WEST } from './vector';

export const enum Dir {
  East = 0b000001,
  West = 0b000010,
  Up = 0b000100,
  Down = 0b001000,
  South = 0b010000,
  North = 0b100000,
  All = 0b111111,
}

export function vectorToSingleDir([x, y, z]: Vector): Dir {
  if (x !== 0) {
    return x > 0 ? Dir.East : Dir.West;
  } else if (y !== 0) {
    return y > 0 ? Dir.Up : Dir.Down;
  } else {
    return z > 0 ? Dir.South : Dir.North;
  }
}

export function vectorsToDirs(...vectors: [Vector, Vector, ...Vector[]]): number {
  let dirs = 0;
  for (const vector of vectors) {
    dirs |= vectorToSingleDir(vector);
  }
  return dirs;
}

export function mirrorDir(dir: Dir): Dir {
  return dir & 0b010101 ? dir << 1 : dir >> 1;
}

export function dirCount(dirs: number): number {
  return ((dirs * 0b1000000100000010000001) & 0b10001000100010001000100010001) % 0b1111;
}

export function dirsToVectors(dirs: number): Vector[] {
  const vectors = [];
  if (dirs & Dir.East) vectors.push(EAST);
  if (dirs & Dir.West) vectors.push(WEST);
  if (dirs & Dir.Up) vectors.push(UP);
  if (dirs & Dir.Down) vectors.push(DOWN);
  if (dirs & Dir.South) vectors.push(SOUTH);
  if (dirs & Dir.North) vectors.push(NORTH);
  return vectors;
}
