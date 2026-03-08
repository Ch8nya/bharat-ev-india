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
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Trash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Create a type for manufacturers based on API response
type Manufacturer = {
  id: number;
  name: string;
  country: string;
};

// Form validation schema
const manufacturerFormSchema = z.object({
  name: z.string().min(1, "Manufacturer name is required"),
  country: z.string().min(1, "Country is required"),
});

type ManufacturerFormValues = z.infer<typeof manufacturerFormSchema>;

export function ManufacturerList() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedManufacturer, setSelectedManufacturer] = useState<Manufacturer | null>(null);
  const { toast } = useToast();

  // Fetch manufacturers
  const { data: manufacturers, isLoading } = useQuery({
    queryKey: ['/api/admin/manufacturers'],
    select: (data) => data as Manufacturer[],
  });

  // Form setup for adding/editing
  const form = useForm<ManufacturerFormValues>({
    resolver: zodResolver(manufacturerFormSchema),
    defaultValues: {
      name: "",
      country: ""
    }
  });

  // Create manufacturer mutation
  const createMutation = useMutation({
    mutationFn: (data: ManufacturerFormValues) => 
      apiRequest({
        url: '/api/admin/manufacturers',
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manufacturer added successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manufacturers'] });
      form.reset();
      setIsAddDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to add manufacturer",
        variant: "destructive",
      });
      console.error(error);
    }
  });
  
  // Delete manufacturer mutation
  const deleteMutation = useMutation({
    mutationFn: (id: number) => 
      apiRequest({
        url: `/api/admin/manufacturers/${id}`,
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Manufacturer deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/manufacturers'] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: "Failed to delete manufacturer. It may be referenced by car models.",
        variant: "destructive",
      });
      console.error(error);
    }
  });

  const onSubmit = (data: ManufacturerFormValues) => {
    createMutation.mutate(data);
  };

  const confirmDelete = (manufacturer: Manufacturer) => {
    setSelectedManufacturer(manufacturer);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    if (selectedManufacturer) {
      deleteMutation.mutate(selectedManufacturer.id);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Manufacturers</h2>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Manufacturer
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Manufacturer</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Manufacturer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Tata Motors" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Country</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., India" {...field} />
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
                    {createMutation.isPending ? 'Adding...' : 'Add Manufacturer'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div>Loading manufacturers...</div>
      ) : (
        <div className="border rounded-md">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Country</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {manufacturers && manufacturers.length > 0 ? (
                manufacturers.map((manufacturer) => (
                  <TableRow key={manufacturer.id}>
                    <TableCell>{manufacturer.id}</TableCell>
                    <TableCell>{manufacturer.name}</TableCell>
                    <TableCell>{manufacturer.country}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => confirmDelete(manufacturer)}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    No manufacturers found
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
            Are you sure you want to delete {selectedManufacturer?.name}? This action cannot be undone.
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