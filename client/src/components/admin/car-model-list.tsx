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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash, Image } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Types based on database schema
type Manufacturer = {
  id: number;
  name: string;
  country: string;
};

type BodyStyle = {
  id: number;
  name: string;
};

type ChargingPortLocation = {
  id: number;
  location: string;
};

type CarModel = {
  id: number;
  modelName: string;
  manufacturerId: number;
  bodyStyleId: number;
  chargingPortLocationId: number | null;
  image: string | null;
  bootSpace: number | null;
  manufacturingStartYear: number;
  manufacturingEndYear: number | null;
  viewCount: number;
};

// Reference data for dropdowns
type ReferenceData = {
  manufacturers: Manufacturer[];
  bodyStyles: BodyStyle[];
  chargingPortLocations: ChargingPortLocation[];
};

// Form validation schema
const carModelFormSchema = z.object({
  modelName: z.string().min(1, "Model name is required"),
  manufacturerId: z.string().min(1, "Manufacturer is required"),
  bodyStyleId: z.string().min(1, "Body style is required"),
  chargingPortLocationId: z.string().optional(),
  bootSpace: z.string().optional(),
  manufacturingStartYear: z.string().min(1, "Start year is required"),
  manufacturingEndYear: z.string().optional(),
});

type CarModelFormValues = z.infer<typeof carModelFormSchema>;

export function CarModelList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCarModel, setSelectedCarModel] = useState<CarModel | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const { toast } = useToast();

  // Fetch car models
  const { data: carModels, isLoading } = useQuery({
    queryKey: ['/api/admin/car-models'],
    select: (data) => data as CarModel[],
  });

  // Fetch reference data for dropdowns
  const { data: referenceData } = useQuery({
    queryKey: ['/api/admin/reference-data'],
    select: (data) => data as ReferenceData,
  });

  // Form setup for adding/editing
  const form = useForm<CarModelFormValues>({
    resolver: zodResolver(carModelFormSchema),
    defaultValues: {
      modelName: "",
      manufacturerId: "",
      bodyStyleId: "",
      chargingPortLocationId: "",
      bootSpace: "",
      manufacturingStartYear: new Date().getFullYear().toString(),
      manufacturingEndYear: "",
    }
  });

  // Create car model mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => 
      apiRequest({
        url: '/api/admin/car-models',
        method: 'POST',
        body: data,
        // Don't set Content-Type here, it will be set automatically for FormData
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Car model added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/car-models'] });
      form.reset();
      setSelectedImage(null);
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add car model",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Delete car model mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest(`/api/admin/car-models/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Car model deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/car-models'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete car model. It may be referenced by vehicles.",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  const onSubmit = (data: CarModelFormValues) => {
    const formData = new FormData();
    
    // Add form fields to FormData
    formData.append('modelName', data.modelName);
    formData.append('manufacturerId', data.manufacturerId);
    formData.append('bodyStyleId', data.bodyStyleId);
    formData.append('manufacturingStartYear', data.manufacturingStartYear);
    
    if (data.chargingPortLocationId) {
      formData.append('chargingPortLocationId', data.chargingPortLocationId);
    }
    
    if (data.bootSpace) {
      formData.append('bootSpace', data.bootSpace);
    }
    
    if (data.manufacturingEndYear) {
      formData.append('manufacturingEndYear', data.manufacturingEndYear);
    }
    
    // Add image if selected
    if (selectedImage) {
      formData.append('image', selectedImage);
    }
    
    createMutation.mutate(formData);
  };

  const confirmDelete = (carModel: CarModel) => {
    setSelectedCarModel(carModel);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedCarModel) {
      deleteMutation.mutate(selectedCarModel.id);
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedImage(e.target.files[0]);
    }
  };

  // Helper function to get manufacturer name
  const getManufacturerName = (id: number) => {
    const manufacturer = referenceData?.manufacturers.find(m => m.id === id);
    return manufacturer ? manufacturer.name : 'Unknown';
  };

  // Helper function to get body style name
  const getBodyStyleName = (id: number) => {
    const bodyStyle = referenceData?.bodyStyles.find(b => b.id === id);
    return bodyStyle ? bodyStyle.name : 'Unknown';
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Car Models</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Car Model
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Car Model</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                {/* Manufacturer selection */}
                <FormField
                  control={form.control}
                  name="manufacturerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select manufacturer" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {referenceData?.manufacturers.map((manufacturer) => (
                            <SelectItem 
                              key={manufacturer.id} 
                              value={manufacturer.id.toString()}
                            >
                              {manufacturer.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Model name */}
                <FormField
                  control={form.control}
                  name="modelName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Model Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Nexon EV" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Body style */}
                <FormField
                  control={form.control}
                  name="bodyStyleId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Body Style</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select body style" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {referenceData?.bodyStyles.map((bodyStyle) => (
                            <SelectItem 
                              key={bodyStyle.id} 
                              value={bodyStyle.id.toString()}
                            >
                              {bodyStyle.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Charging port location */}
                <FormField
                  control={form.control}
                  name="chargingPortLocationId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Charging Port Location</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select location (optional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="null">None</SelectItem>
                          {referenceData?.chargingPortLocations.map((location) => (
                            <SelectItem 
                              key={location.id} 
                              value={location.id.toString()}
                            >
                              {location.location}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Boot space */}
                <FormField
                  control={form.control}
                  name="bootSpace"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Boot Space (liters)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="e.g., 350" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Manufacturing years */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="manufacturingStartYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Year</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 2023" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="manufacturingEndYear"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>End Year (optional)</FormLabel>
                        <FormControl>
                          <Input 
                            type="number" 
                            placeholder="e.g., 2024" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Image upload */}
                <div className="space-y-2">
                  <FormLabel>Model Image</FormLabel>
                  <div className="flex items-center gap-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => document.getElementById('image-upload')?.click()}
                    >
                      <Image className="mr-2 h-4 w-4" />
                      Select Image
                    </Button>
                    <Input 
                      id="image-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageChange}
                    />
                    {selectedImage && (
                      <span className="text-sm text-muted-foreground">
                        {selectedImage.name}
                      </span>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending}
                  >
                    {createMutation.isPending ? 'Adding...' : 'Add Car Model'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading car models...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Model Name</TableHead>
                <TableHead>Manufacturer</TableHead>
                <TableHead>Body Style</TableHead>
                <TableHead>Years</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {carModels && carModels.length > 0 ? (
                carModels.map((carModel) => (
                  <TableRow key={carModel.id}>
                    <TableCell>{carModel.id}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {carModel.image && (
                          <img 
                            src={carModel.image} 
                            alt={carModel.modelName} 
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        {carModel.modelName}
                      </div>
                    </TableCell>
                    <TableCell>{getManufacturerName(carModel.manufacturerId)}</TableCell>
                    <TableCell>{getBodyStyleName(carModel.bodyStyleId)}</TableCell>
                    <TableCell>
                      {carModel.manufacturingStartYear} 
                      {carModel.manufacturingEndYear ? ` - ${carModel.manufacturingEndYear}` : ' - Present'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(carModel)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No car models found
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
            Are you sure you want to delete {selectedCarModel?.modelName}? This action cannot be undone.
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