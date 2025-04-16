import { InventoryState } from './inventory';
import { InventoryItem } from './inventory-item';

describe('InventoryState', () => {
  // Test fixture items
  const createItem = (name: string, amount: number, maxAmount = 64): InventoryItem => ({
    name,
    amount,
    maxAmount,
  });

  describe('constructor', () => {
    test('should create an empty inventory with default slot limit', () => {
      // Given I have no initialization parameters

      // When I create a new inventory
      const inventory = new InventoryState();

      // Then I should see that the addable itemset ratio is 1
      expect(inventory.addableItemsetRatio).toBe(1);
    });

    test('should allow calling toSlowts() on an empty inventory', () => {
      // Given I have an empty inventory
      const inventory = new InventoryState();

      // When I call toSlots()
      const slots = inventory.toSlots();

      // Then I should see an empty array
      expect(slots).toEqual([]);
    });

    test('should create an inventory with initial slots', () => {
      // Given I have some initial slots
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64],
        ['minecraft:dirt', 48, 64],
      ];

      // When I create an inventory with these slots
      const inventory = new InventoryState(16, initialSlots);

      // Then I should see those slots in the inventory
      const itemNames = inventory.toSlots().map(([name]) => name);
      expect(itemNames).toContain('minecraft:stone');
      expect(itemNames).toContain('minecraft:dirt');
    });

    test('should calculate the addable itemset ratio correctly', () => {
      // Given I have an inventory with some slots
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 10, 64],
        ['minecraft:dirt', 20, 64],
      ];

      // And I have some possible itemsets to add
      const item1 = createItem('minecraft:stone', 20);
      const item2 = createItem('minecraft:oak_planks', 30);
      const possibleItemsets = [
        [item1], // Can be added (stack with existing stone)
        [item2], // Can be added (new slot available)
      ];

      // When I create an inventory with these parameters
      const inventory = new InventoryState(3, initialSlots, possibleItemsets, 1);

      // Then I should see the correct addable itemset ratio
      expect(inventory.addableItemsetRatio).toBe(1); // All itemsets can be added
    });
  });

  describe('canAddItems', () => {
    test('should return true when there are enough empty slots', () => {
      // Given I have an inventory with empty slots
      const inventory = new InventoryState(5);

      // When I check if I can add some items
      const items = [
        createItem('minecraft:stone', 64),
        createItem('minecraft:dirt', 64),
      ];
      const result = inventory.canAddItems(items);

      // Then I should see that the items can be added
      expect(result).toBe(true);
    });

    test('should return false when there are not enough slots', () => {
      // Given I have an inventory with a small slot limit
      const inventory = new InventoryState(1);

      // When I check if I can add multiple items
      const items = [
        createItem('minecraft:stone', 64),
        createItem('minecraft:dirt', 64),
      ];
      const result = inventory.canAddItems(items);

      // Then I should see that the items cannot be added
      expect(result).toBe(false);
    });

    test('should return true when one item can be stacked with existing item', () => {
      // Given I have an inventory with one type of item
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64], // 32 capacity left
      ];
      const inventory = new InventoryState(1, initialSlots);

      // When I check if I can add one more of the same item
      const items = [
        createItem('minecraft:stone', 32), // Exactly fits in remaining capacity
      ];
      const result = inventory.canAddItems(items);

      // Then I should see that the item can be added
      expect(result).toBe(true);
    });

    test('should return true when items can be stacked efficiently', () => {
      // Given I have an inventory with some items
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64], // 32 capacity left
        ['minecraft:dirt', 48, 64], // 16 capacity left
      ];
      const inventory = new InventoryState(3, initialSlots);

      // When I check if I can add items that need stacking
      const items = [
        createItem('minecraft:stone', 32),
        createItem('minecraft:dirt', 16),
        createItem('minecraft:oak_planks', 64),
      ];
      const result = inventory.canAddItems(items);

      // Then I should see that the items can be added
      expect(result).toBe(true);
    });

    test('should return false when items would exceed stack limits', () => {
      // Given I have a nearly full inventory
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 10, 64], // 54 capacity left
        ['minecraft:dirt', 5, 64], // 59 capacity left
      ];
      const inventory = new InventoryState(2, initialSlots);

      // When I check if I can add items that exceed capacity
      const items = [
        createItem('minecraft:stone', 60), // More than remaining capacity
        createItem('minecraft:dirt', 64), // More than remaining capacity
      ];
      const result = inventory.canAddItems(items);

      // Then I should see that the items cannot be added
      expect(result).toBe(false);
    });
  });

  describe('addItems', () => {
    test('should add items to empty slots', () => {
      // Given I have an empty inventory
      const inventory = new InventoryState(5);

      // When I add items to the inventory
      const items = [
        createItem('minecraft:stone', 64),
        createItem('minecraft:dirt', 32),
      ];
      const newInventory = inventory.addItems(items, []);

      // Then I should see the items have been added
      const slots = newInventory.toSlots();
      expect(slots).toHaveLength(2);
      expect(slots).toContainEqual(['minecraft:stone', 64]);
      expect(slots).toContainEqual(['minecraft:dirt', 32]);
    });

    test('should stack items with existing ones', () => {
      // Given I have an inventory with some items
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64], // 32 capacity left
      ];
      const inventory = new InventoryState(3, initialSlots);

      // When I add more of the same item
      const items = [
        createItem('minecraft:stone', 20), // Should stack with existing stone
      ];
      const newInventory = inventory.addItems(items, []);

      // Then I should see the items have been stacked
      const slots = newInventory.toSlots();
      expect(slots).toHaveLength(1);
      expect(slots[0]).toEqual(['minecraft:stone', 52]); // 32 + 20 = 52
    });

    test('should create new stacks when items exceed capacity', () => {
      // Given I have an inventory with a partially filled slot
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64], // 32 capacity left
      ];
      const inventory = new InventoryState(3, initialSlots);

      // When I add more items than the remaining capacity
      const items = [
        createItem('minecraft:stone', 64), // More than capacity, should create new stack
      ];
      const newInventory = inventory.addItems(items, []);

      // Then I should see both the original and new stacks
      const slots = newInventory.toSlots();
      expect(slots).toHaveLength(2);
      expect(slots).toContainEqual(['minecraft:stone', 64]); // Original stack is now full
      expect(slots).toContainEqual(['minecraft:stone', 32]); // New stack with overflow
    });

    test('should throw error when trying to add items to a full inventory', () => {
      // Given I have a full inventory
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 0, 64], // Full slot
      ];
      const inventory = new InventoryState(1, initialSlots);

      // When I try to add items to the full inventory
      const items = [
        createItem('minecraft:dirt', 64), // No room for this
      ];

      // Then I should see an error is thrown
      expect(() => inventory.addItems(items, [])).toThrow(
        'Tried to add an item to a full inventory',
      );
    });
  });

  describe('clear', () => {
    test('should remove all items from inventory', () => {
      // Given I have an inventory with items
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64],
        ['minecraft:dirt', 48, 64],
      ];
      const inventory = new InventoryState(16, initialSlots);

      // When I clear the inventory
      const clearedInventory = inventory.clear();

      // Then I should see an empty inventory
      expect(clearedInventory.toSlots()).toEqual([]);
    });
  });

  describe('toSlots', () => {
    test('should convert internal representation to [name, count] pairs', () => {
      // Given I have an inventory with various items
      const initialSlots: [string, number, number][] = [
        ['minecraft:stone', 32, 64], // 32 capacity left = 32 count
        ['minecraft:dirt', 0, 64], // 0 capacity left = 64 count
        ['minecraft:oak_planks', 48, 64], // 48 capacity left = 16 count
      ];
      const inventory = new InventoryState(16, initialSlots);

      // When I convert to slots
      const slots = inventory.toSlots();

      // Then I should see the correct [name, count] pairs
      expect(slots).toEqual([
        ['minecraft:stone', 32],
        ['minecraft:dirt', 64],
        ['minecraft:oak_planks', 16],
      ]);
    });
  });
});
