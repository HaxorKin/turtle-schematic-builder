import { cobblestoneNbt, fenceGateNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
  '👆': [fenceGateNbt({ facing: 'north' }), 'unplaced'],
  '👉': [fenceGateNbt({ facing: 'east' }), 'unplaced'],
  '👇': [fenceGateNbt({ facing: 'south' }), 'unplaced'],
  '👈': [fenceGateNbt({ facing: 'west' }), 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceFacingHorizontal', () => {
  placement({
    it: 'should be placeable against the turtle',
    // Given there is no block behind or below the target block
    layers: `
      ✖️✖️✖️

      ▶️👈✖️
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
    it: 'should be placeable against the block below the target block',
    // Given there is a block below the target block
    layers: `
			✖️🟨✖️

			▶️👉✖️
		`,
  });

  placement({
    it: 'should be placeable if the turtle is below the target block',
    // Given the turtle is below the target block
    layers: `
			⏬

			👇
		`,
  });

  placement({
    it: 'should be placeable if the turtle is above the target block',
    // Given the turtle is above the target block
    layers: `
			✖️👆

			✖️⬆️
		`,
  });
});
