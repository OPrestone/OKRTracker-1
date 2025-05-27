import { useState } from "react";
import { useLocation } from "wouter";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tenant } from "@/hooks/use-tenant-context";
import { useTenantContext } from "@/hooks/use-tenant-context";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Check, 
  ChevronRight, 
  Loader2,
  Star,
} from "lucide-react";

interface TenantSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenants: Array<Tenant & { userRole?: string }>;
}

export function TenantSelectionModal({ 
  isOpen, 
  onClose, 
  tenants 
}: TenantSelectionModalProps) {
  const [isLoading, setIsLoading] = useState<string | null>(null);
  const { switchTenant } = useTenantContext();
  const [, navigate] = useLocation();

  if (!tenants || tenants.length === 0) {
    return null;
  }

  // Select and navigate to a tenant
  const handleSelectTenant = (tenant: Tenant) => {
    setIsLoading(tenant.id);
    switchTenant(tenant);
    // Add a small delay before redirecting
    setTimeout(() => {
      window.location.href = "/";
      onClose();
    }, 500);
  };

  // Role badges with appropriate colors
  const getRoleBadge = (role?: string) => {
    if (!role) return null;
    
    const variants: Record<string, string> = {
      'owner': 'bg-amber-100 text-amber-800 border-amber-200',
      'admin': 'bg-indigo-100 text-indigo-800 border-indigo-200',
      'member': 'bg-sky-100 text-sky-800 border-sky-200',
    };
    
    return (
      <Badge className={`font-normal ${variants[role] || 'bg-gray-100 text-gray-800'}`}>
        {role.charAt(0).toUpperCase() + role.slice(1)}
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <Building2 className="h-5 w-5 mr-2 text-primary" />
            Select an Organization
          </DialogTitle>
          <DialogDescription>
            Choose an organization to work with
          </DialogDescription>
        </DialogHeader>
        
        <div className="mt-4 space-y-3 max-h-[60vh] overflow-y-auto pr-1">
          {tenants.map((tenant) => (
            <Card 
              key={tenant.id} 
              className={`cursor-pointer relative transition-all duration-200 hover:border-primary/50 hover:shadow-md ${tenant.isDefault ? 'border-primary/50 shadow-sm' : ''}`}
              onClick={() => handleSelectTenant(tenant)}
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg flex items-center">
                    {tenant.display_name || tenant.name}
                    {tenant.isDefault && (
                      <Star className="h-4 w-4 ml-2 text-amber-500 fill-amber-500" />
                    )}
                  </CardTitle>
                  {getRoleBadge(tenant.userRole)}
                </div>
                <CardDescription className="text-sm">
                  {tenant.slug}
                </CardDescription>
              </CardHeader>
              <CardFooter className="border-t bg-muted/30 pt-2 pb-2 flex justify-between">
                {isLoading === tenant.id ? (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Loader2 className="h-3.5 w-3.5 mr-2 animate-spin" />
                    Loading...
                  </div>
                ) : (
                  <div className="flex items-center text-muted-foreground text-sm">
                    <Check className="h-3.5 w-3.5 mr-2" />
                    {tenant.isDefault ? 'Default organization' : 'Select this organization'}
                  </div>
                )}
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardFooter>
            </Card>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}