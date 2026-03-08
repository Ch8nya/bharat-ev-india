import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types based on database schema
type CarModel = {
  id: number;
  modelName: string;
  manufacturerId: number;
  bodyStyleId: number;
  manufacturerName?: string;
};

type DriveType = {
  id: number;
  name: string;
};

type BatteryType = {
  id: number;
  name: string;
};

type RangeRatingSystem = {
  id: number;
  name: string;
};

type Vehicle = {
  id: number;
  modelId: number;
  variantName: string;
  driveTypeId: number | null;
  batteryTypeId: number | null;
  batteryCapacity: number | null;
  usableBatteryCapacity: number | null;
  batteryWarrantyYears: number | null;
  batteryWarrantyKm: number | null;
  officialRange: number | null;
  rangeRatingId: number | null;
  realWorldRange: number | null;
  efficiency: number | null;
  horsepower: number | null;
  torque: number | null;
  acceleration: number | null;
  topSpeed: number | null;
  fastChargingCapacity: number | null;
  fastChargingTime: number | null;
  weight: number | null;
  v2lSupport: boolean;
  v2lOutputPower: number | null;
  price: number | null;
};

// Reference data for dropdowns
type ReferenceData = {
  manufacturers: any[];
  bodyStyles: any[];
  driveTypes: DriveType[];
  batteryTypes: BatteryType[];
  chargingPortLocations: any[];
  rangeRatingSystems: RangeRatingSystem[];
  carModels?: CarModel[];
};

// Form validation schema
const vehicleFormSchema = z.object({
  modelId: z.string().min(1, "Car model is required"),
  variantName: z.string().min(1, "Variant name is required"),
  driveTypeId: z.string().optional(),
  batteryTypeId: z.string().optional(),
  batteryCapacity: z.string().optional(),
  usableBatteryCapacity: z.string().optional(),
  batteryWarrantyYears: z.string().optional(),
  batteryWarrantyKm: z.string().optional(),
  officialRange: z.string().optional(),
  rangeRatingId: z.string().optional(),
  realWorldRange: z.string().optional(),
  efficiency: z.string().optional(),
  horsepower: z.string().optional(),
  torque: z.string().optional(),
  acceleration: z.string().optional(),
  topSpeed: z.string().optional(),
  fastChargingCapacity: z.string().optional(),
  fastChargingTime: z.string().optional(),
  weight: z.string().optional(),
  v2lSupport: z.boolean().default(false),
  v2lOutputPower: z.string().optional(),
  price: z.string().optional(),
});

type VehicleFormValues = z.infer<typeof vehicleFormSchema>;

export function VehicleList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const { toast } = useToast();

  // Fetch vehicles
  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['/api/admin/vehicles'],
    select: (data) => data as Vehicle[],
  });

  // Fetch car models
  const { data: carModels } = useQuery({
    queryKey: ['/api/admin/car-models'],
    select: (data) => data as CarModel[],
  });

  // Fetch reference data for dropdowns
  const { data: referenceData } = useQuery({
    queryKey: ['/api/admin/reference-data'],
    select: (data) => data as ReferenceData,
  });

  // Form setup for adding/editing
  const form = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: {
      modelId: "",
      variantName: "",
      driveTypeId: "",
      batteryTypeId: "",
      batteryCapacity: "",
      usableBatteryCapacity: "",
      batteryWarrantyYears: "",
      batteryWarrantyKm: "",
      officialRange: "",
      rangeRatingId: "",
      realWorldRange: "",
      efficiency: "",
      horsepower: "",
      torque: "",
      acceleration: "",
      topSpeed: "",
      fastChargingCapacity: "",
      fastChargingTime: "",
      weight: "",
      v2lSupport: false,
      v2lOutputPower: "",
      price: "",
    }
  });

  // Create vehicle mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => 
      apiRequest({
        url: '/api/admin/vehicles',
        method: 'POST',
        body: JSON.stringify(data),
        headers: {
          'Content-Type': 'application/json'
        },
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle variant added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles'] });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add vehicle variant",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Delete vehicle mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({
        url: `/api/admin/vehicles/${id}`,
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Vehicle variant deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/vehicles'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete vehicle variant",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  const onSubmit = (data: VehicleFormValues) => {
    // Convert form data to appropriate types for API
    const vehicleData = {
      modelId: parseInt(data.modelId),
      variantName: data.variantName,
      driveTypeId: data.driveTypeId ? parseInt(data.driveTypeId) : null,
      batteryTypeId: data.batteryTypeId ? parseInt(data.batteryTypeId) : null,
      batteryCapacity: data.batteryCapacity ? parseFloat(data.batteryCapacity) : null,
      usableBatteryCapacity: data.usableBatteryCapacity ? parseFloat(data.usableBatteryCapacity) : null,
      batteryWarrantyYears: data.batteryWarrantyYears ? parseInt(data.batteryWarrantyYears) : null,
      batteryWarrantyKm: data.batteryWarrantyKm ? parseInt(data.batteryWarrantyKm) : null,
      officialRange: data.officialRange ? parseInt(data.officialRange) : null,
      rangeRatingId: data.rangeRatingId ? parseInt(data.rangeRatingId) : null,
      realWorldRange: data.realWorldRange ? parseInt(data.realWorldRange) : null,
      efficiency: data.efficiency ? parseFloat(data.efficiency) : null,
      horsepower: data.horsepower ? parseInt(data.horsepower) : null,
      torque: data.torque ? parseInt(data.torque) : null,
      acceleration: data.acceleration ? parseFloat(data.acceleration) : null,
      topSpeed: data.topSpeed ? parseInt(data.topSpeed) : null,
      fastChargingCapacity: data.fastChargingCapacity ? parseInt(data.fastChargingCapacity) : null,
      fastChargingTime: data.fastChargingTime ? parseInt(data.fastChargingTime) : null,
      weight: data.weight ? parseInt(data.weight) : null,
      v2lSupport: data.v2lSupport,
      v2lOutputPower: data.v2lOutputPower ? parseInt(data.v2lOutputPower) : null,
      price: data.price ? parseFloat(data.price) : null,
    };
    
    createMutation.mutate(vehicleData);
  };

  const confirmDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedVehicle) {
      deleteMutation.mutate(selectedVehicle.id);
    }
  };

  // Helper function to get model name
  const getModelName = (id: number) => {
    const model = carModels?.find(m => m.id === id);
    return model ? model.modelName : 'Unknown';
  };

  // Helper function to get manufacturer name from model ID
  const getManufacturerForModel = (modelId: number) => {
    const model = carModels?.find(m => m.id === modelId);
    if (!model) return 'Unknown';
    
    const manufacturer = referenceData?.manufacturers.find(m => m.id === model.manufacturerId);
    return manufacturer ? manufacturer.name : 'Unknown';
  };

  // Helper function to get battery type name
  const getBatteryTypeName = (id: number | null) => {
    if (!id) return 'N/A';
    const batteryType = referenceData?.batteryTypes.find(b => b.id === id);
    return batteryType ? batteryType.name : 'Unknown';
  };

  // Helper function to get drive type name
  const getDriveTypeName = (id: number | null) => {
    if (!id) return 'N/A';
    const driveType = referenceData?.driveTypes.find(d => d.id === id);
    return driveType ? driveType.name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Vehicle Variants</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Vehicle Variant
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Vehicle Variant</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Car model selection */}
                  <FormField
                    control={form.control}
                    name="modelId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Car Model</FormLabel>
                        <Select 
                          onValueChange={field.onChange} 
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select car model" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {carModels?.map((model) => (
                              <SelectItem 
                                key={model.id} 
                                value={model.id.toString()}
                              >
                                {getManufacturerForModel(model.id)} {model.modelName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Variant name */}
                  <FormField
                    control={form.control}
                    name="variantName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Variant Name</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Prime Plus" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Battery Section */}
                <div className="bg-muted/50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Battery Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Battery Type */}
                    <FormField
                      control={form.control}
                      name="batteryTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battery Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select battery type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {referenceData?.batteryTypes.map((type) => (
                                <SelectItem 
                                  key={type.id} 
                                  value={type.id.toString()}
                                >
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Drive Type */}
                    <FormField
                      control={form.control}
                      name="driveTypeId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Drive Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select drive type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {referenceData?.driveTypes.map((type) => (
                                <SelectItem 
                                  key={type.id} 
                                  value={type.id.toString()}
                                >
                                  {type.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Battery Capacity */}
                    <FormField
                      control={form.control}
                      name="batteryCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Battery Capacity (kWh)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              step="0.1"
                              placeholder="e.g., 40.5" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Usable Battery Capacity */}
                    <FormField
                      control={form.control}
                      name="usableBatteryCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usable Capacity (kWh)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              placeholder="e.g., 37.4" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Battery Warranty Years */}
                    <FormField
                      control={form.control}
                      name="batteryWarrantyYears"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty (Years)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 8" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Battery Warranty Kilometers */}
                    <FormField
                      control={form.control}
                      name="batteryWarrantyKm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Warranty (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 160000" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Range Section */}
                <div className="bg-muted/50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Range & Efficiency</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Official Range */}
                    <FormField
                      control={form.control}
                      name="officialRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Official Range (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 465" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Range Rating System */}
                    <FormField
                      control={form.control}
                      name="rangeRatingId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Range Rating System</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select rating system" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="null">None</SelectItem>
                              {referenceData?.rangeRatingSystems.map((system) => (
                                <SelectItem 
                                  key={system.id} 
                                  value={system.id.toString()}
                                >
                                  {system.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Real-world Range */}
                    <FormField
                      control={form.control}
                      name="realWorldRange"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Real-world Range (km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 380" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Efficiency */}
                    <FormField
                      control={form.control}
                      name="efficiency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Efficiency (Wh/km)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              placeholder="e.g., 160.5" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Performance Section */}
                <div className="bg-muted/50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Performance</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Horsepower */}
                    <FormField
                      control={form.control}
                      name="horsepower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Horsepower (BHP)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 148" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Torque */}
                    <FormField
                      control={form.control}
                      name="torque"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Torque (Nm)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 245" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Acceleration */}
                    <FormField
                      control={form.control}
                      name="acceleration"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>0-100 km/h (sec)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number"
                              step="0.1"
                              placeholder="e.g., 8.9" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Top Speed */}
                    <FormField
                      control={form.control}
                      name="topSpeed"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Top Speed (km/h)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 160" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Weight */}
                  <FormField
                    control={form.control}
                    name="weight"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Weight (kg)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 1650" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Charging Section */}
                <div className="bg-muted/50 p-4 rounded-md space-y-4">
                  <h3 className="font-medium">Charging & Features</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Fast Charging Capacity */}
                    <FormField
                      control={form.control}
                      name="fastChargingCapacity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fast Charging (kW)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 100" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Fast Charging Time */}
                    <FormField
                      control={form.control}
                      name="fastChargingTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>10-80% Charging (min)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 35" 
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* V2L Support */}
                    <FormField
                      control={form.control}
                      name="v2lSupport"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Vehicle-to-Load (V2L)</FormLabel>
                          </div>
                          <FormControl>
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                        </FormItem>
                      )}
                    />

                    {/* V2L Output Power */}
                    <FormField
                      control={form.control}
                      name="v2lOutputPower"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>V2L Output Power (watts)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g., 3600" 
                              {...field} 
                              disabled={!form.watch("v2lSupport")}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Price */}
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Price (₹ lakhs)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number"
                          step="0.01"
                          placeholder="e.g., 14.99" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Vehicle Variant'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading vehicles...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Model</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Battery</TableHead>
                <TableHead>Range</TableHead>
                <TableHead>Price (₹ lakhs)</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {vehicles && vehicles.length > 0 ? (
                vehicles.map((vehicle) => (
                  <TableRow key={vehicle.id}>
                    <TableCell>{vehicle.id}</TableCell>
                    <TableCell>{getModelName(vehicle.modelId)}</TableCell>
                    <TableCell>{vehicle.variantName}</TableCell>
                    <TableCell>
                      {vehicle.batteryCapacity ? `${vehicle.batteryCapacity} kWh` : 'N/A'} 
                      {vehicle.batteryTypeId ? ` (${getBatteryTypeName(vehicle.batteryTypeId)})` : ''}
                    </TableCell>
                    <TableCell>
                      {vehicle.officialRange ? `${vehicle.officialRange} km` : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {vehicle.price ? vehicle.price.toFixed(2) : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(vehicle)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center">
                    No vehicles found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete {getModelName(selectedVehicle?.modelId || 0)} {selectedVehicle?.variantName}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={handleDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}