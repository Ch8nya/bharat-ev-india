import React, { createContext, useContext, useState, useEffect } from "react";
import { VehicleWithDetails } from "@shared/types";

type ComparisonContextType = {
  selectedVehicles: VehicleWithDetails[];
  isComparing: boolean;
  toggleVehicle: (vehicle: VehicleWithDetails) => void;
  isSelected: (id: number) => boolean;
  clearComparison: () => void;
  removeVehicle: (id: number) => void;
};

const ComparisonContext = createContext<ComparisonContextType | undefined>(undefined);

const MAX_VEHICLES = 3;

export function ComparisonProvider({ children }: { children: React.ReactNode }) {
  const [selectedVehicles, setSelectedVehicles] = useState<VehicleWithDetails[]>([]);
  const [isComparing, setIsComparing] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem("comparisonVehicles");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSelectedVehicles(parsed);
        }
      }
    } catch (error) {
      console.error("Failed to load comparison from localStorage:", error);
    }
  }, []);

  // Save to localStorage when selectedVehicles changes
  useEffect(() => {
    try {
      localStorage.setItem("comparisonVehicles", JSON.stringify(selectedVehicles));
    } catch (error) {
      console.error("Failed to save comparison to localStorage:", error);
    }
  }, [selectedVehicles]);

  // Auto-show comparison bar when vehicles are selected
  useEffect(() => {
    if (selectedVehicles.length > 0) {
      setIsComparing(true);
    } else {
      setIsComparing(false);
    }
  }, [selectedVehicles]);

  const toggleVehicle = (vehicle: VehicleWithDetails) => {
    setSelectedVehicles(prev => {
      // Check if this vehicle is already selected
      const index = prev.findIndex(v => v.id === vehicle.id);
      
      if (index >= 0) {
        // Remove if already selected
        return prev.filter(v => v.id !== vehicle.id);
      } else {
        // Add if not at maximum
        if (prev.length < MAX_VEHICLES) {
          return [...prev, vehicle];
        }
        return prev;
      }
    });
  };

  const isSelected = (id: number) => {
    return selectedVehicles.some(v => v.id === id);
  };

  const clearComparison = () => {
    setSelectedVehicles([]);
  };

  const removeVehicle = (id: number) => {
    setSelectedVehicles(prev => prev.filter(v => v.id !== id));
  };

  return (
    <ComparisonContext.Provider
      value={{
        selectedVehicles,
        isComparing,
        toggleVehicle,
        isSelected,
        clearComparison,
        removeVehicle
      }}
    >
      {children}
    </ComparisonContext.Provider>
  );
}

export function useComparison() {
  const context = useContext(ComparisonContext);
  if (!context) {
    throw new Error("useComparison must be used within a ComparisonProvider");
  }
  return context;
}