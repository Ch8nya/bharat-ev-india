import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { VehicleWithDetails } from "@shared/types";
import { Search, Plus, Check, AlertCircle } from "lucide-react";
import { useComparison } from "@/hooks/use-comparison";
import { useDebounce } from "@/hooks/use-debounce";

export default function SearchVehicles() {
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const { toggleVehicle, isSelected, selectedVehicles } = useComparison();
  const maxVehiclesReached = selectedVehicles.length >= 3;

  // Fetch vehicles with search filter
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ["/api/vehicles/search", debouncedSearchTerm],
    queryFn: async () => {
      if (!debouncedSearchTerm || debouncedSearchTerm.trim() === "") {
        return { data: [] };
      }
      
      const params = new URLSearchParams();
      params.append("searchTerm", debouncedSearchTerm);
      params.append("perPage", "10"); // Limit results to 10 for better performance
      
      const res = await fetch(`/api/vehicles?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      return res.json();
    },
    enabled: debouncedSearchTerm.trim().length > 0,
  });

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <h2 className="text-lg font-medium text-gray-900 mb-4">Search and Add Vehicles to Compare (Add upto 3 vehicles)</h2>
      
      {/* Max vehicles notification */}
      {maxVehiclesReached && (
        <div className="flex items-center p-3 mb-4 bg-amber-50 border border-amber-200 rounded-md">
          <AlertCircle className="h-5 w-5 text-amber-500 mr-2 flex-shrink-0" />
          <p className="text-sm text-amber-700">
            At most 3 vehicles can be compared at a time. Please remove a vehicle before adding another.
          </p>
        </div>
      )}
      
      {/* Search input */}
      <div className="mb-4">
        <div className="relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md py-2"
            placeholder="Search by manufacturer, model or variant..."
            disabled={maxVehiclesReached}
          />
          {searchTerm && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="text-gray-400 hover:text-gray-500"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
      
      {/* Loading state */}
      {isLoading && (
        <div className="my-4 flex justify-center">
          <div className="animate-pulse flex flex-col items-center">
            <div className="h-2 bg-gray-200 rounded w-full max-w-md mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded w-full max-w-sm mb-2.5"></div>
            <div className="h-2 bg-gray-200 rounded w-full max-w-lg"></div>
          </div>
        </div>
      )}
      
      {/* Search results */}
      {!isLoading && searchResults?.data && searchResults.data.length > 0 && (
        <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-3">
          {searchResults.data.map((vehicle: VehicleWithDetails) => (
            <div
              key={vehicle.id}
              className={`flex items-center p-3 border rounded-md hover:bg-gray-50 cursor-pointer ${
                isSelected(vehicle.id) ? "border-blue-400 bg-blue-50 hover:bg-blue-50" : "border-gray-200"
              }`}
              onClick={() => toggleVehicle(vehicle)}
            >
              <div className="h-12 w-12 flex-shrink-0 mr-3">
                <img
                  src={vehicle.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                  alt={`${vehicle.manufacturerName} ${vehicle.modelName}`}
                  className="w-full h-full object-cover rounded"
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-gray-900 truncate">
                  {vehicle.manufacturerName} {vehicle.modelName}
                </h3>
                <p className="text-xs text-gray-500 truncate">
                  {vehicle.variantName}
                </p>
              </div>
              <div className="ml-3">
                {isSelected(vehicle.id) ? (
                  <div className="bg-blue-500 text-white rounded-full p-1">
                    <Check className="h-4 w-4" />
                  </div>
                ) : (
                  <div className="text-gray-400 hover:text-gray-600">
                    <Plus className="h-5 w-5" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* No results state */}
      {!isLoading && debouncedSearchTerm && (!searchResults?.data || searchResults.data.length === 0) && (
        <div className="mt-4 text-center py-4 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">No vehicles found matching "{debouncedSearchTerm}"</p>
        </div>
      )}
      
      {/* Initial state */}
      {!isLoading && !debouncedSearchTerm && (
        <div className="mt-4 text-center py-6 bg-gray-50 rounded-md">
          <p className="text-sm text-gray-500">Type to search for vehicles to compare</p>
        </div>
      )}
    </div>
  );
}