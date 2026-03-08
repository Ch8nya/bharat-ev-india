import React, { useState, useEffect, useCallback } from "react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { VehicleWithDetails } from "@shared/types";
import DrivingMixSelector from "./driving-mix-selector";

interface RangeEstimatorProps {
  vehicle: VehicleWithDetails;
}

// Constants based on the research-backed formulas
const Driver_Weight = 75; // kg
const HVAC_Baseline_Energy_Fraction = 0.125;
const Optimal_Temp = 22; // °C
const Baseline_Temp = 40; // °C
const HVAC_Temp_Coefficient = 0.1; // kW/°C
const Rolling_Resistance_Factor = 0.35;
const Speed_Model_Const_A = 0.0475; // kWh/km
const Speed_Model_Const_B = 0.000010625; // kWh/km/(km/h)^2
const Rel_Energy_City = 1.0;
const Rel_Energy_State = 1.25;
const Rel_Energy_National = 1.5;
const Baseline_Speed = 80; // km/h

export default function RangeEstimator({ vehicle }: RangeEstimatorProps) {
  // If realWorldRange is not available, show a message
  if (!vehicle.realWorldRange) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="text-center p-6 text-gray-500">
          Real-world range data not available for this vehicle.
          Range estimation requires real-world range data.
        </div>
      </div>
    );
  }

  // State hooks for user inputs
  const [temperature, setTemperature] = useState(Baseline_Temp);
  const [cityPercent, setCityPercent] = useState(20);
  const [statePercent, setStatePercent] = useState(15);
  const [nationalPercent, setNationalPercent] = useState(65);
  const [acOn, setAcOn] = useState(true);
  const [additionalWeight, setAdditionalWeight] = useState(100);
  const [averageSpeed, setAverageSpeed] = useState(Baseline_Speed);
  const [estimatedRange, setEstimatedRange] = useState<number | null>(null);

  // Create normalized percentage values (0-1 scale)
  const cityP = cityPercent / 100;
  const stateP = statePercent / 100;
  const nationalP = nationalPercent / 100;

  // Function to adjust driving mix percentages
  const adjustDrivingMix = useCallback((city: number, state: number, national: number) => {
    // Ensure the total equals 100%
    let total = city + state + national;
    if (total === 100) {
      setCityPercent(city);
      setStatePercent(state);
      setNationalPercent(national);
      return;
    }

    // Normalize to 100%
    const factor = 100 / total;
    setCityPercent(Math.round(city * factor));
    setStatePercent(Math.round(state * factor));
    // Calculate national to ensure exactly 100%
    const calculatedNational = 100 - Math.round(city * factor) - Math.round(state * factor);
    setNationalPercent(calculatedNational);
  }, []);

  // Handle change in city percentage
  const handleCityChange = (value: number[]) => {
    const newCity = value[0];
    // Maintain proportional distribution between state and national
    if (statePercent + nationalPercent > 0) {
      const stateRatio = statePercent / (statePercent + nationalPercent);
      const newState = Math.round((100 - newCity) * stateRatio);
      const newNational = 100 - newCity - newState;
      adjustDrivingMix(newCity, newState, newNational);
    } else {
      adjustDrivingMix(newCity, 0, 100 - newCity);
    }
  };

  // Handle change in state highway percentage
  const handleStateChange = (value: number[]) => {
    const newState = value[0];
    // Maintain proportional distribution between city and national
    if (cityPercent + nationalPercent > 0) {
      const cityRatio = cityPercent / (cityPercent + nationalPercent);
      const newCity = Math.round((100 - newState) * cityRatio);
      const newNational = 100 - newCity - newState;
      adjustDrivingMix(newCity, newState, newNational);
    } else {
      adjustDrivingMix(0, newState, 100 - newState);
    }
  };

  // Handle change in national highway percentage
  const handleNationalChange = (value: number[]) => {
    const newNational = value[0];
    // Maintain proportional distribution between city and state
    if (cityPercent + statePercent > 0) {
      const cityRatio = cityPercent / (cityPercent + statePercent);
      const newCity = Math.round((100 - newNational) * cityRatio);
      const newState = 100 - newCity - newNational;
      adjustDrivingMix(newCity, newState, newNational);
    } else {
      adjustDrivingMix(0, 100 - newNational, newNational);
    }
  };

  // Calculate estimated range when inputs change
  useEffect(() => {
    if (!vehicle.realWorldRange || !vehicle.weight) {
      setEstimatedRange(null);
      return;
    }

    // a) Battery Temperature Efficiency
    const calculateEfficiency = (T: number) => {
      if (T >= 15 && T <= 35) return 1.0;
      else if (T < 15) return Math.max(0.5, 1.0 - 0.005 * (15 - T));
      else return 1.0; // T > 35
    };
    const efficiency_T = calculateEfficiency(temperature);

    // b) Relative HVAC Energy Consumption
    let relative_E_HVAC = 0;
    if (acOn && averageSpeed > 0) {
      const deltaT_base = Math.abs(Baseline_Temp - Optimal_Temp); // 18
      const deltaT_user = Math.abs(temperature - Optimal_Temp);
      relative_E_HVAC = (deltaT_user / deltaT_base) * HVAC_Baseline_Energy_Fraction * (Baseline_Speed / averageSpeed);
    }

    // c) Driving Mix Energy Factor
    const E_base_mix = (0.20 * Rel_Energy_City) + (0.15 * Rel_Energy_State) + (0.65 * Rel_Energy_National); // 1.3625
    const E_user_mix = (cityP * Rel_Energy_City) + (stateP * Rel_Energy_State) + (nationalP * Rel_Energy_National);
    const Factor_mix = E_base_mix > 0 ? E_user_mix / E_base_mix : 1.0;

    // d) Weight Energy Factor
    const m_base = vehicle.weight + Driver_Weight + 100;
    const m_new = vehicle.weight + Driver_Weight + additionalWeight;
    const Factor_weight = m_base > 0 ? 1 + Rolling_Resistance_Factor * ((m_new / m_base) - 1) : 1.0;

    // e) Speed Energy Factor
    const calculateEnergyPerKm = (speed: number) => {
      return Speed_Model_Const_A + Speed_Model_Const_B * Math.pow(speed, 2);
    };
    const E_base_speed = calculateEnergyPerKm(Baseline_Speed);
    const E_user_speed = calculateEnergyPerKm(averageSpeed);
    const Factor_speed = E_base_speed > 0 ? E_user_speed / E_base_speed : 1.0;

    // f) Integrated Range Estimation
    const propulsion_energy_fraction = 1.0 - HVAC_Baseline_Energy_Fraction;
    const relative_E_propulsion = propulsion_energy_fraction * Factor_mix * Factor_speed * Factor_weight / efficiency_T;
    const relative_E_total_new = relative_E_propulsion + relative_E_HVAC;
    const Factor_total = relative_E_total_new > 0 ? 1 / relative_E_total_new : 0;
    
    const Range_estimated = vehicle.realWorldRange * Factor_total;
    setEstimatedRange(Math.round(Range_estimated));
  }, [vehicle.realWorldRange, vehicle.weight, temperature, cityP, stateP, nationalP, acOn, additionalWeight, averageSpeed]);

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <div className="space-y-6">
        {/* Range Display */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="mb-2">
            <h4 className="text-lg font-medium text-gray-900">Estimated Range:</h4>
            <p className="text-sm text-gray-500">
              Based on real-world range of {vehicle.realWorldRange} km
            </p>
          </div>
          <div className="mt-3">
            <span className="text-4xl font-bold text-primary-700">
              {estimatedRange ? `${estimatedRange} km` : "Calculating..."}
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Temperature Slider */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-700">
                Temperature: {temperature}°C
              </label>
            </div>
            <Slider
              value={[temperature]}
              min={5}
              max={45}
              step={1}
              onValueChange={(value) => setTemperature(value[0])}
              aria-label="Temperature"
              aria-valuemin={5}
              aria-valuemax={45}
              aria-valuenow={temperature}
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>5°C</span>
              <span>45°C</span>
            </div>
          </div>

          {/* Climate Control Toggle */}
          <div className="flex items-center space-x-2 pt-6">
            <Switch 
              id="ac-toggle" 
              checked={acOn} 
              onCheckedChange={setAcOn}
              aria-label="Climate control"
            />
            <Label htmlFor="ac-toggle" className="text-sm font-medium text-gray-700">
              Climate Control: {acOn ? "On" : "Off"}
            </Label>
          </div>
        </div>

        {/* Additional Weight Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Additional Weight: {additionalWeight} kg
            </label>
          </div>
          <Slider
            value={[additionalWeight]}
            min={0}
            max={600}
            step={10}
            onValueChange={(value) => setAdditionalWeight(value[0])}
            aria-label="Additional weight"
            aria-valuemin={0}
            aria-valuemax={600}
            aria-valuenow={additionalWeight}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0 kg</span>
            <span>600 kg</span>
          </div>
        </div>

        {/* Average Speed Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Average Speed: {averageSpeed} km/h
            </label>
          </div>
          <Slider
            value={[averageSpeed]}
            min={40}
            max={120}
            step={5}
            onValueChange={(value) => setAverageSpeed(value[0])}
            aria-label="Average speed"
            aria-valuemin={40}
            aria-valuemax={120}
            aria-valuenow={averageSpeed}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>40 km/h</span>
            <span>120 km/h</span>
          </div>
        </div>

        {/* Driving Mix Selector */}
        <div className="space-y-4">
          <h5 className="text-sm font-medium text-gray-700">Driving Mix (total: 100%)</h5>
          <DrivingMixSelector
            cityPercent={cityPercent}
            statePercent={statePercent}
            nationalPercent={nationalPercent}
            onMixChange={adjustDrivingMix}
          />
        </div>

        <div className="bg-gray-100 p-4 rounded-md space-y-3">
          <p className="text-sm text-gray-600">
            <strong>Note:</strong> This range estimator uses research-backed formulas specific to Indian conditions.
            Baseline conditions: 40°C, AC On, 100 kg payload + 75 kg driver, 20% City / 15% State Hwy / 65% Natl Hwy, 80 km/h.
          </p>
          <p className="text-xs text-gray-500 italic">
            <strong>Disclaimer:</strong> The range estimates provided are approximate calculations based on vehicle specifications and selected conditions. 
            These should not be considered as actual values, as real-world range may vary significantly due to driving conditions, 
            vehicle maintenance, battery health, and other factors beyond the scope of this estimator. 
            Always ensure sufficient charge for your journey and consult with the vehicle manufacturer for more precise information.
          </p>
        </div>
      </div>
    </div>
  );
}
