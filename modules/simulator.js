const PITY_MAX = 90;
const BASE_RATE = 0.006;
const RATE_INCREMENT = 0.06;

const RATES = new Float64Array(PITY_MAX);

for (let p = 0; p < PITY_MAX; p++) {
  RATES[p] = Math.min(1, BASE_RATE + RATE_INCREMENT * Math.max(0, p - 72));
}

const calculateProbabilities = (maxPulls, target, { pity = 0, guaranteed = false } = {}) => {
  if (
    !Number.isSafeInteger(maxPulls) ||
    !Number.isSafeInteger(target) ||
    !Number.isInteger(pity) ||
    maxPulls < 0 ||
    target < 0 ||
    pity < 0 ||
    pity >= PITY_MAX ||
    typeof guaranteed !== "boolean"
  ) {
    throw new RangeError("Invalid arguments");
  }

  const probabilities = new Float64Array(maxPulls + 1);
  probabilities[0] = target === 0 ? 1 : 0;

  if (target === 0) return probabilities.slice(0, 1);

  if (target > maxPulls) return probabilities;

  const guaranteedPulls = PITY_MAX - pity + (guaranteed ? 0 : PITY_MAX) + (target - 1) * PITY_MAX * 2;

  const limit = Math.min(maxPulls, guaranteedPulls);

  const size = target * 2 * PITY_MAX;

  let dp = new Float64Array(size);
  let next = new Float64Array(size);

  dp[Number(guaranteed) * PITY_MAX + pity] = 1;

  let success = 0;

  for (let n = 0; n < limit; n++) {
    next.fill(0);

    const maxCount = Math.min(target - 1, n);

    for (let k = 0; k <= maxCount; k++) {
      for (let g = 0; g <= 1; g++) {
        const base = (k * 2 + g) * PITY_MAX;

        let featuredMass = 0;
        let lostMass = 0;

        for (let p = 0; p < PITY_MAX; p++) {
          const current = dp[base + p];

          if (current === 0) continue;

          const rate = RATES[p];

          if (p < PITY_MAX - 1) {
            next[base + p + 1] += current * (1 - rate);
          }

          featuredMass += current * rate * (g === 1 ? 1 : 0.5);

          if (g === 0) {
            lostMass += current * rate * 0.5;
          }
        }

        if (featuredMass > 0) {
          if (k + 1 === target) {
            success += featuredMass;
          } else {
            next[(k + 1) * 2 * PITY_MAX] += featuredMass;
          }
        }

        if (lostMass > 0) {
          next[base + PITY_MAX] += lostMass;
        }
      }
    }

    [dp, next] = [next, dp];

    probabilities[n + 1] = success;

    if (success >= 1 - Number.EPSILON) {
      probabilities[n + 1] = 1;
      return probabilities.slice(0, n + 2);
    }
  }

  if (limit === guaranteedPulls) {
    probabilities[guaranteedPulls] = 1;
    return probabilities.slice(0, guaranteedPulls + 1);
  }

  return probabilities.slice(0, limit + 1);
};

const simulator = {
  calculateProbabilities,
};

export default simulator;
