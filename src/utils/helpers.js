export const calculateRisks = (temp = 14, hum = 50, elevation = 50) => {
  const normalizedTemp = Math.max(0, Math.min(40, temp));
  const normalizedHum = Math.max(0, Math.min(100, hum));
  const diseaseRisk = Math.round(
    Math.max(0, Math.min(100,
      (normalizedHum - 50) * 1.2 +
      (normalizedTemp - 18) * 2 +
      (elevation - 50) * 0.15
    ))
  );

  const diseaseName = diseaseRisk > 60 ? 'Mildiou' : diseaseRisk > 30 ? 'Oïdium' : diseaseRisk > 15 ? 'Botrytis' : 'Aucun risque';

  const weatherRisk = Math.round(
    Math.max(0, Math.min(100,
      (normalizedTemp < 0 ? 60 : normalizedTemp > 32 ? 45 : 15) +
      (normalizedHum > 80 ? 20 : 0) +
      (normalizedTemp < 3 ? 20 : 0)
    ))
  );

  const weatherName = weatherRisk > 60
    ? (normalizedTemp <= 0 ? 'Gel sévère' : 'Orage violent')
    : weatherRisk > 30
      ? 'Conditions à risque'
      : weatherRisk > 15
        ? 'Échaudage potentiel'
        : 'Conditions optimales';

  return {
    diseaseRisk,
    diseaseName,
    weatherRisk,
    weatherName,
  };
};

export const getCardinalDirection = (degrees = 0) => {
  const normalized = ((degrees % 360) + 360) % 360;
  if (normalized >= 337.5 || normalized < 22.5) return 'Nord';
  if (normalized >= 22.5 && normalized < 67.5) return 'Nord-Est';
  if (normalized >= 67.5 && normalized < 112.5) return 'Est';
  if (normalized >= 112.5 && normalized < 157.5) return 'Sud-Est';
  if (normalized >= 157.5 && normalized < 202.5) return 'Sud';
  if (normalized >= 202.5 && normalized < 247.5) return 'Sud-Ouest';
  if (normalized >= 247.5 && normalized < 292.5) return 'Ouest';
  return 'Nord-Ouest';
};

export const getCenter = (points = []) => {
  if (!points || points.length === 0) {
    return { lat: 44.89, lng: -0.16 };
  }

  if (Array.isArray(points[0]) && points[0].length >= 2) {
    const average = points.reduce(
      (acc, [lat, lng]) => ({ lat: acc.lat + lat, lng: acc.lng + lng }),
      { lat: 0, lng: 0 }
    );
    return {
      lat: average.lat / points.length,
      lng: average.lng / points.length,
    };
  }

  if (points.length === 2 && Array.isArray(points[0]) && Array.isArray(points[1])) {
    const lat = (points[0][0] + points[1][0]) / 2;
    const lng = (points[0][1] + points[1][1]) / 2;
    return { lat, lng };
  }

  return { lat: 44.89, lng: -0.16 };
};
