import { cobblestoneNbt, ladderNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  // Ladders have inverted facing directions
  '👇': [ladderNbt({ facing: 'north' }), 'unplaced'],
  '👈': [ladderNbt({ facing: 'east' }), 'unplaced'],
  '👆': [ladderNbt({ facing: 'south' }), 'unplaced'],
  '👉': [ladderNbt({ facing: 'west' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceWallAttached', () => {
  placement({
    it: 'should be placeable directly forwards',
    layers: `
      ▶️👉🟨
    `,
  });

  placement({
    it: 'should be placeable left',
    // Given I have a block to the left
    // And no block to any other side
    layers: `
      ✖️🟨✖️
      ▶️👆✖️
      ✖️✖️✖️
    `,
  });

  // Negative test case for the test above
  placement({
    it: 'should not be placeable left if there is a block in front',
    // Given I have a block to the left
    // And a block in front
    layers: `
      ✖️🟨✖️
      ▶️👆🟨
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable right',
    // Given I have a block to the right
    // And no block to any other side
    layers: `
      ✖️✖️✖️
      ▶️👇✖️
      ✖️🟨✖️
    `,
  });

  // Negative test case for the test above
  placement({
    it: 'should not be placeable right if there is a block in front',
    // Given I have a block to the right
    // And a block in front
    layers: `
      ✖️✖️✖️
      ▶️👇🟨
      ✖️🟨✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable from below',
    layers: `
      ⏩✖️

      👉🟨
    `,
  });

  placement({
    it: 'should be placeable from above',
    layers: `
      ✖️👉🟨

      ✖️➡️✖️
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
    it: 'should not be placeable left if there is no block to the left',
    layers: `
      ✖️🟧✖️
      ▶️👆✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable left if there is no block forwards yet',
    layers: `
      ✖️🟨✖️
      ▶️👆🟧
      ✖️✖️✖️
    `,
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
