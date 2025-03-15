import { cobblestoneNbt, repeaterNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  // Repeaters have inverted facing directions
  '👇': [repeaterNbt({ facing: 'north' }), 'unplaced'],
  '👈': [repeaterNbt({ facing: 'east' }), 'unplaced'],
  '👆': [repeaterNbt({ facing: 'south' }), 'unplaced'],
  '👉': [repeaterNbt({ facing: 'west' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceRepeaterlike', () => {
  placement({
    it: 'should be placeable from the west',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️👉✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable from the south',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👆✖️
      ✖️🔼✖️
    `,
  });

  placement({
    it: 'should be placeable from the east',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👈◀️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable from the north',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️👇✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable from the top',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👆✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️⬆️✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should not be placeable if there is no block under the bottom-supported block',
    // Given I have an unplaced block under the bottom-supported block I want to place
    layers: `
      ✖️🟧✖️

      ▶️👉✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable with unknown blocks on the sides',
    // Given I have a block under the bottom-supported block I want to place
    layers: `
      ✖️🟨

      ▶️👉
    `,
  });

  placement({
    it: 'should be placeable with a block behind',
    layers: `
      ✖️🟨✖️

      ▶️👉🟨
    `,
  });

  placement({
    it: 'should not allow placing a block that makes it unreachable from all sides but the bottom',
    // Given I am at an unplaced block that makes the bottom-supported block unreachable from all sides but the bottom
    layers: `
      ⏬🟧

      🟧👉
    `,
    fail: true,
  });

  // Positive test case for the above negative test case
  placement({
    it: 'should allow placing the block under it',
    // Given I am at an unplaced block under the bottom-supported block
    layers: `
      ▶️🟧

      🟧👉
    `,
  });
});
