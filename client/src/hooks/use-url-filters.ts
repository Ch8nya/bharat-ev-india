import { useEffect, useState } from 'react';
import { useLocation, useRoute } from 'wouter';
import { VehicleFilter } from '@shared/types';

/**
 * A hook that synchronizes filter state with URL parameters to persist filters
 * across page navigation.
 */
export function useUrlFilters(initialState: VehicleFilter) {
  const [location, setLocation] = useLocation();
  const [, params] = useRoute('/'); // This hook ensures we only run on the home page
  const [filter, setFilterState] = useState<VehicleFilter>(() => {
    // If we're not on the home page, just return the initial state
    if (location !== '/') {
      return initialState;
    }
    
    // Start with the initial state
    const result = { ...initialState };
    const searchParams = new URLSearchParams(window.location.search);
    
    // Handle search term
    const searchTerm = searchParams.get('searchTerm');
    if (searchTerm) {
      result.searchTerm = searchTerm;
    }
    
    // Handle sort options
    const sortBy = searchParams.get('sortBy');
    if (sortBy && ['popular', 'price_low', 'price_high', 'range_high', 'battery_high', 
                'efficiency', 'acceleration', 'weight_low', 'weight_high', 
                'cost_per_km', 'charging_fast', 'horsepower', 'torque'].includes(sortBy)) {
      result.sortBy = sortBy as VehicleFilter['sortBy'];
    }
    
    // Handle pagination
    const page = searchParams.get('page');
    if (page) {
      result.page = parseInt(page, 10);
    }
    
    const perPage = searchParams.get('perPage');
    if (perPage) {
      result.perPage = parseInt(perPage, 10);
    }
    
    // Handle numeric ranges
    [
      'minPrice', 'maxPrice', 'minRange', 'maxRange',
      'minBatteryCapacity', 'maxBatteryCapacity', 'minUsableBatteryCapacity', 
      'maxUsableBatteryCapacity', 'minAcceleration', 'maxAcceleration',
      'minHorsepower', 'maxHorsepower', 'minTorque', 'maxTorque',
      'minFastChargingCapacity', 'maxFastChargingCapacity',
      'minFastChargingTime', 'maxFastChargingTime', 'minWeight', 'maxWeight',
      'minBatteryWarrantyYears', 'maxBatteryWarrantyYears',
      'minBatteryWarrantyKm', 'maxBatteryWarrantyKm'
    ].forEach(key => {
      const value = searchParams.get(key);
      if (value) {
        (result as any)[key] = parseInt(value, 10);
      }
    });
    
    // Handle boolean values
    const v2lSupport = searchParams.get('v2lSupport');
    if (v2lSupport !== null) {
      result.v2lSupport = v2lSupport === 'true';
    }
    
    // Handle array values
    ['manufacturerIds', 'bodyStyleIds', 'driveTypeIds', 'batteryTypeIds'].forEach(key => {
      const values = searchParams.getAll(`${key}[]`);
      if (values.length > 0) {
        (result as any)[key] = values.map(v => parseInt(v, 10));
      }
    });
    
    return result;
  });

  // Update URL when filter changes
  useEffect(() => {
    if (location === '/') {
      const searchParams = new URLSearchParams();
      
      // Only add parameters to URL that have values
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            if (value.length > 0) {
              value.forEach(v => searchParams.append(`${key}[]`, v.toString()));
            }
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });

      const queryString = searchParams.toString();
      const newUrl = queryString ? `/?${queryString}` : '/';
      
      // Only update URL if it changed - avoids infinite loops
      const currentUrl = location + window.location.search;
      if (newUrl !== currentUrl) {
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [filter, location]);

  // Wrapper for setFilter that ensures state is updated
  const setFilter = (newFilterOrFunction: Partial<VehicleFilter> | ((prev: VehicleFilter) => VehicleFilter)) => {
    if (typeof newFilterOrFunction === 'function') {
      setFilterState(prev => {
        const newFilter = newFilterOrFunction(prev);
        return newFilter;
      });
    } else {
      setFilterState(prev => ({ ...prev, ...newFilterOrFunction }));
    }
  };

  return { filter, setFilter };
}