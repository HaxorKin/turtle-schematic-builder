import { ArkErrors } from 'arktype';
import { NBT } from 'prismarine-nbt';
import { PaletteBlock, schematicNbt } from './nbt.validator';
import { Vector } from './vector';

export type PaddingOptions = {
  north?: boolean;
  east?: boolean;
  south?: boolean;
  west?: boolean;
  up?: boolean;
  down?: boolean;
};

export class Schematic {
  private readonly blocks: number[][][];
  private readonly palette: PaletteBlock[];
  public readonly size: Vector;

  constructor(
    nbt: NBT,
    private readonly paddingOptions: PaddingOptions = {},
  ) {
    const validatedNbt = schematicNbt(nbt);
    if (validatedNbt instanceof ArkErrors) {
      throw validatedNbt;
    }

    this.palette = validatedNbt.value.palette.value.value;
    const originalSize = validatedNbt.value.size.value.value;
    let size: Vector = [...originalSize] as Vector;

    // Adjust size based on paddingOptions using ++
    if (paddingOptions.north) size[2]++;
    if (paddingOptions.east) size[0]++;
    if (paddingOptions.south) size[2]++;
    if (paddingOptions.west) size[0]++;
    if (paddingOptions.up) size[1]++;
    if (paddingOptions.down) size[1]++;

    this.size = size;

    // Initialize blocks array with the new size
    let airIndex = this.palette.findIndex(
      (block) => block.Name.value === 'minecraft:air',
    );
    if (airIndex === -1) {
      this.palette.push({ Name: { type: 'string', value: 'minecraft:air' } });
      airIndex = this.palette.length - 1;
    }

    this.blocks = Array.from({ length: size[0] }, () =>
      Array.from({ length: size[1] }, () =>
        Array.from({ length: size[2] }, () => airIndex),
      ),
    );

    // Populate existing blocks
    for (const block of validatedNbt.value.blocks.value.value) {
      let [x, y, z] = block.pos.value.value;

      // Adjust positions based on paddingOptions using ++
      if (paddingOptions.north) z++;
      if (paddingOptions.west) x++;
      if (paddingOptions.down) y++;

      if (x >= 0 && x < size[0] && y >= 0 && y < size[1] && z >= 0 && z < size[2]) {
        this.blocks[x][y][z] = block.state.value;
      }
    }
  }

  at(x: number, y: number, z: number): PaletteBlock {
    const paletteIndex = this.blocks[x][y][z];
    return this.palette[paletteIndex];
  }

  padVector(vector: Vector): Vector {
    const { paddingOptions } = this;
    let [x, y, z] = vector;
    if (paddingOptions.west) x++;
    if (paddingOptions.down) y++;
    if (paddingOptions.north) z++;
    return [x, y, z];
  }
}
