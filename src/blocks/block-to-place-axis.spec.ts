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
});

describe('BlockToPlaceAxis Y', () => {
  placement({
    it: 'should be able to be placed against the turtle',
    layers: `
      ⏬

      ✳️
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
});
