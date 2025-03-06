import { cobblestoneNbt, torchNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '☀️': [torchNbt, 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceGroundTorch', () => {
  placement({
    it: 'should be able to be placed on a solid block',
    // Given I have a solid block under the torch I want to place
    // And no block behind the torch
    layers: `
      ✖️🟨✖️

      ▶️☀️✖️
    `,
  });

  placement({
    it: 'should not be placeable without a supporting block below',
    // Given there is no block under the torch I want to place
    layers: `
      ✖️✖️✖️

      ▶️☀️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable from the side if there is a block behind the torch',
    // Given there is a block behind the torch I want to place
    // And the turtle is on the side of the torch
    layers: `
      ✖️🟨✖️

      ▶️☀️🟨
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable in a hole from above',
    layers: `
      ✖️✖️✖️✖️
      ✖️✖️🟨✖️
      ✖️✖️✖️✖️

      ✖️✖️🟨✖️
      ✖️🟨☀️🟨
      ✖️✖️🟨✖️

      ✖️✖️✖️✖️
      ✖️✖️⬆️✖️
      ✖️✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable if there is a block beside but not behind',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️

      ✖️🟨✖️
      ▶️☀️✖️
    `,
  });

  placement({
    it: 'should not allow placing if the block below is unplaced',
    // Given the block below the torch is not yet placed
    layers: `
      ✖️🟧✖️

      ▶️☀️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should allow placing the supporting block below first',
    // Given I am at an unplaced block that will support the torch
    layers: `
      ▶️🟧✖️

      ✖️☀️✖️
    `,
  });

  placement({
    it: 'should not allow placing a block that would make it unreachable',
    // Given I am at a position where placing a block would make the torch unreachable
    layers: `
      ⏬🟧✖️

      🟧☀️✖️
    `,
    fail: true,
  });
});
