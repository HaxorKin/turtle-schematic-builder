import { cobblestoneNbt, wallSignNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  // Wall-signs have inverted facing directions
  '👇': [wallSignNbt({ facing: 'north' }), 'unplaced'],
  '👈': [wallSignNbt({ facing: 'east' }), 'unplaced'],
  '👆': [wallSignNbt({ facing: 'south' }), 'unplaced'],
  '👉': [wallSignNbt({ facing: 'west' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceWallSign', () => {
  placement({
    it: 'should be placeable directly forwards',
    layers: `
      ▶️👉🟨
    `,
  });

  placement({
    it: 'cannot be placed left',
    // It would attach to the turtle
    layers: `
      ✖️🟨✖️
      ▶️👆✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'cannot be placed right',
    // It would attach to the turtle
    layers: `
      ✖️✖️✖️
      ▶️👇✖️
      ✖️🟨✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable from below',
    // Given there is a block above
    layers: `
      ⏩✖️

      👉🟨

      🟨✖️
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
    it: 'should not allow placing a block that makes the block unplaceable',
    // In other cases the block could still be reachable from the side, but not in this case
    layers: `
      ✖️✖️✖️✖️
      ✖️🟨👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️▶️🟧✖️
      ✖️✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should allow placing a block that makes the block unreachable from above if it is still reachable from below',
    layers: `
      ✖️✖️✖️✖️
      ✖️✖️✖️✖️
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️🟨👉🟨
      ✖️✖️✖️✖️

      ✖️✖️✖️✖️
      ✖️▶️🟧✖️
      ✖️✖️✖️✖️
    `,
  });
});
