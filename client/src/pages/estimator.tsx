import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { Link } from "wouter";
import { ChevronLeft, Search, Plus, Check } from "lucide-react";
import { VehicleWithDetails } from "@shared/types";
import { useQuery } from "@tanstack/react-query";
import { useDebounce } from "@/hooks/use-debounce";
import RangeEstimator from "@/components/range-estimator";

// Create a context for the estimator vehicle selection
type EstimatorContextType = {
  selectedVehicle: VehicleWithDetails | null;
  toggleVehicle: (vehicle: VehicleWithDetails) => void;
  isSelected: (id: number) => boolean;
  removeVehicle: () => void;
};

const EstimatorContext = createContext<EstimatorContextType | undefined>(undefined);

// Provider component for the estimator context
export function EstimatorProvider({ children }: { children: React.ReactNode }) {
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleWithDetails | null>(null);

  const toggleVehicle = (vehicle: VehicleWithDetails) => {
    if (selectedVehicle?.id === vehicle.id) {
      setSelectedVehicle(null);
    } else {
      setSelectedVehicle(vehicle);
    }
  };

  const isSelected = (id: number) => {
    return selectedVehicle?.id === id;
  };

  const removeVehicle = () => {
    setSelectedVehicle(null);
  };

  return (
    <EstimatorContext.Provider
      value={{
        selectedVehicle,
        toggleVehicle,
        isSelected,
        removeVehicle
      }}
    >
      {children}
    </EstimatorContext.Provider>
  );
}

// Hook to use the estimator context
export function useEstimator() {
  const context = useContext(EstimatorContext);
  if (!context) {
    throw new Error("useEstimator must be used within an EstimatorProvider");
  }
  return context;
}

export default function EstimatorPage() {
  return (
    <EstimatorProvider>
      <EstimatorPageContent />
    </EstimatorProvider>
  );
}

// Custom SearchVehicles component for the estimator that overrides the comparison context
function EstimatorSearchVehicles() {
  const { toggleVehicle, isSelected } = useEstimator();
  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  
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
    <div className="bg-white rounded-lg shadow p-4">
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
            className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 pr-12 sm:text-sm border-gray-300 rounded-md"
            style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
            placeholder="Search by manufacturer, model or variant..."
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
          <p className="text-sm text-gray-500">Type to search for vehicles to estimate range</p>
        </div>
      )}
    </div>
  );
}

function EstimatorPageContent() {
  const { selectedVehicle, removeVehicle } = useEstimator();
  const estimatorRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to the top of the estimator when a vehicle is selected
  useEffect(() => {
    if (selectedVehicle && estimatorRef.current) {
      // Scroll the estimator into view with smooth behavior
      estimatorRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [selectedVehicle]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-32">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to all vehicles
        </Link>
      </div>
      
      <h1 className="text-2xl font-bold text-gray-900 mb-8">EV Range Estimator</h1>
      
      {!selectedVehicle ? (
        <div className="bg-white shadow rounded-lg p-8 mb-8 text-center">
          <p className="text-lg mb-4">Please select a vehicle to estimate range</p>
          <p className="text-sm text-gray-500 mb-6">
            Search for a vehicle below to start calculating its range under different conditions
          </p>
          
          {/* Search component with Estimator Context */}
          <EstimatorSearchVehicles />
        </div>
      ) : (
        <div className="mb-8" ref={estimatorRef}>
          <div className="bg-white shadow rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <img
                  src={selectedVehicle.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                  alt={`${selectedVehicle.manufacturerName} ${selectedVehicle.modelName}`}
                  className="w-16 h-12 object-cover rounded mr-3"
                />
                <div>
                  <p className="font-medium">
                    {selectedVehicle.manufacturerName} {selectedVehicle.modelName}
                  </p>
                  <p className="text-sm text-gray-500">{selectedVehicle.variantName}</p>
                </div>
              </div>
              <button 
                onClick={() => removeVehicle()}
                className="p-1 rounded-full hover:bg-gray-200"
                title="Remove vehicle"
              >
                <svg className="h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          
          {/* Range Estimator */}
          <RangeEstimator vehicle={selectedVehicle} />
          
          {/* Additional vehicles search */}
          <div className="mt-8">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Try another vehicle</h3>
            <EstimatorSearchVehicles />
          </div>
        </div>
      )}
      
      <div className="bg-gray-100 p-6 rounded-lg">
        <h2 className="text-lg font-medium text-gray-900 mb-2">About the Range Estimator</h2>
        <p className="text-gray-600 mb-4">
          This tool helps you estimate the real-world range of electric vehicles under various conditions.
          The estimations are based on research-backed formulas specific to Indian driving conditions.
        </p>
        <p className="text-gray-600">
          Factors like temperature, climate control usage, driving mix, additional weight, and average speed
          all affect the actual range you can expect from your EV.
        </p>
      </div>
    </div>
  );
}