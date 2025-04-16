import { DataDrivenBlock } from './data-driven-block.type';
import { parseDataDrivenBlocks } from './data-parser';

// Natural category
import decorativeRock from '../data/minecraft/natural/decorative-rock.json';
import faunaAndAlgae from '../data/minecraft/natural/fauna-and-algae.json';
import faunaRelated from '../data/minecraft/natural/fauna-related.json';
import fluidRelated from '../data/minecraft/natural/fluid-related.json';
import fungus from '../data/minecraft/natural/fungus.json';
import nonPhysical from '../data/minecraft/natural/non-physical.json';
import oreAndMineral from '../data/minecraft/natural/ore-and-mineral.json';
import plant from '../data/minecraft/natural/plant.json';
import sculk from '../data/minecraft/natural/sculk.json';
import soil from '../data/minecraft/natural/soil.json';

// Structural category
import decorativeMinerals from '../data/minecraft/structural/decorative-minerals.json';
import end from '../data/minecraft/structural/end.json';
import nether from '../data/minecraft/structural/nether.json';
import overworld from '../data/minecraft/structural/overworld.json';
import stoneBased from '../data/minecraft/structural/stone-based.json';
import structuralMinerals from '../data/minecraft/structural/structural-minerals.json';
import woodAndHyphae from '../data/minecraft/structural/wood-and-hyphae.json';

// Ornamental category
import decorative from '../data/minecraft/ornamental/decorative.json';
import dyeableAndDyed from '../data/minecraft/ornamental/dyeable-and-dyed.json';
import lighting from '../data/minecraft/ornamental/lighting.json';
import partialBlocks from '../data/minecraft/ornamental/partial-blocks.json';

// Utility category
import interactable from '../data/minecraft/utility/interactable.json';
import redstoneAndMechanical from '../data/minecraft/utility/redstone-and-mechanical.json';
import utilizable from '../data/minecraft/utility/utilizable.json';

const blocks = [
  // Natural
  decorativeRock,
  faunaAndAlgae,
  faunaRelated,
  fluidRelated,
  fungus,
  nonPhysical,
  oreAndMineral,
  plant,
  sculk,
  soil,

  // Structural
  decorativeMinerals,
  end,
  nether,
  overworld,
  stoneBased,
  structuralMinerals,
  woodAndHyphae,

  // Ornamental
  decorative,
  dyeableAndDyed,
  lighting,
  partialBlocks,

  // Utility
  interactable,
  redstoneAndMechanical,
  utilizable,
].flatMap(({ blocks }) => blocks) as DataDrivenBlock[];

export const { dataDrivenBlocks, positionOverrides } = parseDataDrivenBlocks(blocks);
