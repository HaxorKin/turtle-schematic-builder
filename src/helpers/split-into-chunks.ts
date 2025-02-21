import { BlockToPlace } from '../blocks/bases/block-to-place';

const defaultMaxBlocksPerChunk = 64;
const defaultMaxLayersPerChunk = 3;
type BlockEntry = [string, BlockToPlace];

/**
 * Split blocks into chunks that will be placed before the next chunk
 * @param blocks Blocks to split
 * @param maxBlocksPerChunk Maximum number of blocks per chunk (default: 64)
 * @param maxLayersPerChunk Maximum number of layers per chunk (default: 3)
 */
export function splitIntoChunks(
  blocks: Map<string, BlockToPlace>,
  maxBlocksPerChunk = defaultMaxBlocksPerChunk,
  maxLayersPerChunk = defaultMaxLayersPerChunk,
): Map<string, BlockToPlace>[] {
  // Sort blocks by y-coordinate (ascending)
  const sortedBlocks = [...blocks].sort((a, b) => a[1][1] - b[1][1]);
  let currentLayer: BlockEntry[] | undefined;
  let currentLayerY = -1;

  const layers: BlockEntry[][] = [];
  for (const blockEntry of sortedBlocks) {
    const [, block] = blockEntry;
    const y = block[1];
    if (y !== currentLayerY || !currentLayer) {
      currentLayerY = y;
      currentLayer = [];
      layers.push(currentLayer);
    }
    currentLayer.push(blockEntry);
  }

  let currentChunk: BlockEntry[] = [];
  let currentChunkHeight = 0;
  const chunks: BlockEntry[][] = [];
  for (const layer of layers) {
    if (
      currentChunk.length === 0 ||
      currentChunk.length + layer.length <= maxBlocksPerChunk
    ) {
      currentChunk.push(...layer);
      currentChunkHeight++;
    } else {
      chunks.push(currentChunk);
      currentChunk = [...layer];
      currentChunkHeight = 1;
    }

    if (
      currentChunk.length >= maxBlocksPerChunk ||
      currentChunkHeight >= maxLayersPerChunk
    ) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentChunkHeight = 0;
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks.map((chunk) => new Map(chunk));
}
