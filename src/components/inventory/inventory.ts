import { InventoryItem } from './inventory-item';

const turtleSlotLimit = 16;

type InventorySlot = readonly [itemName: string, capacity: number, stackLimit: number];

export class InventoryState {
  readonly addableItemsetRatio: number = 1;
  private readonly maxItemsetSize: number | undefined;

  constructor(
    private readonly slotLimit = turtleSlotLimit,
    private readonly slots: readonly InventorySlot[] = [],
    possibleItems?: Iterable<InventoryItem[]>,
    maxItemsetSize?: number,
    readonly clearCount = 0,
  ) {
    const remainingSlots = slotLimit - slots.length;
    if (maxItemsetSize !== undefined && remainingSlots >= maxItemsetSize) {
      this.maxItemsetSize = maxItemsetSize;
      return; // Everything fits (Do not make stacks bigger than their limit)
    }

    if (possibleItems) {
      maxItemsetSize = 0;
      let addableItemsetCount = 0;
      let possibleItemsetCount = 0;
      for (const item of possibleItems) {
        possibleItemsetCount++;
        if (this.canAddItems(item)) {
          addableItemsetCount++;
        }
        if (item.length > maxItemsetSize) {
          maxItemsetSize = item.length;
        }
      }
      this.addableItemsetRatio = addableItemsetCount / possibleItemsetCount;
    }
  }

  canAddItems(items: InventoryItem[]): boolean {
    const slots = this.slots;
    let remainingSlots = this.slotLimit - slots.length;
    if (remainingSlots >= items.length) {
      return true;
    }

    // If only one needs to be added to a stack
    let itemsToStack = items.length - remainingSlots;
    if (itemsToStack === 1) {
      for (const item of items) {
        const itemName = item.name;
        const lastSlotWithItem = slots.findLast((slot) => slot[0] === itemName);
        if (lastSlotWithItem && lastSlotWithItem[1] >= item.amount) {
          return true;
        }
      }
      return false;
    }

    const itemTypes = new Map<
      string,
      {
        amount: number;
        maxAmount: number;
      }
    >();

    for (const item of items) {
      const itemName = item.name;
      const existing = itemTypes.get(itemName);
      if (existing) {
        existing.amount += item.amount;
      } else {
        itemTypes.set(itemName, {
          amount: item.amount,
          maxAmount: item.maxAmount,
        });
      }
    }

    for (const itemType of itemTypes.values()) {
      const { amount, maxAmount } = itemType;
      if (amount >= maxAmount) {
        const stacks = Math.floor(amount / maxAmount);
        remainingSlots -= stacks;
        if (remainingSlots < 0) {
          return false;
        }
        itemType.amount %= maxAmount;
      }
    }

    itemsToStack = itemTypes.size - remainingSlots;
    if (itemsToStack <= 0) {
      return true;
    }
    for (const [itemName, { amount }] of itemTypes) {
      if (amount > 0) {
        const lastSlotWithItem = slots.findLast((slot) => slot[0] === itemName);
        if (!lastSlotWithItem || lastSlotWithItem[1] < amount) {
          continue; // Cannot fit this item
        }
      }

      if (--itemsToStack === 0) {
        return true;
      }
    }

    return false;
  }

  addItems(
    items: InventoryItem[],
    possibleItems: Iterable<InventoryItem[]>,
    maxItemsetSize: number | undefined = this.maxItemsetSize,
  ): InventoryState {
    const slots = this.slots.slice();

    for (const item of items) {
      const { name, amount, maxAmount } = item;
      const lastSlotWithItemIndex = slots.findLastIndex((slot) => slot[0] === name);
      const lastSlotWithItem = slots[lastSlotWithItemIndex];
      let remaining = amount;
      if (lastSlotWithItem) {
        const capacity = lastSlotWithItem[1];
        if (capacity >= amount) {
          slots[lastSlotWithItemIndex] = [name, capacity - amount, maxAmount];
          continue;
        }

        slots[lastSlotWithItemIndex] = [name, 0, maxAmount];
        remaining -= capacity;
      }

      while (true) {
        if (slots.length >= this.slotLimit) {
          throw new Error('Tried to add an item to a full inventory');
        }
        if (remaining > maxAmount) {
          slots.push([name, maxAmount, maxAmount]);
          remaining -= maxAmount;
        } else {
          slots.push([name, maxAmount - remaining, maxAmount]);
          break;
        }
      }
    }

    return new InventoryState(this.slotLimit, slots, possibleItems, maxItemsetSize);
  }

  clear(): InventoryState {
    return new InventoryState(
      this.slotLimit,
      undefined,
      undefined,
      undefined,
      this.clearCount + 1,
    );
  }

  resetPossibleItems(): InventoryState {
    return new InventoryState(this.slotLimit, this.slots);
  }

  toSlots(): [itemName: string, count: number][] {
    return this.slots.map(([name, capacity, stackLimit]) => [
      name,
      stackLimit - capacity,
    ]);
  }
}
