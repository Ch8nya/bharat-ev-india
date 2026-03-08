import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@/hooks/use-mobile";
import { useDebounce } from "@/hooks/use-debounce";
import DualRangeSlider from "./dual-range-slider";
import { VehicleFilter } from "@shared/types";
import { 
  Search,
  Filter as FilterIcon,
  ChevronDown,
  Check as CheckIcon,
  X
} from "lucide-react";

interface FilterSectionProps {
  filter: VehicleFilter;
  totalResults: number;
  onFilterChange: (newFilter: Partial<VehicleFilter>) => void;
}

export default function FilterSection({ filter, totalResults, onFilterChange }: FilterSectionProps) {
  const isMobile = useMediaQuery("(max-width: 768px)");
  const isMobileSmall = useMediaQuery("(max-width: 380px)");
  const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(filter.searchTerm || "");
  const debouncedSearchTerm = useDebounce(searchTerm, 300); // 300ms debounce delay
  
  // Add custom CSS for very small screens
  useEffect(() => {
    const style = document.createElement('style');
    style.innerHTML = `
      @media (max-width: 430px) {
        .mobile-filter-grid {
          display: grid !important;
          grid-template-columns: 1fr 1fr !important;
          gap: 0.5rem !important;
        }
        .mobile-filter-grid > * {
          width: 100% !important;
          min-width: 0 !important;
          max-width: none !important;
          flex: 1 1 auto !important;
        }
      }
      
      @media (max-width: 380px) {
        .filter-text {
          font-size: 0.75rem !important;
        }
        .filter-input {
          font-size: 0.75rem !important;
        }
        .filter-label {
          font-size: 0.7rem !important;
        }
        .filter-button {
          font-size: 0.75rem !important;
          padding-left: 0.5rem !important;
          padding-right: 0.5rem !important;
        }
      }
      
      @media (max-width: 320px) {
        .filter-text {
          font-size: 0.7rem !important;
        }
        .filter-input {
          font-size: 0.7rem !important;
        }
        .filter-label {
          font-size: 0.65rem !important;
        }
        .filter-button {
          font-size: 0.7rem !important;
          padding-left: 0.35rem !important;
          padding-right: 0.35rem !important;
        }
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
  // Fetch filter options from API with proper types
  const { data: manufacturers = [] } = useQuery<any[]>({
    queryKey: ["/api/manufacturers"],
  });
  
  const { data: bodyStyles = [] } = useQuery<any[]>({
    queryKey: ["/api/body-styles"],
  });
  
  const { data: driveTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/drive-types"],
  });
  
  const { data: batteryTypes = [] } = useQuery<any[]>({
    queryKey: ["/api/battery-types"],
  });

  // This function is no longer needed as we're using the debounced search
  // We're leaving it here for now in case we need similar functionality elsewhere

  // Handle sorting change
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({ sortBy: e.target.value as VehicleFilter["sortBy"], page: 1 });
  };

  // Handle manufacturer selection
  const handleManufacturerSelect = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
    e.stopPropagation();
    const newManufacturerIds = filter.manufacturerIds ? [...filter.manufacturerIds] : [];
    
    if (newManufacturerIds.includes(id)) {
      const index = newManufacturerIds.indexOf(id);
      newManufacturerIds.splice(index, 1);
    } else {
      newManufacturerIds.push(id);
    }
    
    onFilterChange({ manufacturerIds: newManufacturerIds.length > 0 ? newManufacturerIds : undefined, page: 1 });
  };

  // Handle body style selection
  const handleBodyStyleSelect = (e: React.MouseEvent<HTMLDivElement>, id: number) => {
    e.stopPropagation();
    const newBodyStyleIds = filter.bodyStyleIds ? [...filter.bodyStyleIds] : [];
    
    if (newBodyStyleIds.includes(id)) {
      const index = newBodyStyleIds.indexOf(id);
      newBodyStyleIds.splice(index, 1);
    } else {
      newBodyStyleIds.push(id);
    }
    
    onFilterChange({ bodyStyleIds: newBodyStyleIds.length > 0 ? newBodyStyleIds : undefined, page: 1 });
  };

  // Handle drive type selection
  const handleDriveTypeSelect = (id: number) => {
    const newDriveTypeIds = filter.driveTypeIds ? [...filter.driveTypeIds] : [];
    
    if (newDriveTypeIds.includes(id)) {
      const index = newDriveTypeIds.indexOf(id);
      newDriveTypeIds.splice(index, 1);
    } else {
      newDriveTypeIds.push(id);
    }
    
    onFilterChange({ driveTypeIds: newDriveTypeIds.length > 0 ? newDriveTypeIds : undefined, page: 1 });
  };

  // Handle battery type selection
  const handleBatteryTypeSelect = (id: number) => {
    const newBatteryTypeIds = filter.batteryTypeIds ? [...filter.batteryTypeIds] : [];
    
    if (newBatteryTypeIds.includes(id)) {
      const index = newBatteryTypeIds.indexOf(id);
      newBatteryTypeIds.splice(index, 1);
    } else {
      newBatteryTypeIds.push(id);
    }
    
    onFilterChange({ batteryTypeIds: newBatteryTypeIds.length > 0 ? newBatteryTypeIds : undefined, page: 1 });
  };

  // Handle V2L support filter
  const handleV2LSupportChange = (checked: boolean) => {
    onFilterChange({ v2lSupport: checked ? true : undefined, page: 1 });
  };

  const [isManufacturerMenuOpen, setIsManufacturerMenuOpen] = useState(false);
  const [isBodyStyleMenuOpen, setIsBodyStyleMenuOpen] = useState(false);
  
  // Refs for dropdown containers
  const manufacturerDropdownRef = useRef<HTMLDivElement>(null);
  const bodyStyleDropdownRef = useRef<HTMLDivElement>(null);
  const mobileManufacturerModalRef = useRef<HTMLDivElement>(null);
  const mobileMoreFiltersModalRef = useRef<HTMLDivElement>(null);
  
  // Handle click outside to close dropdowns
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // For desktop view
      if (!isMobile) {
        // Close manufacturer dropdown if clicked outside
        if (isManufacturerMenuOpen && 
            manufacturerDropdownRef.current && 
            !manufacturerDropdownRef.current.contains(event.target as Node)) {
          setIsManufacturerMenuOpen(false);
        }
        
        // Close body style dropdown if clicked outside
        if (isBodyStyleMenuOpen && 
            bodyStyleDropdownRef.current && 
            !bodyStyleDropdownRef.current.contains(event.target as Node)) {
          setIsBodyStyleMenuOpen(false);
        }
      }
      
      // For mobile view
      if (isMobile) {
        // Check if the click was outside the mobile manufacturer modal content
        if (isManufacturerMenuOpen && 
            mobileManufacturerModalRef.current && 
            !mobileManufacturerModalRef.current.contains(event.target as Node) &&
            event.target instanceof Element &&
            event.target.classList.contains('fixed')) {
          setIsManufacturerMenuOpen(false);
        }
        
        // Check if the click was outside the mobile more filters modal content
        if (isMoreFiltersOpen && 
            mobileMoreFiltersModalRef.current && 
            !mobileMoreFiltersModalRef.current.contains(event.target as Node) &&
            event.target instanceof Element &&
            event.target.classList.contains('fixed')) {
          setIsMoreFiltersOpen(false);
        }
      }
    }
    
    // Add event listener when dropdowns are open
    if (isManufacturerMenuOpen || isBodyStyleMenuOpen || isMoreFiltersOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    // Clean up
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isManufacturerMenuOpen, isBodyStyleMenuOpen, isMoreFiltersOpen, isMobile]);

  // Apply debounced search term when it changes
  useEffect(() => {
    // Only trigger a filter change if the debounced value is different from the current filter
    if (debouncedSearchTerm !== filter.searchTerm) {
      const newSearchTerm = debouncedSearchTerm.trim() === "" ? undefined : debouncedSearchTerm;
      onFilterChange({ searchTerm: newSearchTerm, page: 1 });
    }
  }, [debouncedSearchTerm, filter.searchTerm]); // Removed onFilterChange from dependency array to prevent infinite loop

  return (
    <div className="bg-card rounded-lg shadow mb-8">
      {/* Mobile Filter Display */}
      {isMobile && (
        <div className="p-4 space-y-4">
          <div className="flex justify-between items-center mobile-filter-grid">
            <div>
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-background text-sm font-medium text-foreground font-styreneA hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent filter-button filter-text"
                onClick={() => setIsManufacturerMenuOpen(!isManufacturerMenuOpen)}
              >
                <span className="filter-text">Manufacturer</span>
                <ChevronDown className={`ml-2 h-5 w-5 text-gray-400 transition-transform ${isManufacturerMenuOpen ? 'transform rotate-180' : ''}`} />
              </button>
            </div>
            <div>
              <button
                type="button"
                className="w-full flex justify-between items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm bg-background text-sm font-medium text-foreground font-styreneA hover:bg-muted/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent filter-button filter-text"
                onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
              >
                <span className="filter-text">More Filters</span>
                <div className="flex items-center">
                  <FilterIcon className="h-5 w-5 text-gray-400" />
                  <ChevronDown className={`ml-1 h-4 w-4 text-gray-400 transition-transform ${isMoreFiltersOpen ? 'transform rotate-180' : ''}`} />
                </div>
              </button>
            </div>
          </div>
          
          {/* Search and Sort in one row */}
          <div className="flex items-center gap-2 mobile-filter-grid">
            {/* Search */}
            <div className="flex items-center border border-border rounded-md px-3 h-10">
              <Search className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="ml-2 block w-full bg-transparent border-0 focus:outline-none focus:ring-0 sm:text-sm font-styreneA h-full py-2 filter-input text-ellipsis"
                placeholder="Search cars"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm("");
                    onFilterChange({ searchTerm: undefined, page: 1 });
                  }}
                  className="text-muted-foreground hover:text-foreground flex-shrink-0"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            
            {/* Sort */}
            <select
              value={filter.sortBy}
              onChange={handleSortChange}
              className="pl-3 pr-7 py-2 text-sm border-border focus:outline-none focus:ring-accent focus:border-accent rounded-md font-styreneA bg-background text-foreground h-10 filter-input"
            >
              <option value="popular">Most Viewed</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="range_high">Range: Highest First</option>
              <option value="battery_high">Battery: Highest First</option>
              <option value="efficiency">Efficiency: Best First</option>
              <option value="acceleration">Acceleration: Fastest First</option>
              <option value="horsepower">Horsepower: Highest First</option>
              <option value="torque">Torque: Highest First</option>
            </select>
          </div>
          
          {/* Mobile view spacing */}
          <div className="my-3"></div>
          
          {/* Manufacturer Filter Popup (Mobile) */}
          {isManufacturerMenuOpen && (
            <div className="fixed inset-0 bg-background/80 z-50 flex flex-col justify-center items-center overflow-hidden">
              <div ref={mobileManufacturerModalRef} className="bg-card rounded-lg shadow-xl w-full max-w-xs mx-auto max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-border px-4 py-3 sticky top-0 bg-card z-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Manufacturers</h3>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setIsManufacturerMenuOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1 p-4">
                  <div className="grid grid-cols-2 gap-2">
                    {/* Sort manufacturers alphabetically */}
                    {manufacturers?.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((mfr: any) => (
                      <div
                        key={mfr.id}
                        className="flex items-center px-2 py-2 hover:bg-muted/50 cursor-pointer rounded"
                        onClick={(e) => handleManufacturerSelect(e, mfr.id)}
                      >
                        <div className={`h-4 w-4 rounded border ${
                          filter.manufacturerIds?.includes(mfr.id) 
                          ? 'bg-accent border-accent/80' 
                          : 'bg-white border-border'
                        } flex items-center justify-center`}>
                          {filter.manufacturerIds?.includes(mfr.id) && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <label className="ml-2 text-sm text-foreground truncate font-styreneA filter-label">{mfr.name}</label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border-t border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent font-styreneA"
                    onClick={() => setIsManufacturerMenuOpen(false)}
                  >
                    <CheckIcon className="mr-2 h-5 w-5" />
                    Apply Selection
                  </button>
                </div>
              </div>
            </div>
          )}
          
          {/* More Filters (Mobile) */}
          {isMoreFiltersOpen && (
            <div className="fixed inset-0 bg-background/80 z-50 flex flex-col justify-center items-center overflow-hidden">
              <div ref={mobileMoreFiltersModalRef} className="bg-card rounded-lg shadow-xl w-full max-w-xs mx-auto max-h-[80vh] flex flex-col">
                <div className="flex justify-between items-center border-b border-border px-4 py-3 sticky top-0 bg-card z-10">
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Filters</h3>
                  <button
                    type="button"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => setIsMoreFiltersOpen(false)}
                  >
                    <span className="sr-only">Close</span>
                    <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="overflow-y-auto flex-1">
                  <div className="px-4 py-3">
                    {/* Body Style Filters */}
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-2 font-styreneA">Body Style</h4>
                      <div className="grid grid-cols-2 gap-2">
                        {bodyStyles?.map((style: any) => (
                          <div
                            key={style.id}
                            className="flex items-center"
                            onClick={(e) => handleBodyStyleSelect(e, style.id)}
                          >
                            <div className={`h-4 w-4 rounded border ${
                              filter.bodyStyleIds?.includes(style.id) 
                              ? 'bg-accent border-accent/80' 
                              : 'bg-white border-border'
                            } flex items-center justify-center`}>
                              {filter.bodyStyleIds?.includes(style.id) && (
                                <CheckIcon className="h-3 w-3 text-white" />
                              )}
                            </div>
                            <label className="ml-2 text-sm text-foreground font-styreneA">{style.name}</label>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    {/* Price Range */}
                    <div className="mb-4">
                      <DualRangeSlider
                        min={5}
                        max={250}
                        initialMin={filter.minPrice || 5}
                        initialMax={filter.maxPrice || 250}
                        step={5}
                        unit="L"
                        label="Price Range (₹ Lakh/Crore)"
                        onChange={({ min, max }) => {
                          onFilterChange({
                            minPrice: min,
                            maxPrice: max === 250 ? undefined : max,
                            page: 1
                          });
                        }}
                      />
                    </div>
                    
                    {/* Range */}
                    <div className="mb-4">
                      <DualRangeSlider
                        min={0}
                        max={1000}
                        initialMin={filter.minRange || 0}
                        initialMax={filter.maxRange || 1000}
                        step={25}
                        unit="km"
                        label="Real-World Range (km)"
                        onChange={({ min, max }) => {
                          onFilterChange({
                            minRange: min === 0 ? undefined : min,
                            maxRange: max === 1000 ? undefined : max,
                            page: 1
                          });
                        }}
                      />
                    </div>
                    
                    {/* More Advanced Filters */}
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-3">Advanced Filters</h4>
                      
                      {/* Drive Type */}
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-muted-foreground mb-2 font-styreneA">Drive Type</h5>
                        <div className="flex flex-wrap gap-2">
                          {driveTypes?.map((type: any) => (
                            <label key={type.id} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={filter.driveTypeIds?.includes(type.id) || false}
                                onChange={() => handleDriveTypeSelect(type.id)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="ml-1 text-sm text-gray-700">{type.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* Battery Type */}
                      <div className="mb-4">
                        <h5 className="text-xs font-medium text-muted-foreground mb-2 font-styreneA">Battery Chemistry</h5>
                        <div className="flex flex-wrap gap-2">
                          {batteryTypes?.map((type: any) => (
                            <label key={type.id} className="inline-flex items-center">
                              <input
                                type="checkbox"
                                checked={filter.batteryTypeIds?.includes(type.id) || false}
                                onChange={() => handleBatteryTypeSelect(type.id)}
                                className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                              />
                              <span className="ml-1 text-sm text-gray-700">{type.name}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      
                      {/* V2L Support */}
                      <div className="mb-4">
                        <label className="inline-flex items-center">
                          <input
                            type="checkbox"
                            checked={filter.v2lSupport || false}
                            onChange={(e) => handleV2LSupportChange(e.target.checked)}
                            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Vehicle-to-Load (V2L) Support</span>
                        </label>
                      </div>
                      
                      {/* Additional Sliders */}
                      <div className="mb-4">
                        <DualRangeSlider
                          min={2}
                          max={25}
                          initialMin={filter.minAcceleration || 2}
                          initialMax={filter.maxAcceleration || 25}
                          step={0.1}
                          unit="s"
                          label="Acceleration (0-100 km/h)"
                          onChange={({ min, max }) => {
                            onFilterChange({
                              minAcceleration: min === 2 ? undefined : min,
                              maxAcceleration: max === 25 ? undefined : max,
                              page: 1
                            });
                          }}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <DualRangeSlider
                          min={0}
                          max={300}
                          initialMin={filter.minFastCharging || 0}
                          initialMax={filter.maxFastCharging || 300}
                          step={10}
                          unit="kW"
                          label="Fast Charging"
                          onChange={({ min, max }) => {
                            onFilterChange({
                              minFastCharging: min === 0 ? undefined : min,
                              maxFastCharging: max === 300 ? undefined : max,
                              page: 1
                            });
                          }}
                        />
                      </div>
                      
                      <div className="mb-4">
                        <DualRangeSlider
                          min={5}
                          max={200}
                          initialMin={filter.minBatteryCapacity || 5}
                          initialMax={filter.maxBatteryCapacity || 200}
                          step={5}
                          unit="kWh"
                          label="Battery Capacity"
                          onChange={({ min, max }) => {
                            onFilterChange({
                              minBatteryCapacity: min === 5 ? undefined : min,
                              maxBatteryCapacity: max === 200 ? undefined : max,
                              page: 1
                            });
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* "Apply" button for mobile filters
                    This is a dummy button since filters are applied automatically as users interact with them
                    However, users expect an apply button for closing the filter modal, so we provide this
                    for better UX even though it only closes the modal */}
                <div className="border-t border-gray-200 px-4 py-3">
                  <button
                    type="button"
                    className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-black hover:bg-black/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-accent font-styreneA"
                    onClick={() => setIsMoreFiltersOpen(false)}
                  >
                    <CheckIcon className="mr-2 h-5 w-5" />
                    Apply Filters
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Desktop Filter Display */}
      {!isMobile && (
        <div className="p-6">
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Manufacturer Filter */}
            <div>
              <label htmlFor="manufacturer" className="block text-sm font-medium text-gray-700 mb-1">
                Manufacturer
              </label>
              <div className="relative" ref={manufacturerDropdownRef}>
                <button
                  type="button"
                  id="manufacturer"
                  className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  onClick={() => setIsManufacturerMenuOpen(!isManufacturerMenuOpen)}
                >
                  <span className="block truncate">
                    {filter.manufacturerIds && filter.manufacturerIds.length > 0
                      ? `${filter.manufacturerIds.length} selected`
                      : "All Manufacturers"}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isManufacturerMenuOpen ? 'transform rotate-180' : ''}`} />
                  </span>
                </button>
                
                {isManufacturerMenuOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-72 rounded-md py-2 px-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    <div className="grid grid-cols-2 gap-1">
                      {/* Sort manufacturers alphabetically */}
                      {manufacturers?.sort((a: any, b: any) => a.name.localeCompare(b.name)).map((mfr: any) => (
                        <div
                          key={mfr.id}
                          className="flex items-center px-3 py-1.5 hover:bg-gray-100 cursor-pointer rounded"
                          onClick={(e) => handleManufacturerSelect(e, mfr.id)}
                        >
                          <div className={`h-4 w-4 rounded border ${
                            filter.manufacturerIds?.includes(mfr.id) 
                            ? 'bg-blue-500 border-blue-600' 
                            : 'bg-white border-gray-300'
                          } flex items-center justify-center`}>
                            {filter.manufacturerIds?.includes(mfr.id) && (
                              <CheckIcon className="h-3 w-3 text-white" />
                            )}
                          </div>
                          <label className="ml-2 block text-sm text-gray-700 truncate">{mfr.name}</label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Body Style Filter */}
            <div>
              <label htmlFor="bodyStyle" className="block text-sm font-medium text-gray-700 mb-1">
                Body Style
              </label>
              <div className="relative" ref={bodyStyleDropdownRef}>
                <button
                  type="button"
                  id="bodyStyle"
                  className="bg-white relative w-full border border-gray-300 rounded-md shadow-sm pl-3 pr-10 py-2 text-left cursor-default focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                  onClick={() => setIsBodyStyleMenuOpen(!isBodyStyleMenuOpen)}
                >
                  <span className="block truncate">
                    {filter.bodyStyleIds && filter.bodyStyleIds.length > 0
                      ? `${filter.bodyStyleIds.length} selected`
                      : "All Body Styles"}
                  </span>
                  <span className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                    <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${isBodyStyleMenuOpen ? 'transform rotate-180' : ''}`} />
                  </span>
                </button>
                
                {isBodyStyleMenuOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {bodyStyles?.map((style: any) => (
                      <div
                        key={style.id}
                        className="flex items-center px-3 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={(e) => handleBodyStyleSelect(e, style.id)}
                      >
                        <div className={`h-4 w-4 rounded border ${
                          filter.bodyStyleIds?.includes(style.id) 
                          ? 'bg-blue-500 border-blue-600' 
                          : 'bg-white border-gray-300'
                        } flex items-center justify-center`}>
                          {filter.bodyStyleIds?.includes(style.id) && (
                            <CheckIcon className="h-3 w-3 text-white" />
                          )}
                        </div>
                        <label className="ml-3 block text-sm text-gray-700">{style.name}</label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-5">
            {/* Price Range Slider */}
            <DualRangeSlider
              min={5}
              max={250}
              initialMin={filter.minPrice || 5}
              initialMax={filter.maxPrice || 250}
              step={5}
              unit="L"
              label="Price Range (₹ Lakh/Crore)"
              onChange={({ min, max }) => {
                // If max is at maximum value (250L), don't set any upper limit
                // If max is below maximum, apply the upper limit
                onFilterChange({
                  minPrice: min,
                  maxPrice: max === 250 ? undefined : max,
                  page: 1
                });
              }}
            />
            
            {/* Range Slider */}
            <DualRangeSlider
              min={0}
              max={1000}
              initialMin={filter.minRange || 0}
              initialMax={filter.maxRange || 1000}
              step={25}
              unit="km"
              label="Real-World Range (km)"
              onChange={({ min, max }) => {
                onFilterChange({
                  minRange: min === 0 ? undefined : min,
                  maxRange: max === 1000 ? undefined : max,
                  page: 1
                });
              }}
            />
          </div>
          
          <div className="flex justify-center mt-6">
            <button
              type="button"
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-primary-500"
              onClick={() => setIsMoreFiltersOpen(!isMoreFiltersOpen)}
            >
              <FilterIcon className="mr-2 h-5 w-5 text-gray-400" />
              More Filters
              {isMoreFiltersOpen ? (
                <ChevronDown className="ml-1 h-4 w-4 transform rotate-180 transition-transform" />
              ) : (
                <ChevronDown className="ml-1 h-4 w-4 transition-transform" />
              )}
            </button>
          </div>

          {/* More Filters (Desktop) */}
          {isMoreFiltersOpen && (
            <div className="mt-6 border-t border-gray-200 pt-6">
              <h3 className="text-sm font-medium text-gray-900 mb-4">Advanced Filters</h3>
              
              <div className="grid grid-cols-3 gap-6">
                <div className="col-span-1">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Drive Type</h4>
                  <div className="space-y-2">
                    {driveTypes?.map((type: any) => (
                      <label key={type.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.driveTypeIds?.includes(type.id) || false}
                          onChange={() => handleDriveTypeSelect(type.id)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="col-span-1 col-start-3">
                  <h4 className="text-xs font-medium text-gray-700 mb-2">Battery Chemistry</h4>
                  <div className="space-y-2">
                    {batteryTypes?.map((type: any) => (
                      <label key={type.id} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={filter.batteryTypeIds?.includes(type.id) || false}
                          onChange={() => handleBatteryTypeSelect(type.id)}
                          className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-700">{type.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="mt-6 space-y-5">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    checked={filter.v2lSupport || false}
                    onChange={(e) => handleV2LSupportChange(e.target.checked)}
                    className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <span className="ml-2 text-sm text-gray-700">Vehicle-to-Load (V2L) Support</span>
                </label>
                
                <DualRangeSlider
                  min={2}
                  max={25}
                  initialMin={filter.minAcceleration || 2}
                  initialMax={filter.maxAcceleration || 25}
                  step={0.1}
                  unit="s"
                  label="Acceleration (0-100 km/h)"
                  onChange={({ min, max }) => {
                    onFilterChange({
                      minAcceleration: min === 2 ? undefined : min,
                      maxAcceleration: max === 25 ? undefined : max,
                      page: 1
                    });
                  }}
                />
                
                <DualRangeSlider
                  min={0}
                  max={300}
                  initialMin={filter.minFastCharging || 0}
                  initialMax={filter.maxFastCharging || 300}
                  step={10}
                  unit="kW"
                  label="Fast Charging"
                  onChange={({ min, max }) => {
                    onFilterChange({
                      minFastCharging: min === 0 ? undefined : min,
                      maxFastCharging: max === 300 ? undefined : max,
                      page: 1
                    });
                  }}
                />
                
                <DualRangeSlider
                  min={5}
                  max={200}
                  initialMin={filter.minBatteryCapacity || 5}
                  initialMax={filter.maxBatteryCapacity || 200}
                  step={5}
                  unit="kWh"
                  label="Battery Capacity"
                  onChange={({ min, max }) => {
                    onFilterChange({
                      minBatteryCapacity: min === 5 ? undefined : min,
                      maxBatteryCapacity: max === 200 ? undefined : max,
                      page: 1
                    });
                  }}
                />
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-3 gap-4 mt-6 items-center">
            <div className="col-span-1">
              <div className="relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="focus:ring-primary-500 focus:border-primary-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  style={{ paddingTop: '0.5rem', paddingBottom: '0.5rem' }}
                  placeholder="Search cars"
                />
                {searchTerm && (
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <button
                      type="button"
                      onClick={() => {
                        setSearchTerm("");
                        onFilterChange({ searchTerm: undefined, page: 1 });
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Empty div to maintain layout structure after removing the results count */}
            <div className="flex-1"></div>
            
            <div className="w-full">
              <select
                value={filter.sortBy}
                onChange={handleSortChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
              >
                <option value="popular">Most Viewed</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
                <option value="range_high">Range: Highest First</option>
                <option value="battery_high">Battery: Highest First</option>
                <option value="efficiency">Efficiency: Best First</option>
                <option value="acceleration">Acceleration: Fastest First</option>
                <option value="horsepower">Horsepower: Highest First</option>
                <option value="torque">Torque: Highest First</option>
              </select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}