import { Except, MergeExclusive, RequireOneOrNone } from 'type-fest';
import { Vector } from '../../components/vector';

type RawItemDefinition = {
  name?: string | [string, string]; // String or regex matcher and replacer
} & RequireOneOrNone<{
  stackSize: number;
  durability: number;
}> &
  MergeExclusive<
    {
      amount?: number;
    },
    {
      amount: string;
      amountMapping?: Record<string, number>;
    }
  >;

export type ItemDefinition = RawItemDefinition & {
  name: string; // The final name after mapping
};

type ToRawDataDrivenBlock<T extends DataDrivenBlock> = Except<T, 'item' | 'items'> &
  RequireOneOrNone<{
    item: RawItemDefinition;
    items: RawItemDefinition[];
  }>;

type DataDrivenBlockBase = {
  pos?: Vector;
  name: string;
  mightFailHitscan?: boolean;
} & RequireOneOrNone<{
  item: ItemDefinition;
  items: ItemDefinition[];
}>;

type DataDrivenBlockWithType<T extends string> = DataDrivenBlockBase & {
  type: T;
};

// Simple types without additional properties
export type DataDrivenBlockTodo = DataDrivenBlockWithType<'todo'>;
export type DataDrivenBlockIgnored = DataDrivenBlockWithType<'ignored'>;
export type DataDrivenBlockNormal = DataDrivenBlockWithType<'normal'>;
export type DataDrivenBlockSlab = DataDrivenBlockWithType<'slab'>;
export type DataDrivenBlockAxis = DataDrivenBlockWithType<'axis'>;
export type DataDrivenBlockBottomSupported = DataDrivenBlockWithType<'bottomSupported'>;
export type DataDrivenBlockBottomSupportedTwoTall =
  DataDrivenBlockWithType<'bottomSupportedTwoTall'>;
export type DataDrivenBlockTopSupported = DataDrivenBlockWithType<'topSupported'>;
export type DataDrivenBlockGroundTorch = DataDrivenBlockWithType<'groundTorch'>;
export type DataDrivenBlockHopper = DataDrivenBlockWithType<'hopper'>;
export type DataDrivenBlockPiston = DataDrivenBlockWithType<'piston'>;

// Types with additional properties
export type DataDrivenBlockStairlike = DataDrivenBlockWithType<'stairlike'> & {
  inverted?: boolean;
};

export type DataDrivenBlockFacing = DataDrivenBlockWithType<'facing'> & {
  inverted?: boolean;
};

export type DataDrivenBlockFacingHorizontal =
  DataDrivenBlockWithType<'facingHorizontal'> & {
    inverted?: boolean;
  };

export type DataDrivenBlockLiquid = DataDrivenBlockWithType<'liquid'> & {
  maxMissingSupportBlocks?: number;
};

export type DataDrivenBlockBottomSupportedFacing =
  DataDrivenBlockWithType<'bottomSupportedFacing'> & {
    inverted?: boolean;
  };

export type DataDrivenBlockWallTorch = DataDrivenBlockWithType<'wallTorch'> & {
  inverted?: boolean;
};

export type DataDrivenBlockGroundSign = DataDrivenBlockWithType<'groundSign'> & {
  inverted?: boolean;
};

export type DataDrivenBlockWallSign = DataDrivenBlockWithType<'wallSign'> & {
  inverted?: boolean;
};

export type DataDrivenBlockWallAttached = DataDrivenBlockWithType<'wallAttached'> & {
  inverted?: boolean;
};

export type DataDrivenBlockFaceFacing = DataDrivenBlockWithType<'faceFacing'> & {
  ceilingInverted?: boolean;
  floorInverted?: boolean;
  wallInverted?: boolean;
};

export type DataDrivenBlockDoor = DataDrivenBlockWithType<'door'> & {
  inverted?: boolean;
};

export type DataDrivenBlockFaceAttachedFacing =
  DataDrivenBlockWithType<'faceAttachedFacing'> & {
    wallInverted?: boolean;
  };

export type DataDrivenBlock =
  | DataDrivenBlockAxis
  | DataDrivenBlockBottomSupported
  | DataDrivenBlockBottomSupportedFacing
  | DataDrivenBlockBottomSupportedTwoTall
  | DataDrivenBlockDoor
  | DataDrivenBlockFaceAttachedFacing
  | DataDrivenBlockFaceFacing
  | DataDrivenBlockFacing
  | DataDrivenBlockFacingHorizontal
  | DataDrivenBlockGroundSign
  | DataDrivenBlockGroundTorch
  | DataDrivenBlockHopper
  | DataDrivenBlockIgnored
  | DataDrivenBlockLiquid
  | DataDrivenBlockNormal
  | DataDrivenBlockPiston
  | DataDrivenBlockSlab
  | DataDrivenBlockStairlike
  | DataDrivenBlockTodo
  | DataDrivenBlockTopSupported
  | DataDrivenBlockWallAttached
  | DataDrivenBlockWallSign
  | DataDrivenBlockWallTorch;

export type RawDataDrivenBlock = ToRawDataDrivenBlock<DataDrivenBlock>;
