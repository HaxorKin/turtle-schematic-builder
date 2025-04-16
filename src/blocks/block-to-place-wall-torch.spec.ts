import { cobblestoneNbt, wallTorchNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  // Wall-torches have inverted facing directions
  '👇': [wallTorchNbt({ facing: 'north' }), 'unplaced'],
  '👈': [wallTorchNbt({ facing: 'east' }), 'unplaced'],
  '👆': [wallTorchNbt({ facing: 'south' }), 'unplaced'],
  '👉': [wallTorchNbt({ facing: 'west' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceWallTorch', () => {
  placement({
    it: 'should be placeable directly forwards',
    layers: `
      ▶️👉🟨
    `,
  });

  placement({
    it: 'should be placeable left',
    // Given I have a block to the left
    // And no block to any other side or below
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️🟨✖️
      ▶️👆✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable right',
    // Given I have a block to the right
    // And no block to any other side or below
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️👇✖️
      ✖️🟨✖️
    `,
  });

  placement({
    it: 'should be placeable from below',
    // Regardless of the block above
    layers: `
      ⏩✖️

      👉🟨
    `,
  });

  placement({
    it: 'should be placeable from above',
    // Given there is no block below
    layers: `
      ✖️✖️✖️

      ✖️👉🟨

      ✖️➡️✖️
    `,
  });

  placement({
    it: 'should be placeable from below even if not facing the block',
    // Given the only wall it can attach to is the correct one
    // And there is a block above
    layers: `
      ✖️✖️✖️
      ✖️⏩✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👇🟧
      ✖️🟨✖️

      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable from above even if not facing the block',
    // Given the only wall it can attach to is the correct one
    // And there is no block below
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👇🟧
      ✖️🟨✖️

      ✖️✖️✖️
      ✖️➡️✖️
      ✖️✖️✖️
    `,
  });

  // Negative test case for the test above
  placement({
    it: 'should not be placeable from above if there are blocks on the sides',
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👇🟨
      ✖️🟨✖️

      ✖️✖️✖️
      ✖️➡️✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable forwards if there is no block in front',
    layers: `
      ▶️👉🟧
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable against the turtle',
    layers: `
      ✖️▶️👈✖️
      ✖️✖️✖️✖️
    `,
    turtleIsOver: '🟧',
    fail: true,
  });

  placement({
    it: 'should not allow placing a block that makes the block unreachable',
    layers: `
      ✖️✖️✖️✖️
      🔽🟨🟨✖️
      🟧✖️👉🟧
    `,
    fail: true,
  });

  placement({
    it: 'should not allow placing a block below that makes the block unplaceable',
    // It would force a ground torch
    layers: `
      ✖️✖️✖️✖️
      ✖️▶️🟧✖️
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️🟨👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️✖️✖️✖️
      ✖️✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should allow placing a block that makes the block unreachable from above if it is still reachable from below',
    layers: `
      ✖️✖️✖️✖️
      ✖️✖️🟧✖️
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️🟨👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️▶️🟧✖️
      ✖️✖️✖️✖️
    `,
  });

  placement({
    it: 'should not allow placing a block in front that makes the block unplaceable',
    layers: `
      ✖️✖️✖️✖️
      ✖️✖️🟨✖️
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ▶️🟧👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️✖️✖️✖️
      ✖️✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should allow placing a block in front that makes the block unreachable from above if it is still reachable from below',
    layers: `
      ✖️✖️✖️✖️
      ✖️✖️🟧✖️
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ▶️🟧👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️✖️🟧✖️
      ✖️✖️✖️✖️
    `,
  });
});
