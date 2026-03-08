import React, { useState, useEffect, useRef } from 'react';

interface DrivingMixSelectorProps {
  cityPercent: number;
  statePercent: number;
  nationalPercent: number;
  onMixChange: (city: number, state: number, national: number) => void;
}

export default function DrivingMixSelector({
  cityPercent,
  statePercent,
  nationalPercent,
  onMixChange
}: DrivingMixSelectorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<number | null>(null);
  const [dividers, setDividers] = useState([cityPercent, cityPercent + statePercent]);

  // Initialize dividers only when props change significantly
  const prevCityPercent = useRef(cityPercent);
  const prevStatePercent = useRef(statePercent);
  
  useEffect(() => {
    // Check if props changed significantly to avoid render loop
    if (
      Math.abs(prevCityPercent.current - cityPercent) > 0.5 || 
      Math.abs(prevStatePercent.current - statePercent) > 0.5
    ) {
      setDividers([cityPercent, cityPercent + statePercent]);
      prevCityPercent.current = cityPercent;
      prevStatePercent.current = statePercent;
    }
  }, [cityPercent, statePercent]);

  // Handle mouse/touch down on a divider
  const handleDividerMouseDown = (index: number) => (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    setDragging(index);
  };

  // Update divider position and maintain constraints
  const updateDividerPosition = (percentage: number) => {
    setDividers(prevDividers => {
      const newDividers = [...prevDividers];
      
      // Ensure the divider being moved doesn't cross other dividers
      if (dragging === 0) {
        // First divider: move between 0 and second divider
        newDividers[0] = Math.min(percentage, newDividers[1]);
        
        // Calculate new percentages
        const newCity = newDividers[0];
        const newState = newDividers[1] - newDividers[0];
        const newNational = 100 - newDividers[1];
        
        // Update the parent component with new percentages
        onMixChange(newCity, newState, newNational);
      } else if (dragging === 1) {
        // Second divider: move between first divider and 100
        newDividers[1] = Math.max(percentage, newDividers[0]);
        
        // Calculate new percentages
        const newCity = newDividers[0];
        const newState = newDividers[1] - newDividers[0];
        const newNational = 100 - newDividers[1];
        
        // Update the parent component with new percentages
        onMixChange(newCity, newState, newNational);
      }
      
      return newDividers;
    });
  };

  // Handle mouse move while dragging
  const handleMouseMove = (e: MouseEvent) => {
    if (dragging === null || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const mouseX = e.clientX - rect.left;
    
    // Convert pixel position to percentage (0-100)
    let percentage = Math.round((mouseX / containerWidth) * 100);
    percentage = Math.max(0, Math.min(100, percentage));
    
    updateDividerPosition(percentage);
  };

  // Handle touch move while dragging
  const handleTouchMove = (e: TouchEvent) => {
    if (dragging === null || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const containerWidth = rect.width;
    const touchX = e.touches[0].clientX - rect.left;
    
    // Convert pixel position to percentage (0-100)
    let percentage = Math.round((touchX / containerWidth) * 100);
    percentage = Math.max(0, Math.min(100, percentage));
    
    updateDividerPosition(percentage);
  };

  // Stop dragging when mouse/touch is released
  const handleMouseUp = () => {
    setDragging(null);
  };

  // Add and remove event listeners for mouse/touch move and up
  useEffect(() => {
    if (dragging !== null) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('touchend', handleMouseUp);
    }
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleMouseUp);
    };
  }, [dragging]);

  // Calculate the width of each section
  const cityWidth = `${cityPercent}%`;
  const stateWidth = `${statePercent}%`;
  const nationalWidth = `${nationalPercent}%`;

  return (
    <div className="mt-2 space-y-2">
      {/* Percentage labels */}
      <div className="flex text-xs text-gray-600">
        <div style={{ width: cityWidth }} className="text-center">
          City: {cityPercent}%
        </div>
        <div style={{ width: stateWidth }} className="text-center">
          State: {statePercent}%
        </div>
        <div style={{ width: nationalWidth }} className="text-center">
          National: {nationalPercent}%
        </div>
      </div>
      
      {/* Progress bar with dividers */}
      <div 
        ref={containerRef}
        className="relative h-8 bg-gray-200 rounded-md overflow-hidden"
        aria-label="Driving mix selector"
      >
        {/* City section */}
        <div 
          className="absolute top-0 bottom-0 left-0 bg-green-300"
          style={{ width: cityWidth }}
          aria-label="City driving percentage"
        />
        
        {/* State highway section */}
        <div 
          className="absolute top-0 bottom-0 bg-blue-300"
          style={{ left: cityWidth, width: stateWidth }}
          aria-label="State highway driving percentage"
        />
        
        {/* National highway section */}
        <div 
          className="absolute top-0 bottom-0 right-0 bg-amber-300"
          style={{ width: nationalWidth }}
          aria-label="National highway driving percentage"
        />
        
        {/* Divider between City and State */}
        <div 
          className="absolute top-0 bottom-0 w-2 bg-gray-600 cursor-ew-resize z-10 -ml-1"
          style={{ left: cityWidth }}
          onMouseDown={handleDividerMouseDown(0)}
          onTouchStart={handleDividerMouseDown(0)}
          aria-label="Divider between city and state highway"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={cityPercent}
        />
        
        {/* Divider between State and National */}
        <div 
          className="absolute top-0 bottom-0 w-2 bg-gray-600 cursor-ew-resize z-10 -ml-1"
          style={{ left: `${dividers[1]}%` }}
          onMouseDown={handleDividerMouseDown(1)}
          onTouchStart={handleDividerMouseDown(1)}
          aria-label="Divider between state and national highway"
          role="slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={cityPercent + statePercent}
        />
      </div>
    </div>
  );
}