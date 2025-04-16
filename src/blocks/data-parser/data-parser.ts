import { DataDrivenBlock, RawDataDrivenBlock } from './data-driven-block.type';
import { expandName } from './expand-name';
import { mapBlockItemNames } from './map-block-item-names';

export function dataDrivenBlockKey(block: DataDrivenBlock) {
  const { pos, name } = block;
  return pos ? `${pos}:${name}` : name;
}

export function parseDataDrivenBlocks(
  blocks: RawDataDrivenBlock[],
  dataDrivenBlocks = new Map<string, DataDrivenBlock>(),
  positionOverrides = new Map<string, DataDrivenBlock>(),
) {
  const expandedBlocks = blocks.flatMap((block) => {
    const names = expandName(block.name);
    return names.map((name) => mapBlockItemNames({ ...block, name }));
  });

  for (const block of expandedBlocks) {
    const { name, pos } = block;
    if (pos) {
      const key = `${pos}:${name}`;
      if (positionOverrides.has(key)) {
        throw new Error(`Duplicate position override for ${key}`);
      }
      positionOverrides.set(key, block);
    } else {
      if (dataDrivenBlocks.has(name)) {
        throw new Error(`Duplicate data-driven block for ${name}`);
      }
      dataDrivenBlocks.set(name, block);
    }
  }

  return { dataDrivenBlocks, positionOverrides };
}
