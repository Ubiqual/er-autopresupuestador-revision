export function calculateRestTimePrice(
  restTime: number,
  busSelection: {
    [key: string]: number;
  },
  result: {
    numberOfPeople: number;
    finalPricePerKm: number;
    finalPricePerMinute: number;
    seasonAdjustment: number;
    busTypeAdjustment: number;
    busyTimeAdjustment: number;
    nightTimeAdjustment: number;
  }[]
) {
  let restTimePrice = 0;

  if (restTime > 0) {
    for (const [busType, quantity] of Object.entries(busSelection)) {
      const pricing = result.find((r) => r.numberOfPeople === parseInt(busType));
      if (pricing) {
        const restTimeMinutes = restTime / 60;
        restTimePrice += pricing.finalPricePerMinute * restTimeMinutes * (quantity as number);
      }
    }
  }

  return restTimePrice;
}
