import { Vector } from '../components/vector';

export function boundingBox(points: Iterable<Vector>): [min: Vector, max: Vector] {
  let minX = Infinity;
  let minY = Infinity;
  let minZ = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  let maxZ = -Infinity;

  for (const [x, y, z] of points) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (z < minZ) minZ = z;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
    if (z > maxZ) maxZ = z;
  }

  return [
    [minX, minY, minZ],
    [maxX + 1, maxY + 1, maxZ + 1],
  ];
}
