import { cobblestoneNbt, observerNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '👆': [observerNbt({ facing: 'north' }), 'unplaced'],
  '👉': [observerNbt({ facing: 'east' }), 'unplaced'],
  '👇': [observerNbt({ facing: 'south' }), 'unplaced'],
  '👈': [observerNbt({ facing: 'west' }), 'unplaced'],
  '🖐️': [observerNbt({ facing: 'up' }), 'unplaced'],
  '🤚': [observerNbt({ facing: 'down' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceFacing', () => {
  placement({
    it: 'should be placeable against the turtle from west',
    // Given there is no block behind or below the target block
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️👈✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the turtle from south',
    // Given there is no block behind or below the target block
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👇✖️
      ✖️🔼✖️
    `,
  });

  placement({
    it: 'should be placeable against the turtle from east',
    // Given there is no block behind or below the target block
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️👉◀️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the turtle from north',
    // Given there is no block behind or below the target block
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️👆✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should not be placeable against the turtle if there is a block behind',
    // Given there is a block behind the target block
    layers: `
      ✖️✖️✖️

      ▶️👈🟨
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable against the turtle if there is a block below',
    // Given there is a block below the target block
    layers: `
      ✖️🟨✖️

      ▶️👈✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable against the block in front of the target block',
    // Given there is a block in front of the target block
    layers: `
      ✖️✖️✖️

      ▶️👉🟨
    `,
  });

  placement({
    it: 'should be placeable against the block below the target block from west',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️🤚✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the block below the target block from south',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️🤚✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the block below the target block from east',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️🤚◀️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the block below the target block from north',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️🤚✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable against the block below the target block from above',
    layers: `
      ✖️✖️✖️
      ✖️🟨✖️
      ✖️✖️✖️
    
      ✖️✖️✖️
      ✖️🤚✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️⬆️✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should be placeable if the turtle is below the target block',
    // Given the turtle is below the target block
    layers: `
      ⏬

      🤚

      ✖️
    `,
  });

  placement({
    it: 'should be placeable if the turtle is above the target block',
    // Given the turtle is above the target block
    layers: `
      ✖️✖️

      ✖️🖐️

      ✖️⬆️
    `,
  });

  placement({
    it: 'should not be placeable if it blocks placing another facing block in the future',
    layers: `
      ✖️✖️✖️✖️

      ✖️👉◀️✖️
    `,
    fail: true,
    turtleIsOver: '👉',
  });

  // Positive test case for the test above
  placement({
    it: "should be placeable if it doesn't block placing another facing block in the future",
    layers: `
      ✖️✖️✖️✖️

      ✖️👉👉◀️
    `,
  });

  placement({
    it: 'should not allow placing a block behind if it makes the block unplaceable',
    layers: `
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🤚🟧
      ✖️✖️🔼

      ✖️🟨✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  // Positive test case for the test above
  placement({
    it: 'should allow placing a block behind if it does not make the block unplaceable',
    // Given it can still be placed from the bottom
    layers: `
      ✖️🟨✖️
      ✖️✖️✖️

      ✖️🤚🟧
      ✖️✖️🔼

      ✖️✖️✖️
      ✖️✖️✖️
    `,
  });

  placement({
    it: 'should not allow placing a block above if it makes the down facing block unplaceable',
    layers: `
      ✖️✖️

      ✖️🤚

      ▶️🟧
    `,
    fail: true,
  });
});
