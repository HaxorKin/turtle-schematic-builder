import { RequireOneOrNone } from 'type-fest';

interface ItemBeforeMapping {
  name?: string | [string, string];
}

interface ItemAfterMapping {
  name: string;
}

type BlockBeforeMapping = {
  name: string;
} & RequireOneOrNone<{
  item: ItemBeforeMapping;
  items: ItemBeforeMapping[];
}>;

type BlockAfterMapping<T extends BlockBeforeMapping> = T &
  RequireOneOrNone<{
    item: T['item'] & ItemAfterMapping;
    items: T['items'] & ItemAfterMapping[];
  }>;

function fullMatchRegex(regexStr: string) {
  if (!regexStr.startsWith('^')) regexStr = `^${regexStr}`;
  if (!regexStr.endsWith('$')) regexStr = `${regexStr}$`;
  return new RegExp(regexStr);
}

function mapItemName(
  blockName: string,
  [regexStr, replacer]: [string, string],
): string {
  const regex = fullMatchRegex(regexStr);
  if (!regex.test(blockName)) {
    throw new Error(
      `[Item mapping] Regex ${regexStr} does not match block name ${blockName}`,
    );
  }
  return blockName.replace(regex, replacer);
}

export function mapBlockItemNames<T extends BlockBeforeMapping>(
  block: T,
): BlockAfterMapping<T> {
  if (block.item) {
    const rawName = block.item.name;
    if (typeof rawName === 'string') {
      return block as BlockAfterMapping<T>;
    }

    const itemName = rawName ? mapItemName(block.name, rawName) : block.name;
    return {
      ...block,
      item: {
        ...block.item,
        name: itemName,
      },
    } as BlockAfterMapping<T>;
  }

  if (block.items) {
    const items = block.items.map((item) => {
      if (!Array.isArray(item.name)) return item;

      const itemName = mapItemName(block.name, item.name);
      return {
        ...item,
        name: itemName,
      };
    });

    return {
      ...block,
      items,
    } as BlockAfterMapping<T>;
  }

  return block as BlockAfterMapping<T>;
}
