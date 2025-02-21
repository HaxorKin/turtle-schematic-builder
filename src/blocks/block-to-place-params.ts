export interface BlockToPlaceLiquidParams {
  type: 'liquid';
  maxMissingSupportBlocks: number;
}

//TODO: Remove once there is more than one type of BlockToPlaceParams
export interface BlockToPlaceTestParams {
  type: 'test';
  test: string;
}

export type BlockToPlaceParams = BlockToPlaceLiquidParams | BlockToPlaceTestParams;
