import { VehicleFilter } from "@shared/types";

/**
 * Converts a VehicleFilter object to URLSearchParams
 */
export function filterToQueryParams(filter: VehicleFilter): URLSearchParams {
  const params = new URLSearchParams();
  
  // Handle each filter parameter
  Object.entries(filter).forEach(([key, value]) => {
    if (value !== undefined) {
      if (Array.isArray(value)) {
        // For array values like manufacturerIds, add multiple entries
        value.forEach((v) => params.append(`${key}[]`, v.toString()));
      } else {
        params.append(key, value.toString());
      }
    }
  });
  
  return params;
}

/**
 * Creates a new filter with the specified changes
 */
export function updateFilter(currentFilter: VehicleFilter, changes: Partial<VehicleFilter>): VehicleFilter {
  // When changing filters, reset to page 1 unless explicitly set
  const newFilter = {
    ...currentFilter,
    ...changes,
  };
  
  if (changes.page === undefined && Object.keys(changes).length > 0) {
    newFilter.page = 1;
  }
  
  return newFilter;
}

/**
 * Checks if any filters are active except pagination and sorting
 */
export function hasActiveFilters(filter: VehicleFilter): boolean {
  const { page, perPage, sortBy, ...activeFilters } = filter;
  return Object.values(activeFilters).some(value => {
    if (Array.isArray(value)) {
      return value.length > 0;
    }
    return value !== undefined;
  });
}

/**
 * Returns a filter with all active filters cleared (keeping pagination and sorting)
 */
export function clearFilters(filter: VehicleFilter): VehicleFilter {
  return {
    page: filter.page,
    perPage: filter.perPage,
    sortBy: filter.sortBy,
  };
}

/**
 * Formats a price value to display in Indian lakh/crore format
 * For prices over 100 lakhs, display as crores (1 crore = 100 lakhs)
 */
export function formatPrice(price: number | null): string {
  if (price === null || price === undefined) {
    return "N/A";
  }
  
  // Check if the price is likely stored in raw rupees (larger than 1000)
  // This handles the case where prices from CSV are in raw rupees
  if (price > 1000) {
    // Convert from raw rupees to lakhs
    const priceInLakhs = price / 100000;
    
    // If converted price is over 100 lakhs, display as crores
    if (priceInLakhs >= 100) {
      const priceInCrores = priceInLakhs / 100;
      return `₹${priceInCrores.toFixed(2)}Cr`;
    } else {
      return `₹${priceInLakhs.toFixed(2)}L`;
    }
  } else {
    // Price is already in lakhs
    if (price >= 100) {
      const priceInCrores = price / 100;
      return `₹${priceInCrores.toFixed(2)}Cr`;
    } else {
      return `₹${price.toFixed(2)}L`;
    }
  }
}

/**
 * Formats a range value to display
 */
export function formatRange(range: number | null): string {
  if (range === null || range === undefined) {
    return "N/A";
  }
  return `${range} km`;
}
