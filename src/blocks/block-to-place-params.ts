export type BlockToPlaceLiquidParams = {
  type: 'liquid';
  maxMissingSupportBlocks: number;
};

//TODO: Remove once there is more than one type of BlockToPlaceParams
export type BlockToPlaceTestParams = {
  type: 'test';
  test: string;
};

export type BlockToPlaceParams = BlockToPlaceLiquidParams | BlockToPlaceTestParams;
