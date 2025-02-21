import { cobblestoneNbt, doorNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '🟫': [doorNbt({ facing: 'east' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceDoor', () => {
  placement({
    it: 'should be able to be placed',
    // Given I have a block under the door I want to place
    layers: `
      ✖️🟨

      ▶️🟫

      ✖️✖️
    `,
  });

  placement({
    it: 'should not be placeable if there is no block under the door',
    // Given I have an unplaced block under the door I want to place
    layers: `
      ✖️🟧

      ▶️🟫

      ✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable from the wrong side',
    // Given I am on the wrong side of the door I want to place
    layers: `
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🟫◀️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: "should not allow placing a normal block if it makes the door's correct side unreachable",
    // Given I am in front of an unplaced normal block
    // And there is space above the bottom half of the door for the top half
    layers: `
      ✖️✖️🟨✖️✖️
      ✖️🟨✖️🟨✖️
      ✖️✖️🟨✖️✖️
      ✖️✖️✖️✖️✖️

      ✖️✖️🟨✖️✖️
      ▶️🟧✖️🟫✖️
      ✖️✖️🟨✖️✖️
      ✖️✖️✖️✖️✖️

      ✖️✖️🟨✖️✖️
      ✖️🟨✖️✖️✖️
      ✖️✖️🟨✖️✖️
      ✖️✖️✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not allow placing a normal block if it blocks the correct side of the door',
    // Given I am in front of an unplaced normal block
    layers: `
      ✖️✖️🟨
      ✖️✖️✖️

      ▶️🟧🟫
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️✖️✖️
    `,
    fail: true,
  });
});
