import assert from 'assert';
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { Dir } from '../components/dir';
import { createBlockDependencyMap } from './create-block-dependency-map';
import { createBlock } from './testing/testing';

describe('createBlockDependencyMap', () => {
  it('should create empty dependency map when no blocks have dependencies', () => {
    const blocks = new Map<string, BlockToPlace>([
      createBlock(0, 0, 0),
      createBlock(1, 0, 0),
    ]);

    const result = createBlockDependencyMap(blocks);
    expect(result.size).toBe(0);
  });

  it('should create correct dependencies for blocks with dependency directions', () => {
    const blocks = [
      createBlock(0, 0, 0),
      createBlock(0, 1, 0, { dependencyDirections: Dir.Down }),
    ] as const;
    const [[, block1], [, block2]] = blocks;

    const result = createBlockDependencyMap(new Map(blocks));
    expect(result.size).toBe(1);
    expect(result.get(block1)).toEqual([block2]);
  });

  it('should handle multiple dependencies for a single block', () => {
    const blocks = [
      createBlock(0, 0, 0),
      createBlock(1, 0, 0, { dependencyDirections: Dir.West }),
      createBlock(0, 1, 0, { dependencyDirections: Dir.Down }),
    ] as const;
    const [[, block1], [, block2], [, block3]] = blocks;

    const result = createBlockDependencyMap(new Map(blocks));
    expect(result.size).toBe(1);
    const block1Result = result.get(block1);
    assert(block1Result);
    expect(block1Result.length).toBe(2);
    expect(result.get(block1)).toEqual(expect.arrayContaining([block2, block3]));
  });
});
