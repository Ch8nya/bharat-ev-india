import { VehicleWithDetails } from "@shared/types";
import RangeEstimator from "./range-estimator";
import { calculateLongDistanceMetrics, generateStarRating } from "@/lib/longDistanceRating";

interface TabProps {
  vehicle: VehicleWithDetails;
}

export function RangeEstimatorTab({ vehicle }: TabProps) {
  return (
    <div className="mt-8">
      <h3 className="text-base font-medium text-gray-900 mb-4">Real-World Range Estimator</h3>
      <p className="text-sm text-gray-500 mb-4">Estimate how far you can drive based on environmental and driving factors</p>
      
      <RangeEstimator vehicle={vehicle} />
    </div>
  );
}

export function BatteryTab({ vehicle }: TabProps) {
  const getBatteryWarranty = () => {
    // Check for lifetime warranty (100 years or 10,000,000 km)
    if ((vehicle.batteryWarrantyYears !== null && vehicle.batteryWarrantyYears >= 100) || 
        (vehicle.batteryWarrantyKm !== null && vehicle.batteryWarrantyKm >= 10000000)) {
      return "Lifetime warranty";
    }
    
    // Regular warranty display
    if (vehicle.batteryWarrantyYears && vehicle.batteryWarrantyKm) {
      return `${vehicle.batteryWarrantyYears} years / ${vehicle.batteryWarrantyKm.toLocaleString()} km`;
    } else if (vehicle.batteryWarrantyYears) {
      return `${vehicle.batteryWarrantyYears} years`;
    } else if (vehicle.batteryWarrantyKm) {
      return `${vehicle.batteryWarrantyKm.toLocaleString()} km`;
    }
    return "N/A";
  };

  return (
    <div className="mt-8">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Battery Type</dt>
          <dd className="mt-1 text-sm text-gray-500">{vehicle.batteryTypeName || "N/A"}</dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Total Capacity</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Usable Capacity</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.usableBatteryCapacity ? `${vehicle.usableBatteryCapacity} kWh` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Warranty</dt>
          <dd className="mt-1 text-sm text-gray-500">{getBatteryWarranty()}</dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Official Range</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.officialRange ? `${vehicle.officialRange} km (${vehicle.rangeRatingSystem})` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Real-World Range</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.realWorldRange ? `${vehicle.realWorldRange} km` : "N/A"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function PerformanceTab({ vehicle }: TabProps) {
  return (
    <div className="mt-8">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Power</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.horsepower ? `${vehicle.horsepower} BHP (${Math.round(vehicle.horsepower * 0.7457)} kW)` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Torque</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.torque ? `${vehicle.torque} Nm` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">0-100 km/h</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.acceleration ? `${vehicle.acceleration} seconds` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Top Speed</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.topSpeed ? `${vehicle.topSpeed} km/h` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Drive Type</dt>
          <dd className="mt-1 text-sm text-gray-500">{vehicle.driveTypeName || "N/A"}</dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Weight</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.weight ? `${vehicle.weight.toLocaleString()} kg` : "N/A"}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function ChargingTab({ vehicle }: TabProps) {
  const getFormattedChargingTime = () => {
    if (!vehicle.batteryCapacity) return "N/A";
    
    // Calculate minutes for 0-100% with 7.4kW AC charger
    const minutes = Math.round(vehicle.batteryCapacity / 7.4 * 60);
    
    if (minutes < 60) {
      return `${minutes} minutes`;
    } else {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;
      return remainingMinutes > 0 
        ? `${hours} h ${remainingMinutes} min` 
        : `${hours} hours`;
    }
  };

  // Check if the vehicle has fast charging capability
  // Some vehicles (like MG Comet) have fastChargingCapacity = 0 instead of null
  const hasFastCharging = vehicle.fastChargingCapacity !== null && vehicle.fastChargingCapacity > 0;
  
  // Calculate Average DC Fast Charging Speed (10-80%)
  const getAvgDCFastChargingSpeed = () => {
    if (!hasFastCharging || !vehicle.usableBatteryCapacity || !vehicle.fastChargingTime) return "N/A";
    
    // (Useable Capacity (kWh) * 0.70) / (10-80 time (minutes) / 60)
    const avgSpeed = (vehicle.usableBatteryCapacity * 0.70) / (vehicle.fastChargingTime / 60);
    return `${avgSpeed.toFixed(1)} kW`;
  };
  
  // Calculate 10-80% range added
  const get1080RangeAdded = () => {
    if (!hasFastCharging || !vehicle.realWorldRange) return "";
    
    // Real Range (km) * 0.70
    const rangeAdded = vehicle.realWorldRange * 0.70;
    return `(${Math.round(rangeAdded)} km added)`;
  };
  
  // Calculate Range Added per Minute of DC Fast Charging
  const getRangePerMinute = () => {
    if (!hasFastCharging || !vehicle.usableBatteryCapacity || !vehicle.fastChargingTime || !vehicle.efficiency || !vehicle.realWorldRange) 
      return "N/A";
    
    // Calculate average charging speed in kW
    const avgChargingSpeed = (vehicle.usableBatteryCapacity * 0.70) / (vehicle.fastChargingTime / 60);
    
    // Range Added per Minute = Average DC Fast Charging Speed (kW) * 1000 / Efficiency (Wh/km) * (1/60)
    // Simplified: avgChargingSpeed * 1000 / (efficiency * 60)
    const rangePerMinute = (avgChargingSpeed * 1000) / (vehicle.efficiency * 60);
    
    return `${rangePerMinute.toFixed(1)} km/min`;
  };

  return (
    <div className="mt-8">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Fast Charging Capacity</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.fastChargingCapacity && vehicle.fastChargingCapacity > 0 
              ? `${vehicle.fastChargingCapacity} kW` 
              : "Not Supported"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Fast Charging Time (10-80%)</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {hasFastCharging && vehicle.fastChargingTime 
              ? `${vehicle.fastChargingTime} minutes ${get1080RangeAdded()}` 
              : "Not Supported"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Average DC Fast Charging Speed (10-80%)</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {getAvgDCFastChargingSpeed()}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Range Added per Minute (DC Fast Charging)</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {getRangePerMinute()}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Estimated Charging Time (0-100%, AC 7.4kW)</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {getFormattedChargingTime()}
          </dd>
        </div>
      </dl>
    </div>
  );
}

export function LongDistanceRatingTab({ vehicle }: TabProps) {
  // Check if the vehicle has fast charging capability
  // Some vehicles (like MG Comet) have fastChargingCapacity = 0 instead of null
  const hasFastCharging = vehicle.fastChargingCapacity !== null && vehicle.fastChargingCapacity > 0;
  
  // If vehicle doesn't support fast charging, display appropriate message
  if (!hasFastCharging) {
    return (
      <div className="mt-8">
        <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
          <h3 className="text-base font-medium text-amber-800 mb-2">No Fast Charging Support</h3>
          <p className="text-sm text-amber-700">
            This vehicle does not support DC fast charging, which means it's not suitable for long-distance travel
            with charging stops. The vehicle's total range on a single charge is approximately {vehicle.realWorldRange || 'N/A'} km.
          </p>
        </div>
      </div>
    );
  }
  
  const metrics = calculateLongDistanceMetrics(
    vehicle.realWorldRange,
    vehicle.fastChargingTime,
    vehicle.usableBatteryCapacity
  );

  if (!metrics) {
    return (
      <div className="mt-8">
        <div className="bg-amber-50 border border-amber-100 rounded-md p-4">
          <h3 className="text-base font-medium text-amber-800 mb-2">Insufficient Data</h3>
          <p className="text-sm text-amber-700">
            We don't have enough data to calculate the long distance rating for this vehicle.
            At minimum, we need the real-world range data.
          </p>
        </div>
      </div>
    );
  }

  const { 
    leg1DistanceKm, 
    leg2DistanceKm, 
    oneStopRangeKm, 
    starRating, 
    leg1DurationStr, 
    leg2DurationStr, 
    totalDurationStr,
    canFastCharge
  } = metrics;
  
  return (
    <div className="mt-8">
      <h3 className="text-base font-medium text-gray-900 mb-4">Long Distance Suitability</h3>
      <p className="text-sm text-gray-500 mb-4">
        This rating assesses how suited this EV is for long-distance travel using a standardized benchmark.
        It calculates the total distance achievable in a single trip with one charging stop.
      </p>
      
      <div className="bg-gray-50 p-4 rounded-md mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">How the "1-Stop Range" works:</h4>
        <p className="text-sm text-gray-500 mb-3">
          We measure how far you can travel in a single journey when starting with a full battery, 
          driving until 10% charge remains, stopping once for a fast-charge up to 80%, 
          and then continuing until the battery reaches 10% again.
        </p>
      </div>

      <h4 className="text-sm font-medium text-gray-700 mb-3">Benchmark Test Results</h4>
      <div className="overflow-x-auto mb-6">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stage</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Distance</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Leg 1 (100% → 10%)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><strong>{leg1DistanceKm}</strong> km</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><strong>{leg1DurationStr}</strong></td>
            </tr>
            <tr className={!canFastCharge ? "bg-gray-100 text-gray-400" : ""}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Charging Stop (10% → 80%)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">0 km</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{canFastCharge ? "15min" : "N/A"}</td>
            </tr>
            <tr className={!canFastCharge ? "bg-gray-100 text-gray-400" : ""}>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Leg 2 (80% → 10%)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <strong>{canFastCharge ? leg2DistanceKm : 0}</strong> km
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <strong>{canFastCharge ? leg2DurationStr : "N/A"}</strong>
              </td>
            </tr>
            <tr className="bg-gray-50 font-medium">
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">Total 1-Stop Journey</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><strong>{oneStopRangeKm}</strong> km</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"><strong>{totalDurationStr}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <h4 className="text-sm font-medium text-gray-700 mb-2">5-Star Rating</h4>
        <div className="mb-4">
          <div className="flex items-center mb-1">
            <div className="text-lg font-medium text-gray-900">Rating: {starRating.toFixed(1)} / 5.0</div>
            <div 
              className="ml-3 text-yellow-500" 
              aria-hidden="true"
              dangerouslySetInnerHTML={{ __html: generateStarRating(starRating) }}
            />
          </div>
          <p className="text-sm text-gray-500">Based on the 2025 EV Long Distance Rating Scale</p>
        </div>

        <div className="text-sm text-gray-500 space-y-1">
          <p> 0 stars: &lt; 200 km</p>
          <p> 1 star: 200 - 324 km</p>
          <p> 2 stars: 325 - 449 km</p>
          <p> 3 stars: 450 - 574 km</p>
          <p> 4 stars: 575 - 699 km</p>
          <p> 5 stars: 700+ km</p>
        </div>
      </div>
    </div>
  );
}

export function FeaturesTab({ vehicle }: TabProps) {
  return (
    <div className="mt-8">
      <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Vehicle-to-Load (V2L) Support</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.v2lSupport ? "Yes" : "No"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">V2L Output Power</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.v2lSupport && vehicle.v2lOutputPower
              ? `${vehicle.v2lOutputPower} Watts`
              : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Boot Space</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {vehicle.bootSpace ? `${vehicle.bootSpace} liters` : "N/A"}
          </dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Battery Type</dt>
          <dd className="mt-1 text-sm text-gray-500">{vehicle.batteryTypeName || "N/A"}</dd>
        </div>
        <div className="sm:col-span-1">
          <dt className="text-sm font-bold text-gray-900">Battery Warranty</dt>
          <dd className="mt-1 text-sm text-gray-500">
            {(vehicle.batteryWarrantyYears !== null && vehicle.batteryWarrantyYears >= 100) || 
             (vehicle.batteryWarrantyKm !== null && vehicle.batteryWarrantyKm >= 10000000)
              ? "Lifetime warranty"
              : vehicle.batteryWarrantyYears && vehicle.batteryWarrantyKm
              ? `${vehicle.batteryWarrantyYears} years / ${vehicle.batteryWarrantyKm.toLocaleString()} km`
              : vehicle.batteryWarrantyYears
              ? `${vehicle.batteryWarrantyYears} years`
              : vehicle.batteryWarrantyKm
              ? `${vehicle.batteryWarrantyKm.toLocaleString()} km`
              : "N/A"}
          </dd>
        </div>
      </dl>
    </div>
  );
}