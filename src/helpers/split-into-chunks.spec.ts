/* eslint-disable @typescript-eslint/no-non-null-assertion */
import assert from 'assert';
import { BlockToPlace } from '../blocks/bases/block-to-place';
import { splitIntoChunks } from './split-into-chunks';
import { createBlock } from './testing/testing';

describe('splitIntoChunks', () => {
  it('should return an empty array for an empty map', () => {
    // Given I have an empty map
    const blocks = new Map<string, BlockToPlace>();

    // When I split the blocks into chunks
    const result = splitIntoChunks(blocks);

    // Then I should get an empty array
    expect(result).toEqual([]);
  });

  it('should group blocks by y-coordinate', () => {
    // Given I have a map with blocks on different layers
    const blocks = new Map<string, BlockToPlace>([
      createBlock(0, 0, 0), // y=0
      createBlock(0, 1, 0), // y=1
      createBlock(1, 1, 0), // y=1
      createBlock(0, 2, 0), // y=2
    ]);

    // When I split the blocks into chunks
    const result = splitIntoChunks(blocks, 64, 2);

    // Then I should get two chunks
    expect(result.length).toBe(2);
    const [chunk1, chunk2] = result.map((chunk) => [...chunk.keys()]);
    assert(chunk1);
    assert(chunk2);

    // And the first chunk should contain blocks with y=0,1
    expect(chunk1).toContain('0,0,0');
    expect(chunk1).toContain('0,1,0');
    expect(chunk1).toContain('1,1,0');

    // And the second chunk should contain block4 alone
    expect(chunk2).toContain('0,2,0');
  });

  it('should not split blocks into chunks that are on the same layer', () => {
    // Given I have a map with 10 blocks
    const blocks = new Map<string, BlockToPlace>(
      Array.from({ length: 10 }, (_, i) => createBlock(i, 0, 0)),
    );

    // When I split the blocks into chunks with maxBlocksPerChunk=5
    const result = splitIntoChunks(blocks, 5, 3);

    // Then I should get 1 chunk
    expect(result.length).toBe(1);
  });

  it('should split blocks into chunks that are on different layers', () => {
    // Given I have a map with 6 blocks on 2 layers
    const blocks = new Map<string, BlockToPlace>([
      createBlock(0, 0, 0),
      ...Array.from({ length: 5 }, (_, i) => createBlock(i, 1, 0)),
    ]);

    // When I split the blocks into chunks with maxBlocksPerChunk=5
    const result = splitIntoChunks(blocks, 5, 3);

    // Then I should get 2 chunks
    expect(result.length).toBe(2);
  });

  it('should handle blocks when they exactly match maxBlocksPerChunk', () => {
    // Given I have a map with exactly maxBlocksPerChunk blocks
    const blocks = new Map<string, BlockToPlace>(
      Array.from({ length: 64 }, (_, i) => createBlock(i, 0, 0)),
    );

    // When I split the blocks into chunks
    const result = splitIntoChunks(blocks, 64, 3);

    // Then I should get exactly one chunk with all blocks
    expect(result.length).toBe(1);
    expect(result[0]!.size).toBe(64);
  });

  it('should handle blocks when they have negative y coordinates', () => {
    // Given I have blocks with negative y coordinates
    const blocks = new Map<string, BlockToPlace>([
      createBlock(0, -2, 0),
      createBlock(0, -1, 0),
      createBlock(0, 0, 0),
      createBlock(0, 1, 0),
    ]);

    // When I split the blocks into chunks
    const result = splitIntoChunks(blocks, 64, 2);

    // Then I should get two chunks
    expect(result.length).toBe(2);
    const [chunk1, chunk2] = result.map((chunk) => [...chunk.keys()]);
    assert(chunk1);
    assert(chunk2);

    // And the first chunk should contain blocks with y=-2,-1
    expect(chunk1).toContain('0,-2,0');
    expect(chunk1).toContain('0,-1,0');

    // And the second chunk should contain blocks with y=0,1
    expect(chunk2).toContain('0,0,0');
    expect(chunk2).toContain('0,1,0');
  });

  it("should handle blocks when they skip y coordinates, layers don't get counted", () => {
    // Given I have blocks with skipped y coordinates
    const blocks = new Map<string, BlockToPlace>([
      createBlock(0, 0, 0),
      createBlock(0, 3, 0),
    ]);

    // When I split the blocks into chunks
    const result = splitIntoChunks(blocks, 64, 2);

    // Then I should get two chunks
    expect(result.length).toBe(1);
    const chunk = [...result[0]!.keys()];

    // And the chunk should contain both blocks
    expect(chunk).toContain('0,0,0');
    expect(chunk).toContain('0,3,0');
  });
});
