import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ManufacturerList } from "../components/admin/manufacturer-list";
import { CarModelList } from "../components/admin/car-model-list";
import { VehicleList } from "../components/admin/vehicle-list";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowLeft } from "lucide-react";

export default function AdminPage() {
  return (
    <div className="container mx-auto py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
          <p className="text-muted-foreground">
            Manage EV database content
          </p>
        </div>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Site
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Database Management</CardTitle>
          <CardDescription>
            Add, edit, or remove items from the EV database
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="manufacturers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="manufacturers">Manufacturers</TabsTrigger>
              <TabsTrigger value="models">Car Models</TabsTrigger>
              <TabsTrigger value="vehicles">Vehicles/Variants</TabsTrigger>
            </TabsList>
            <TabsContent value="manufacturers" className="mt-6">
              <ManufacturerList />
            </TabsContent>
            <TabsContent value="models" className="mt-6">
              <CarModelList />
            </TabsContent>
            <TabsContent value="vehicles" className="mt-6">
              <VehicleList />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}