import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { VehicleFilter, VehicleWithDetails } from "@shared/types";
import FilterSection from "@/components/filter-section";
import VehicleCard from "@/components/vehicle-card";
import Pagination from "@/components/pagination";
import { useToast } from "@/hooks/use-toast";
import { useUrlFilters } from "@/hooks/use-url-filters";
import styles from "../components/desktop-styles.module.css";
import Meta from "@/components/meta";

export default function Home() {
  const { toast } = useToast();
  // Use the URL filters hook to manage filter state with URL persistence
  const { filter, setFilter } = useUrlFilters({
    page: 1,
    perPage: 10,
    sortBy: "popular",
  });

  // Fetch vehicles with filter
  const { data: vehiclesData, isLoading, isError } = useQuery({
    queryKey: ["/api/vehicles", filter],
    queryFn: async () => {
      // Convert filter to query params
      const params = new URLSearchParams();
      Object.entries(filter).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            value.forEach((v) => params.append(`${key}[]`, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
      
      const res = await fetch(`/api/vehicles?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Failed to fetch vehicles");
      }
      return res.json();
    },
  });

  // Handle filter changes
  const handleFilterChange = (newFilter: Partial<VehicleFilter>) => {
    setFilter(newFilter);
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setFilter({ page });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Show error toast if query fails
  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load vehicles. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  // Use matchMedia for more reliable screen size detection
  const isDesktop = typeof window !== 'undefined' && window.matchMedia("(min-width: 1280px)").matches;
  
  // Apply desktop container class only on desktop screens
  const containerClassName = isDesktop 
    ? `w-full px-4 md:w-3/5 mx-auto py-8 ${styles.desktopContainer}` 
    : "w-full px-4 md:w-3/5 mx-auto py-8";

  // Create schema.org markup for listing page
  const createSchemaMarkup = () => {
    const hostname = window.location.origin;
    
    const schemaData: any = {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "name": "BharatEV - Electric Vehicles in India",
      "description": "Browse, filter, estimate range and compare detailed specifications of all EVs available in the Indian market.",
      "url": hostname,
      "publisher": {
        "@type": "Organization",
        "name": "BharatEV",
        "logo": {
          "@type": "ImageObject",
          "url": `${hostname}/logo.png`
        }
      },
      "about": {
        "@type": "Thing",
        "name": "Electric Vehicles in India"
      }
    };
    
    if (vehiclesData?.data?.length > 0) {
      schemaData.mainEntity = {
        "@type": "ItemList",
        "itemListElement": vehiclesData.data.map((vehicle: VehicleWithDetails, index: number) => ({
          "@type": "ListItem",
          "position": index + 1,
          "url": `${hostname}/vehicles/${vehicle.id}`,
          "item": {
            "@type": "Vehicle",
            "name": `${vehicle.manufacturerName} ${vehicle.modelName} ${vehicle.variantName}`,
            "manufacturer": {
              "@type": "Organization",
              "name": vehicle.manufacturerName
            }
          }
        }))
      };
    }
    
    return (
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    );
  };

  return (
    <main className={containerClassName}>
      <Meta
        title="BharatEV - Electric Vehicles in India | Compare and Find Your Perfect EV"
        description="India's most comprehensive electric vehicle database with real-world range estimates, detailed specifications and comparisons of all EVs in the Indian market."
        keywords="Electric Vehicles India, EV database India, EV comparison, EV range estimator, Electric Cars India"
        ogType="website"
        ogImage={`${window.location.origin}/logo.png`}
        ogUrl={window.location.origin}
      />
      {createSchemaMarkup()}
      {/* Page Title */}
      <div className="border-b border-border pb-5 mb-6">
        <h1 className="text-3xl font-medium leading-tight text-primary font-styreneB">All Electric Vehicles in India</h1>
        <p className="mt-2 text-base text-muted-foreground font-tiempos">
          Browse, filter, estimate range and compare detailed specifications of all EVs available in the Indian market!
        </p>
      </div>

      {/* Container for both filter and results */}
      <div className="bg-card rounded-lg shadow-md overflow-hidden">
        {/* Filter Section */}
        <div className="border-b border-gray-200">
          <FilterSection
            filter={filter}
            totalResults={vehiclesData?.pagination?.total || 0}
            onFilterChange={handleFilterChange}
          />
        </div>

        {/* Results count - visual connection between filter and results */}
        <div className="py-3 px-6 bg-muted border-b border-border flex justify-center items-center">
          <div className="text-sm font-medium text-foreground text-center font-styreneA">
            <span>{vehiclesData?.pagination?.total || 0}</span> results found
          </div>
        </div>

        {/* Results Section - Slightly inset with subtle shadow */}
        <div className="bg-background p-4">
          {/* Loading State */}
          {isLoading && (
            <div className="my-12 flex justify-center">
              <div className="animate-pulse flex flex-col items-center">
                <div className="rounded-full bg-muted h-12 w-12 mb-4"></div>
                <div className="h-4 bg-muted rounded w-24 mb-2.5"></div>
                <div className="h-3 bg-muted rounded w-36"></div>
              </div>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="my-8 text-center">
              <div className="bg-destructive/10 p-6 rounded-lg shadow-inner">
                <h3 className="text-lg font-medium text-destructive font-styreneA">Failed to load vehicles</h3>
                <p className="mt-2 text-sm text-destructive/80 font-tiempos">
                  There was an error loading the vehicle listings. Please try again later.
                </p>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!isLoading && !isError && vehiclesData?.data?.length === 0 && (
            <div className="my-8 text-center">
              <div className="bg-card p-6 rounded-lg shadow-inner">
                <h3 className="text-lg font-medium text-primary font-styreneA">No vehicles found</h3>
                <p className="mt-2 text-sm text-muted-foreground font-tiempos">
                  No electric vehicles match your current filter criteria. Try adjusting your filters.
                </p>
              </div>
            </div>
          )}

          {/* Vehicle Listings */}
          {!isLoading && !isError && vehiclesData?.data?.length > 0 && (
            <div className="space-y-4 my-4">
              {vehiclesData.data.map((vehicle: VehicleWithDetails) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!isLoading && !isError && vehiclesData?.data?.length > 0 && (
            <div className="mt-6 pb-2">
              <Pagination
                currentPage={vehiclesData.pagination.page}
                totalPages={vehiclesData.pagination.totalPages}
                perPage={vehiclesData.pagination.perPage}
                total={vehiclesData.pagination.total}
                onPageChange={handlePageChange}
              />
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
