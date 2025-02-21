import { BlockToPlace } from '../blocks/block-to-place';

type BlockEntry = [string, BlockToPlace];

// Function to split blocks into chunks based on the specified rules
export function splitIntoChunks(
  blocks: Map<string, BlockToPlace>,
  maxBlocksPerChunk = 64,
  maxLayersPerChunk = 3,
): Map<string, BlockToPlace>[] {
  // Sort blocks by y-coordinate (ascending)
  const sortedBlocks = [...blocks].sort((a, b) => a[1][1] - b[1][1]);
  let currentLayer: BlockEntry[];
  let currentLayerY = -1;

  const layers: BlockEntry[][] = [];
  for (const blockEntry of sortedBlocks) {
    const [, block] = blockEntry;
    const y = block[1];
    if (y !== currentLayerY) {
      currentLayerY = y;
      currentLayer = [];
      layers.push(currentLayer);
    }
    currentLayer!.push(blockEntry);
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
