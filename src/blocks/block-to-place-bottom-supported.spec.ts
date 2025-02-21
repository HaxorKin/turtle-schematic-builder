import { cobblestoneNbt, pressurePlateNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '💠': [pressurePlateNbt, 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceBottomSupported', () => {
  placement({
    it: 'should be able to be placed',
    // Given I have a block under the bottom-supported block I want to place
    layers: `
      ✖️🟨

      ▶️💠
    `,
  });

  placement({
    it: 'should not be placeable if there is no block under the bottom-supported block',
    // Given I have an unplaced block under the bottom-supported block I want to place
    layers: `
      ✖️🟧

      ▶️💠
    `,
    fail: true,
  });

  placement({
    it: 'should not allow placing a block that makes it unreachable from all sides but the bottom',
    // Given I am at an unplaced block that makes the bottom-supported block unreachable from all sides but the bottom
    layers: `
      ⏬🟧

      🟧💠
    `,
    fail: true,
  });

  // Positive test case for the above negative test case
  placement({
    it: 'should allow placing the block under it',
    // Given I am at an unplaced block under the bottom-supported block
    layers: `
      ▶️🟧

      🟧💠
    `,
  });
});
