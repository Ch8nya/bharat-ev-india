import { useState, useCallback, useEffect, useRef } from "react";
import { Slider } from "@/components/ui/slider";

interface DualRangeSliderProps {
  min: number;
  max: number;
  initialMin?: number;
  initialMax?: number;
  step?: number;
  unit?: string;
  label: string;
  onChange?: (values: { min: number; max: number }) => void;
}

const DualRangeSlider = ({
  min,
  max,
  initialMin = min,
  initialMax = max,
  step = 1,
  unit = "",
  label,
  onChange,
}: DualRangeSliderProps) => {
  // Use a ref to track if this is the first render
  const isInitialRender = useRef(true);
  
  // Initialize state with initial values
  const [values, setValues] = useState<[number, number]>([
    initialMin !== undefined ? initialMin : min,
    initialMax !== undefined ? initialMax : max
  ]);

  // Properly handle initialMin/initialMax prop changes without creating infinite loops
  useEffect(() => {
    if (isInitialRender.current) {
      isInitialRender.current = false;
      return;
    }
    
    // Only update if the props actually changed and are defined
    if (initialMin !== undefined && initialMax !== undefined) {
      // Only update if values are different to avoid render loops
      if (values[0] !== initialMin || values[1] !== initialMax) {
        setValues([initialMin, initialMax]);
      }
    }
  }, [initialMin, initialMax]);

  // Handle internal value changes
  const handleValueChange = useCallback((newValues: [number, number]) => {
    setValues(newValues);
    if (onChange) {
      onChange({ min: newValues[0], max: newValues[1] });
    }
  }, [onChange]);

  // Format the value display
  const formatValue = (value: number) => {
    if (unit === "L" && value >= 100) {
      return `${(value / 100).toFixed(1)} Cr`;
    }
    return `${value}${unit}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center items-center mb-2">
        <span className="text-sm font-medium text-gray-700">
          {label}:&nbsp;
          <span className="text-gray-600">
            {values[0] === min && values[1] === max
              ? `${formatValue(min)} - ${formatValue(max)}`
              : `${formatValue(values[0])} - ${formatValue(values[1])}`}
          </span>
        </span>
      </div>
      <div className="px-1">
        <Slider
          min={min}
          max={max}
          step={step}
          value={values}
          onValueChange={handleValueChange}
          className="cursor-pointer"
        />
      </div>
    </div>
  );
};

export default DualRangeSlider;
