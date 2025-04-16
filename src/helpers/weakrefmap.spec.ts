import { jest } from '@jest/globals';
import { WeakrefMap } from './weakrefmap';

describe('WeakrefMap', () => {
  test('should a value', () => {
    // Given I have a new WeakrefMap
    const map = new WeakrefMap<string, object>();
    const value = { test: 'value' };

    // When I set a key-value pair
    map.set('key', value);

    // Then I should see that the size is 1
    expect(map.size).toBe(1);
  });

  test('should get a value', () => {
    // Given I have a WeakrefMap
    const map = new WeakrefMap<string, object>();
    const value = { test: 'value' };
    // And there is a value in it
    map.set('key', value);

    // When I get the value by the key
    const retrievedValue = map.get('key');

    // Then I should see the correct value
    expect(retrievedValue).toBe(value);
  });

  test('should report correct size', () => {
    // Given I have a WeakrefMap with some entries
    const map = new WeakrefMap<string, object>();
    map.set('key1', { id: 1 });
    map.set('key2', { id: 2 });

    // When I check the size
    const size = map.size;

    // Then I should see it matches the number of entries
    expect(size).toBe(2);
  });

  test('should update existing value', () => {
    // Given I have a WeakrefMap with an existing entry
    const map = new WeakrefMap<string, object>();
    const initialValue = { id: 1 };
    const newValue = { id: 2 };
    map.set('key', initialValue);

    // When I set a new value with the same key
    map.set('key', newValue);

    // Then the key should point to the new value
    expect(map.get('key')).toBe(newValue);
    // And the size should still be 1
    expect(map.size).toBe(1);
  });

  test('should report if a key exists with has()', () => {
    // Given I have a WeakrefMap with an entry
    const map = new WeakrefMap<string, object>();
    map.set('existingKey', { id: 1 });

    // When I check if the key exists
    const existingKeyResult = map.has('existingKey');

    // Then it should return true
    expect(existingKeyResult).toBe(true);
  });

  test('should report if a key exists with has()', () => {
    // Given I have a WeakrefMap with an entry
    const map = new WeakrefMap<string, object>();
    map.set('existingKey', { id: 1 });

    // When I check if a non-existing key exists
    const nonExistingKeyResult = map.has('nonExistingKey');

    // Then it should return false
    expect(nonExistingKeyResult).toBe(false);
  });

  test('should delete an entry', () => {
    // Given I have a WeakrefMap with an entry
    const map = new WeakrefMap<string, object>();
    map.set('key', { id: 1 });

    // When I delete the entry
    const result = map.delete('key');

    // Then I should see the operation was successful
    expect(result).toBe(true);
    // And the key should no longer exist
    expect(map.has('key')).toBe(false);
    // And the size should be 0
    expect(map.size).toBe(0);
  });

  test('should return false when deleting non-existent key', () => {
    // Given I have a WeakrefMap
    const map = new WeakrefMap<string, object>();

    // When I try to delete a non-existent key
    const result = map.delete('nonExistentKey');

    // Then I should see the operation failed
    expect(result).toBe(false);
  });

  test('should clear all entries', () => {
    // Given I have a WeakrefMap with multiple entries
    const map = new WeakrefMap<string, object>();
    map.set('key1', { id: 1 });
    map.set('key2', { id: 2 });

    // When I clear the map
    map.clear();

    // Then I should see the map is empty
    expect(map.size).toBe(0);
    expect(map.has('key1')).toBe(false);
    expect(map.has('key2')).toBe(false);
  });

  test('should iterate through entries', () => {
    // Given I have a WeakrefMap with multiple entries
    const map = new WeakrefMap<string, object>();
    const value1 = { id: 1 };
    const value2 = { id: 2 };
    map.set('key1', value1);
    map.set('key2', value2);

    // When I iterate through the entries
    const entries = [...map.entries()];

    // Then I should receive all entries in order
    expect(entries.length).toBe(2);
    expect(entries[0]).toEqual(['key1', value1]);
    expect(entries[1]).toEqual(['key2', value2]);
  });

  test('should iterate through keys', () => {
    // Given I have a WeakrefMap with multiple entries
    const map = new WeakrefMap<string, object>();
    map.set('key1', { id: 1 });
    map.set('key2', { id: 2 });

    // When I iterate through the keys
    const keys = [...map.keys()];

    // Then I should receive all keys in order
    expect(keys.length).toBe(2);
    expect(keys[0]).toBe('key1');
    expect(keys[1]).toBe('key2');
  });

  test('should iterate through values', () => {
    // Given I have a WeakrefMap with multiple entries
    const map = new WeakrefMap<string, object>();
    const value1 = { id: 1 };
    const value2 = { id: 2 };
    map.set('key1', value1);
    map.set('key2', value2);

    // When I collect the values
    const values = [...map.values()];

    // Then I should see all values in order
    expect(values.length).toBe(2);
    expect(values[0]).toBe(value1);
    expect(values[1]).toBe(value2);
  });

  test('should execute forEach callback for each entry', () => {
    // Given I have a WeakrefMap with multiple entries
    const map = new WeakrefMap<string, object>();
    const value1 = { id: 1 };
    const value2 = { id: 2 };
    map.set('key1', value1);
    map.set('key2', value2);
    const forEachFn = jest.fn();

    // When I call forEach
    map.forEach(forEachFn);

    // Then I should see the callback was called for each entry
    expect(forEachFn).toHaveBeenCalledTimes(2);
    expect(forEachFn).toHaveBeenCalledWith(value1, 'key1', map);
    expect(forEachFn).toHaveBeenCalledWith(value2, 'key2', map);
  });
});
