import { cobblestoneNbt } from '../helpers/testing/mock-nbts';
import { createPlacementTest, PlacementTestPalette } from '../helpers/testing/testing';

const palette: PlacementTestPalette = {
  '🟨': [cobblestoneNbt, 'placed'],
  '🟧': [cobblestoneNbt, 'unplaced'],
};

const placement = createPlacementTest(palette);

describe('BlockToPlaceNormal', () => {
  placement({
    it: 'should be able to be placed',
    // Given I have a block to place in front of the turtle
    layers: `
      ▶️🟧
    `,
  });

  placement({
    it: 'should not be placeable if the turtle cannot reach the block',
    // Given I have a block to place one block in front of the turtle
    layers: `
      ▶️✖️🟧
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable above the turtle',
    // Given I have a block to place above the turtle
    layers: `
      ⏬

      🟧
    `,
  });

  placement({
    it: 'should be placeable below the turtle',
    // Given I have a block to place below the turtle
    layers: `
      ✖️🟧

      ✖️⬇️
    `,
  });

  placement({
    it: 'should not be placeable if it blocks the path to origin',
    // Given I have a block to place that blocks the path to origin
    layers: `
      ✖️🟧◀️
      🟨✖️✖️
    `,
    fail: true,
    origin: [0, 0, 0],
  });

  placement({
    it: 'should not be placeable if it boxes the turtle in',
    // Given I have a block to place that boxes the turtle in
    layers: `
      ✖️🟧✖️
      🟨🔼🟨
      ✖️🟨✖️
    `,
    fail: true,
  });

  placement({
    it: 'should be placeable if it makes air blocks unreachable',
    // Given I have a block to place that makes air blocks unreachable
    layers: `
      ▶️🟧✖️
      🟨✖️🟨
      ✖️🟨✖️
    `,
  });

  placement({
    it: 'should not be placeable if it makes unplaced blocks unreachable',
    // Given I have a block to place that makes an unplaced block unreachable
    layers: `
      ▶️🟧
      🟨🟧
    `,
    fail: true,
  });
});
