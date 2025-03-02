import { cobblestoneNbt, logNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '♒': [logNbt({ axis: 'x' }), 'unplaced'],
  '♊': [logNbt({ axis: 'z' }), 'unplaced'],
  '✳️': [logNbt({ axis: 'y' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceAxis X', () => {
  placement({
    it: 'should be able to be placed against the turtle',
    // Given I have air under and behind the block I want to place
    layers: `
      ✖️✖️✖️

      ▶️♒✖️
    `,
  });

  placement({
    it: 'should be placeable if there is a block behind the target block',
    // Given I have a block under and behind the block I want to place
    layers: `
      ✖️🟨✖️

      ▶️♒🟨
    `,
  });

  placement({
    it: 'should not be placeable if there is no block behind the target block, but there is a block below',
    // Given I have a block under and no block behind the block I want to place
    layers: `
      ✖️🟨✖️

      ▶️♒✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable if it blocks placing another axis block in the future',
    layers: `
      ✖️✖️✖️✖️✖️

      🟨♒▶️♒✖️
    `,
    turtleIsOver: '♒',
    fail: true,
  });

  // Positive test case for the test above
  placement({
    it: 'should be placeable if it does not block placing another axis block in the future',
    layers: `
      ✖️✖️✖️✖️✖️

      🟨♒◀️♒✖️
    `,
    turtleIsOver: '♒',
  });

  placement({
    it: 'should not be placeable from the wrong axis Z',
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️♒✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable from the wrong axis Y',
    layers: `
      ✖️✖️✖️
      ✖️⏬✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️♒✖️
      ✖️✖️✖️
    `,
    fail: true,
  });
});

describe('BlockToPlaceAxis Z', () => {
  placement({
    it: 'should be able to be placed against the turtle',
    // Given I have air under and behind the block I want to place
    layers: `
      ✖️
      ✖️
      ✖️

      🔽
      ♊
      ✖️
    `,
  });

  placement({
    it: 'should be placeable if there is a block behind the target block',
    // Given I have a block under and behind the block I want to place
    layers: `
      ✖️
      🟨
      ✖️

      🔽
      ♊
      🟨
    `,
  });

  placement({
    it: 'should not be placeable if there is no block behind the target block, but there is a block below',
    // Given I have a block under and no block behind the block I want to place
    layers: `
      ✖️
      🟨
      ✖️

      🔽
      ♊
      ✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable if it blocks placing another axis block in the future',
    layers: `
      ✖️
      ✖️
      ✖️
      ✖️
      ✖️

      🟨
      ♊
      🔽
      ♊
      ✖️
    `,
    turtleIsOver: '♊',
    fail: true,
  });

  // Positive test case for the test above
  placement({
    it: 'should be placeable if it does not block placing another axis block in the future',
    layers: `
      ✖️
      ✖️
      ✖️
      ✖️
      ✖️

      🟨
      ♊
      🔼
      ♊
      ✖️
    `,
    turtleIsOver: '♊',
  });

  placement({
    it: 'should not be placeable from the wrong axis X',
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️♊✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable from the wrong axis Y',
    layers: `
      ✖️✖️✖️
      ✖️⏬✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ✖️♊✖️
      ✖️✖️✖️
    `,
    fail: true,
  });
});

describe('BlockToPlaceAxis Y', () => {
  placement({
    it: 'should be able to be placed against the turtle from below',
    layers: `
      ⏬

      ✳️
    `,
  });

  placement({
    it: 'should be able to be placed against the turtle from above',
    layers: `
      ✖️✳️

      ✳️⬆️
    `,
  });

  placement({
    it: 'should be placeable from below if there is a block above the target block',
    layers: `
      ⏬

      ✳️

      🟨
    `,
  });

  placement({
    it: 'should be placeable from the side if there is a block below the target block and no block behind',
    layers: `
      ✖️🟨✖️

      ▶️✳️✖️
    `,
  });

  placement({
    it: 'should be placeable from above if there is a block below the target block',
    layers: `
      ✖️🟨

      ✖️✳️

      ✖️⬆️
    `,
  });

  placement({
    it: 'should not be placeable if it blocks placing another axis block in the future',
    layers: `
      ✖️🟨

      ✖️✳️

      ✖️⏬

      ✖️✳️

      ✖️✖️
    `,
    turtleIsOver: '✳️',
    fail: true,
  });

  // Positive test case for the test above
  placement({
    it: 'should be placeable if it does not block placing another axis block in the future',
    layers: `
      ✖️🟨

      ✖️✳️

      ✖️⬆️

      ✖️✳️

      ✖️✖️
    `,
    turtleIsOver: '✳️',
  });

  placement({
    it: 'should not be placeable from the wrong axis X',
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️✖️✖️
      ▶️✳️✖️
      ✖️✖️✖️
    `,
    fail: true,
  });

  placement({
    it: 'should not be placeable from the wrong axis Z',
    layers: `
      ✖️✖️✖️
      ✖️✖️✖️
      ✖️✖️✖️

      ✖️🔽✖️
      ✖️✳️✖️
      ✖️✖️✖️
    `,
    fail: true,
  });
});
