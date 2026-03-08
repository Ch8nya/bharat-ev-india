import React from "react";
import { useComparison } from "../hooks/use-comparison";
import { X, ArrowRight } from "lucide-react";
import { useMediaQuery } from "../hooks/use-mobile";
import { useLocation } from "wouter";

export default function ComparisonBar() {
  const { selectedVehicles, isComparing, clearComparison, removeVehicle } = useComparison();
  const isMobile = useMediaQuery("(max-width: 768px)");
  const [location, navigate] = useLocation();
  
  // Don't show the bar if we have no vehicles selected or not in comparing mode,
  // or if we're already on the compare page
  if (!isComparing || selectedVehicles.length === 0 || location === '/compare') {
    return null;
  }
  
  // Only enable compare view when we have at least 2 vehicles
  const canCompare = selectedVehicles.length >= 2;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 p-3 sm:p-4">
      <button 
        onClick={clearComparison}
        className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 z-10"
        aria-label="Close comparison bar"
      >
        <X size={20} />
      </button>

      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="w-full flex flex-col sm:flex-row items-center">
          {/* For mobile view: Show counter with "x/3" format */}
          {isMobile && (
            <div className="flex justify-between w-full items-center mb-1">
              <span className="text-sm font-medium">
                Compare EVs ({selectedVehicles.length}/3)
              </span>
            </div>
          )}
          
          {/* For desktop view: Show "Compare:" label */}
          <div className="hidden sm:flex items-center gap-1">
            <span className="text-sm font-medium">Compare:</span>
          </div>
          
          <div className={`w-full mt-1 sm:mt-0 grid ${isMobile ? 'grid-cols-1' : 'grid-cols-3'} gap-2 sm:gap-4 sm:ml-4`}>
            {/* Mobile view: Only show selected vehicles and empty slots up to the next required one */}
            {isMobile ? (
              // Mobile view logic with optimized content for smaller screens
              selectedVehicles.map((vehicle, index) => (
                <div 
                  key={vehicle.id} 
                  className="border border-gray-200 rounded-md p-2 bg-white flex items-center relative cursor-pointer"
                  onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                >
                  <div className="h-10 w-10 flex-shrink-0 mr-2">
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
                  <button 
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent navigation when clicking the remove button
                      removeVehicle(vehicle.id);
                    }}
                    className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
                    aria-label="Remove vehicle"
                  >
                    <X size={16} />
                  </button>
                </div>
              )).concat(
                // Show only the next needed empty slot with more clear instructions
                selectedVehicles.length < 2 ? [
                  <div 
                    key="next-empty" 
                    className="border border-dashed border-gray-300 rounded-md h-14 flex items-center justify-center bg-gray-50"
                  >
                    <span className="text-sm text-gray-400">
                      {selectedVehicles.length === 0 
                        ? "Select vehicles to compare" 
                        : "Add another vehicle"}
                    </span>
                  </div>
                ] : []
              )
            ) : (
              // Desktop view: Show all 3 slots
              Array.from({ length: 3 }).map((_, index) => {
                const vehicle = selectedVehicles[index];
                
                if (!vehicle) {
                  return (
                    <div 
                      key={`empty-${index}`} 
                      className="border border-dashed border-gray-300 rounded-md h-20 flex items-center justify-center bg-gray-50"
                    >
                      <span className="text-sm text-gray-400">Add vehicle</span>
                    </div>
                  );
                }
                
                return (
                  <div 
                    key={vehicle.id} 
                    className="border border-gray-200 rounded-md p-2 bg-white flex items-center relative cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => navigate(`/vehicles/${vehicle.id}`)}
                  >
                    <div className="h-16 w-16 flex-shrink-0 mr-2">
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
                    <button 
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent navigation when clicking the remove button
                        removeVehicle(vehicle.id);
                      }}
                      className="absolute top-1 right-1 text-gray-400 hover:text-gray-700"
                      aria-label="Remove vehicle"
                    >
                      <X size={16} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
        
        {/* Compare button when we have at least 2 vehicles */}
        {canCompare && (
          <div className="w-full sm:w-auto mt-3 sm:mt-0">
            {isMobile && (
              <div className="text-xs text-green-600 text-center mb-2">
                Ready to compare
              </div>
            )}
            <button 
              onClick={() => navigate("/compare")}
              className="w-full sm:w-auto inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-900 hover:bg-gray-800"
            >
              <span>Compare Vehicles</span>
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}