import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { useRoute } from "wouter";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import VehicleSpecItem from "@/components/vehicle-spec-item";
import { 
  RangeEstimatorTab, 
  LongDistanceRatingTab,
  BatteryTab, 
  PerformanceTab, 
  ChargingTab, 
  FeaturesTab 
} from "@/components/vehicle-detail-tabs";
import { Zap, MapPin, Clock, Battery, ChevronLeft, Square, CheckSquare } from "lucide-react";
import { Link } from "wouter";
import { useComparison } from "@/hooks/use-comparison";
import { formatPrice } from "@/lib/filterHelpers";
import Meta from "@/components/meta";

export default function VehicleDetails() {
  const { toast } = useToast();
  const [, params] = useRoute("/vehicles/:id");
  const vehicleId = params?.id ? parseInt(params.id) : 0;
  const { toggleVehicle, isSelected } = useComparison();

  // Fetch vehicle details
  const { data: vehicle, isLoading, isError } = useQuery({
    queryKey: ["/api/vehicles", vehicleId],
    queryFn: async () => {
      const res = await fetch(`/api/vehicles/${vehicleId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch vehicle details");
      }
      return res.json();
    },
    enabled: !!vehicleId,
  });

  useEffect(() => {
    if (isError) {
      toast({
        title: "Error",
        description: "Failed to load vehicle details. Please try again later.",
        variant: "destructive",
      });
    }
  }, [isError, toast]);

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="h-40 bg-gray-200 rounded"></div>
            <div className="h-40 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (isError || !vehicle) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-red-800">Failed to load vehicle details</h3>
          <p className="mt-2 text-sm text-red-700">
            There was an error loading the vehicle details. Please try again later.
          </p>
          <div className="mt-4">
            <button 
              onClick={() => window.history.back()}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Vehicle Listings
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getChargeTime = () => {
    if (vehicle.fastChargingTime) {
      return `${vehicle.fastChargingTime} min (10-80%)`;
    }
    return "N/A";
  };

  const getBatteryWarranty = () => {
    // Check for lifetime warranty (100 years or 10,000,000 km)
    if ((vehicle.batteryWarrantyYears !== null && vehicle.batteryWarrantyYears >= 100) || 
        (vehicle.batteryWarrantyKm !== null && vehicle.batteryWarrantyKm >= 10000000)) {
      return "Lifetime warranty";
    }
    
    // Regular warranty display
    if (vehicle.batteryWarrantyYears && vehicle.batteryWarrantyKm) {
      return `${vehicle.batteryWarrantyYears} years / ${vehicle.batteryWarrantyKm.toLocaleString()} km`;
    } else if (vehicle.batteryWarrantyYears) {
      return `${vehicle.batteryWarrantyYears} years`;
    } else if (vehicle.batteryWarrantyKm) {
      return `${vehicle.batteryWarrantyKm.toLocaleString()} km`;
    }
    return "N/A";
  };

  // Prepare schema.org structured data for this vehicle
  const createSchemaMarkup = () => {
    if (!vehicle) return null;
    
    const hostname = window.location.origin;
    const currentUrl = `${hostname}/vehicles/${vehicle.id}`;
    
    const schemaData = {
      "@context": "https://schema.org/",
      "@type": "Vehicle",
      "name": `${vehicle.manufacturerName} ${vehicle.modelName} ${vehicle.variantName}`,
      "manufacturer": {
        "@type": "Organization",
        "name": vehicle.manufacturerName
      },
      "model": vehicle.modelName,
      "vehicleConfiguration": vehicle.variantName,
      "bodyType": vehicle.bodyStyleName,
      "url": currentUrl,
      "image": vehicle.image,
      "fuelType": "Electricity",
      "driveWheelConfiguration": vehicle.driveTypeName,
      "speed": vehicle.topSpeed ? {
        "@type": "QuantitativeValue",
        "value": vehicle.topSpeed,
        "unitCode": "KMH"
      } : undefined,
      "vehicleSeatingCapacity": vehicle.seatingCapacity,
      "payload": {
        "@type": "QuantitativeValue",
        "value": vehicle.price,
        "unitCode": "INR"
      },
      "fuelEfficiency": vehicle.efficiency ? {
        "@type": "QuantitativeValue",
        "value": vehicle.efficiency,
        "unitCode": "KWH/100KM"
      } : undefined,
      "weightTotal": vehicle.weight ? {
        "@type": "QuantitativeValue",
        "value": vehicle.weight,
        "unitCode": "KGM"
      } : undefined
    };
    
    return (
      <script 
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schemaData) }}
      />
    );
  };

  // Prepare meta tags
  const getMetaTags = () => {
    if (!vehicle) return null;
    
    const hostname = window.location.origin;
    const currentUrl = `${hostname}/vehicles/${vehicle.id}`;
    const title = `${vehicle.manufacturerName} ${vehicle.modelName} ${vehicle.variantName} - BharatEV`;
    const description = `${vehicle.manufacturerName} ${vehicle.modelName} ${vehicle.variantName} - ${vehicle.bodyStyleName} electric vehicle with ${vehicle.realWorldRange || 'N/A'} km real-world range, ${vehicle.batteryCapacity || 'N/A'} kWh battery, and ${vehicle.price ? formatPrice(vehicle.price) : 'N/A'} price.`;
    
    return (
      <Meta
        title={title}
        description={description}
        keywords={`${vehicle.manufacturerName}, ${vehicle.modelName}, Electric Vehicle, EV, India, ${vehicle.bodyStyleName}, Electric Car`}
        ogTitle={title}
        ogDescription={description}
        ogImage={vehicle.image}
        ogUrl={currentUrl}
        ogType="product"
        canonicalUrl={currentUrl}
      />
    );
  };
  
  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {getMetaTags()}
      {createSchemaMarkup()}
      {/* Navigation buttons */}
      <div className="mb-4 flex justify-between items-center">
        <button 
          onClick={() => window.history.back()} 
          className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft className="mr-1 h-4 w-4" />
          Back to all vehicles
        </button>
      </div>

      {/* Vehicle header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="bg-gray-50 px-4 py-5 sm:px-6">
          <div className="flex justify-between">
            <div>
              <h1 className="text-xl md:text-2xl font-semibold text-gray-900">
                {vehicle.manufacturerName} {vehicle.modelName} {vehicle.variantName}
              </h1>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                {vehicle.bodyStyleName} • {vehicle.manufacturingStartYear}
                {vehicle.manufacturingEndYear ? `-${vehicle.manufacturingEndYear}` : ""}
              </p>
            </div>
            <div className="text-right">
              <p className="text-lg md:text-xl font-semibold text-gray-900">
                {formatPrice(vehicle.price)}
              </p>
              <p className="text-sm text-gray-500">Ex-showroom</p>
            </div>
          </div>
        </div>

        {/* Vehicle image and key specs */}
        <div className="sm:flex border-b border-gray-200">
          <div className="sm:w-1/2 bg-gray-100">
            <div className="relative w-full pb-[56.25%]"> {/* 16:9 aspect ratio */}
              <img
                src={vehicle.image || "https://www.svgrepo.com/show/508699/landscape-placeholder.svg"}
                alt={`${vehicle.manufacturerName} ${vehicle.modelName} ${vehicle.variantName}`}
                className="absolute top-0 left-0 w-full h-full object-contain"
              />
            </div>
          </div>
          <div className="sm:w-1/2 p-4 sm:p-6 space-y-6">
            <div>
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-bold text-gray-900">Key Specifications</h4>
                <button
                  onClick={() => vehicle && toggleVehicle(vehicle)}
                  className={`inline-flex items-center px-3 py-1.5 border rounded-md text-sm font-medium 
                    ${isSelected(vehicleId) 
                      ? 'text-white bg-gray-900 border-gray-800 hover:bg-gray-800' 
                      : 'text-gray-900 bg-white border-gray-300 hover:bg-gray-50'
                    }`}
                  aria-label={isSelected(vehicleId) ? "Remove from comparison" : "Add to comparison"}
                >
                  {isSelected(vehicleId) ? (
                    <>
                      <CheckSquare className="mr-1.5 h-4 w-4" />
                      In comparison
                    </>
                  ) : (
                    <>
                      <Square className="mr-1.5 h-4 w-4" />
                      Compare
                    </>
                  )}
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-4">
                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-50 text-primary-700">
                    <Battery className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-bold text-gray-900">Battery</dt>
                    <dd className="mt-1 text-sm text-gray-500">
                      {vehicle.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : "N/A"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-50 text-primary-700">
                    <MapPin className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-bold text-gray-900">Real Range</dt>
                    <dd className="mt-1 text-sm text-gray-500">
                      {vehicle.realWorldRange ? `${vehicle.realWorldRange} km` : "N/A"}
                    </dd>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-50 text-primary-700">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-bold text-gray-900">Fast Charging</dt>
                    <dd className="mt-1 text-sm text-gray-500">{getChargeTime()}</dd>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="flex-shrink-0 h-10 w-10 flex items-center justify-center rounded-md bg-primary-50 text-primary-700">
                    <Clock className="h-6 w-6" />
                  </div>
                  <div className="ml-4">
                    <dt className="text-sm font-bold text-gray-900">0-100 km/h</dt>
                    <dd className="mt-1 text-sm text-gray-500">
                      {vehicle.acceleration ? `${vehicle.acceleration} sec` : "N/A"}
                    </dd>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional space for key specs */}
            <div className="mt-6">
              {/* <p className="text-sm text-gray-500">
                See the tabs below for detailed specifications about battery, charging, and more features.
              </p> */}
            </div>
          </div>
        </div>

        {/* Detailed specifications */}
        <div className="px-4 py-5 sm:p-6">
          {/* Mobile tabs */}
          <div className="sm:hidden">
            <Tabs defaultValue="range-estimator">
              <TabsList className="w-full">
                <TabsTrigger value="range-estimator" className="flex-1 text-xs px-1">Range</TabsTrigger>
                <TabsTrigger value="long-distance" className="flex-1 text-xs px-1">Long Distance</TabsTrigger>
                <TabsTrigger value="battery" className="flex-1 text-xs px-1">Battery</TabsTrigger>
                <TabsTrigger value="charging" className="flex-1 text-xs px-1">Charging</TabsTrigger>
              </TabsList>
              
              <TabsContent value="range-estimator">
                <RangeEstimatorTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="long-distance">
                <LongDistanceRatingTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="battery">
                <BatteryTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="charging">
                <ChargingTab vehicle={vehicle} />
              </TabsContent>
            </Tabs>

            {/* Additional mobile tabs for Features */}
            <Tabs defaultValue="features" className="mt-6">
              <TabsList className="w-full">
                <TabsTrigger value="features" className="flex-1 text-xs px-1">Features</TabsTrigger>
                <TabsTrigger value="performance" className="flex-1 text-xs px-1">Performance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="features">
                <FeaturesTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="performance">
                <PerformanceTab vehicle={vehicle} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Desktop tabs */}
          <div className="hidden sm:block">
            <Tabs defaultValue="range-estimator">
              <div className="border-b border-gray-200">
                <TabsList className="bg-transparent">
                  <TabsTrigger value="range-estimator">Range Estimator</TabsTrigger>
                  <TabsTrigger value="long-distance">Long Distance Rating</TabsTrigger>
                  <TabsTrigger value="battery">Battery</TabsTrigger>
                  <TabsTrigger value="charging">Charging</TabsTrigger>
                  <TabsTrigger value="features">Features</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="range-estimator">
                <RangeEstimatorTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="long-distance">
                <LongDistanceRatingTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="battery">
                <BatteryTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="charging">
                <ChargingTab vehicle={vehicle} />
              </TabsContent>
              
              <TabsContent value="features">
                <FeaturesTab vehicle={vehicle} />
              </TabsContent>
            </Tabs>
          </div>

          {/* Additional information or disclaimer could go here */}
        </div>
      </div>
    </main>
  );
}
