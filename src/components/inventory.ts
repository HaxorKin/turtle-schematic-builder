import { getItemStackLimit } from '../blocks/block.constants';

export class InventoryState {
  readonly addableItemRatio: number = 1;

  constructor(slotLimit?: number, slots?: [itemName: string, capacity: number][]);
  constructor(
    slotLimit: number,
    slots: [itemName: string, capacity: number][],
    possibleItems: ArrayIterator<string>,
    possibleItemsCount: number,
  );
  constructor(
    private readonly slotLimit: number = 16,
    private readonly slots: [itemName: string, capacity: number][] = [],
    possibleItems?: ArrayIterator<string>,
    possibleItemsCount?: number,
  ) {
    if (slots.length === slotLimit && possibleItems && possibleItemsCount) {
      let addableItemCount = 0;
      for (const item of possibleItems) {
        const lastSlotWithItem = slots.findLast((slot) => slot[0] === item);
        if (lastSlotWithItem && lastSlotWithItem[1] > 0) {
          addableItemCount++;
        }
      }
      this.addableItemRatio = addableItemCount / possibleItemsCount;
    }
  }

  canAddItem(name: string): boolean {
    return (
      this.slots.length < this.slotLimit ||
      this.slots.some((slots) => slots[0] === name && slots[1] > 0)
    );
  }

  addItem(
    name: string,
    possibleItems: ArrayIterator<string>,
    possibleItemsCount: number,
  ): InventoryState {
    const slotIndex = this.slots.findIndex(
      (slots) => slots[0] === name && slots[1] > 0,
    );
    if (slotIndex !== -1) {
      const newSlots = this.slots.slice();
      newSlots[slotIndex] = [name, newSlots[slotIndex][1] - 1];
      return new InventoryState(
        this.slotLimit,
        newSlots,
        possibleItems,
        possibleItemsCount,
      );
    }

    if (this.slots.length < this.slotLimit) {
      const newSlots = this.slots.slice();
      newSlots.push([name, getItemStackLimit(name) - 1]);
      return new InventoryState(
        this.slotLimit,
        newSlots,
        possibleItems,
        possibleItemsCount,
      );
    }

    throw new Error('Tried to add an item to a full inventory');
  }

  clear(): InventoryState {
    return new InventoryState(this.slotLimit);
  }

  toSlots(): [itemName: string, count: number][] {
    return this.slots.map(([name, capacity]) => [
      name,
      getItemStackLimit(name) - capacity,
    ]);
  }
}
