import {
  DataDrivenBlock,
  ItemDefinition,
} from '../../blocks/data-parser/data-driven-block.type';
import { PaletteBlock } from '../nbt.validator';

const defaultStackSize = 64;

export interface InventoryItem {
  name: string;
  amount: number;
  maxAmount: number; // Max stack size or durability
}

function getInventoryItem(
  itemDefinition: ItemDefinition | undefined,
  paletteBlock: PaletteBlock,
): InventoryItem {
  if (!itemDefinition) {
    return {
      name: paletteBlock.Name.value,
      amount: 1,
      maxAmount: defaultStackSize,
    };
  }

  const name = itemDefinition.name;
  let amount = itemDefinition.amount ?? 1;
  const maxAmount =
    itemDefinition.stackSize ?? itemDefinition.durability ?? defaultStackSize;
  if (typeof amount === 'string') {
    const properties = paletteBlock.Properties?.value;
    if (!properties) {
      throw new Error(
        `[getInventoryItem] Block ${paletteBlock.Name.value} has no properties`,
      );
    }

    const amountField = properties[amount as keyof typeof properties]?.value;
    if (!amountField) {
      throw new Error(
        `[getInventoryItem] Block ${paletteBlock.Name.value} has no field '${amount}'`,
      );
    }

    const amountMapping = itemDefinition.amountMapping;
    if (amountMapping) {
      const mappedAmount = amountMapping[amountField];
      if (!mappedAmount) {
        throw new Error(
          `[getInventoryItem] ItemDefinition for block ${paletteBlock.Name.value} has no amountMapping for ${amountField}`,
        );
      }
      amount = mappedAmount;
    } else {
      amount = parseInt(amountField);
    }
  }

  return {
    name,
    amount,
    maxAmount,
  };
}

export function getInventoryItems(
  dataDrivenBlock: DataDrivenBlock,
  paletteBlock: PaletteBlock,
): InventoryItem[] {
  if (dataDrivenBlock.items) {
    return dataDrivenBlock.items.map((itemDefinition) =>
      getInventoryItem(itemDefinition, paletteBlock),
    );
  }

  return [getInventoryItem(dataDrivenBlock.item, paletteBlock)];
}
