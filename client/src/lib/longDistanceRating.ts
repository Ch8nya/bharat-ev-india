/**
 * Utility functions for calculating long distance travel metrics
 */

interface LongDistanceMetrics {
  leg1DistanceKm: number;
  leg2DistanceKm: number;
  oneStopRangeKm: number;
  starRating: number;
  leg1DurationStr: string;
  leg2DurationStr: string;
  totalDurationStr: string;
  canFastCharge: boolean;
}

/**
 * Calculates the long distance travel metrics for a vehicle
 * @param realRangeKm The real world range in km
 * @param time10To80Min The time for fast charging from 10% to 80% SoC in minutes
 * @param useableCapacityKwh The usable battery capacity in kWh
 * @returns The long distance metrics object
 */
export function calculateLongDistanceMetrics(
  realRangeKm: number | null,
  time10To80Min: number | null,
  useableCapacityKwh: number | null
): LongDistanceMetrics | null {
  // Return null if required data is missing
  if (!realRangeKm) {
    return null;
  }

  // Check if fast charging is available - both values must be positive
  const canFastCharge = Boolean(time10To80Min && time10To80Min > 0 && useableCapacityKwh && useableCapacityKwh > 0);
  
  // Calculate Leg 1 Distance
  const leg1DistanceKm = parseFloat((realRangeKm * 0.9).toFixed(1));
  
  // Calculate Leg 2 Distance
  let leg2DistanceKm = 0;
  if (canFastCharge && time10To80Min) {
    leg2DistanceKm = parseFloat(((10.5 * realRangeKm) / time10To80Min).toFixed(1));
  }
  
  // Calculate One-Stop Range
  const oneStopRangeKm = parseFloat((leg1DistanceKm + leg2DistanceKm).toFixed(1));
  
  // Calculate Star Rating
  let rating = 0;
  if (oneStopRangeKm < 200) {
    rating = 0;
  } else if (oneStopRangeKm < 325) {
    rating = 1.0 + (oneStopRangeKm - 200) / 125.0;
  } else if (oneStopRangeKm < 450) {
    rating = 2.0 + (oneStopRangeKm - 325) / 125.0;
  } else if (oneStopRangeKm < 575) {
    rating = 3.0 + (oneStopRangeKm - 450) / 125.0;
  } else if (oneStopRangeKm < 700) {
    rating = 4.0 + (oneStopRangeKm - 575) / 125.0;
  } else {
    rating = 5.0;
  }
  
  // Round to nearest 0.5
  const starRating = Math.round(rating * 2) / 2.0;
  
  // Calculate durations
  const avgSpeedKmh = 70; // Average speed for highway travel
  
  // Calculate efficiency if available, but not used in this version
  const efficiencyKwhPerKm = useableCapacityKwh && realRangeKm 
    ? useableCapacityKwh / realRangeKm 
    : null;
  
  const leg1DurationHours = leg1DistanceKm / avgSpeedKmh;
  const leg2DurationHours = leg2DistanceKm > 0 ? leg2DistanceKm / avgSpeedKmh : 0;
  const chargingStopDurationHours = canFastCharge ? 0.25 : 0; // 15 minutes
  
  const totalDurationHours = leg1DurationHours + chargingStopDurationHours + leg2DurationHours;
  
  // Format durations
  const leg1DurationStr = formatDuration(leg1DurationHours);
  const leg2DurationStr = leg2DistanceKm > 0 ? formatDuration(leg2DurationHours) : "N/A";
  const totalDurationStr = formatDuration(totalDurationHours);
  
  return {
    leg1DistanceKm,
    leg2DistanceKm,
    oneStopRangeKm,
    starRating,
    leg1DurationStr,
    leg2DurationStr,
    totalDurationStr,
    canFastCharge
  };
}

/**
 * Formats a duration in hours to a string in the format "Xh Ymin"
 * @param hours The duration in hours
 * @returns The formatted duration string
 */
export function formatDuration(hours: number): string {
  const totalMinutes = Math.round(hours * 60);
  const h = Math.floor(totalMinutes / 60);
  const min = totalMinutes % 60;
  
  if (h === 0) {
    return `${min}min`;
  } else if (min === 0) {
    return `${h}h`;
  } else {
    return `${h}h ${min}min`;
  }
}

/**
 * Generates star rating display based on the rating value
 * @param rating The rating value (0-5)
 * @returns JSX element with stars as SVG icons
 */
export function generateStarRating(rating: number) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 !== 0;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  
  // SVG paths for the different star types
  const fullStarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20" fill="currentColor" style="display: inline-block; margin-right: 2px;">
    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
  </svg>`;
  
  const halfStarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20" fill="currentColor" style="display: inline-block; margin-right: 2px;">
    <path d="M288 0c-12.2 .1-23.3 7-28.6 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3L288 439.8 288 0zM429.9 512c1.1 .1 2.1 .1 3.2 0l-3.2 0z"/>
  </svg>`;
  
  const emptyStarSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 576 512" width="20" height="20" fill="none" stroke="currentColor" stroke-width="20" style="display: inline-block; margin-right: 2px;">
    <path d="M316.9 18C311.6 7 300.4 0 288.1 0s-23.4 7-28.8 18L195 150.3 51.4 171.5c-12 1.8-22 10.2-25.7 21.7s-.7 24.2 7.9 32.7L137.8 329 113.2 474.7c-2 12 3 24.2 12.9 31.3s23 8 33.8 2.3l128.3-68.5 128.3 68.5c10.8 5.7 23.9 4.9 33.8-2.3s14.9-19.3 12.9-31.3L438.5 329 542.7 225.9c8.6-8.5 11.7-21.2 7.9-32.7s-13.7-19.9-25.7-21.7L381.2 150.3 316.9 18z"/>
  </svg>`;
  
  let starsHtml = '<div style="display: flex; align-items: center;">';
  
  // Add full stars
  for (let i = 0; i < fullStars; i++) {
    starsHtml += fullStarSvg;
  }
  
  // Add half star if needed
  if (hasHalfStar) {
    starsHtml += halfStarSvg;
  }
  
  // Add empty stars
  for (let i = 0; i < emptyStars; i++) {
    starsHtml += emptyStarSvg;
  }
  
  starsHtml += '</div>';
  
  return starsHtml;
}