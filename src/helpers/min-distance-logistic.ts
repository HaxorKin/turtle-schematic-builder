const minDistanceLogisticEpsilon = 1e-3;
const minDistanceLogisticNegK = -minDistanceLogisticEpsilon;

export function minDistanceLogistic(x: number) {
  return 2 / (1 + Math.exp(minDistanceLogisticNegK * x)) - 1;
}
