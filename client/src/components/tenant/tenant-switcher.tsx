import { useQuery, useMutation } from "@tanstack/react-query";
import { Check, ChevronsUpDown, PlusCircle } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { Dialog, DialogTrigger } from "@/components/ui/dialog";
import { CreateTenantDialog } from "./create-tenant-dialog";

type PopoverTriggerProps = React.ComponentPropsWithoutRef<typeof PopoverTrigger>;

interface TenantSwitcherProps extends PopoverTriggerProps {
  className?: string;
}

export type Tenant = {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  userRole: string;
  isDefault?: boolean;
};

export function TenantSwitcher({ className }: TenantSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [showNewTeamDialog, setShowNewTeamDialog] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  // Fetch the tenants for the current user
  const { data: tenants = [], isLoading: loadingTenants } = useQuery({
    queryKey: ['/api/tenants'],
    enabled: !!user,
  });

  // Fetch the current (default) tenant
  const { data: currentTenant, isLoading: loadingCurrentTenant } = useQuery({
    queryKey: ['/api/tenants/default'],
    enabled: !!user,
  });

  // Mutation to set the default tenant
  const setDefaultTenantMutation = useMutation({
    mutationFn: async (tenantId: number) => {
      const res = await apiRequest("POST", `/api/tenants/${tenantId}/set-default`);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tenants/default'] });
      queryClient.invalidateQueries({ queryKey: ['/api/tenants'] });
      toast({
        title: "Default tenant updated",
        description: "Your default tenant has been updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update default tenant",
        variant: "destructive",
      });
    },
  });

  const handleSelect = (tenant: Tenant) => {
    setDefaultTenantMutation.mutate(tenant.id);
    setOpen(false);
  };

  return (
    <Dialog open={showNewTeamDialog} onOpenChange={setShowNewTeamDialog}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select a tenant"
            className={cn("w-[220px] justify-between", className)}
            disabled={loadingTenants || loadingCurrentTenant}
          >
            {loadingCurrentTenant || !currentTenant ? (
              "Select tenant..."
            ) : (
              <span className="truncate">
                {currentTenant.displayName || currentTenant.name}
              </span>
            )}
            <ChevronsUpDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[220px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search tenant..." />
              <CommandEmpty>No tenant found.</CommandEmpty>
              {tenants.length > 0 && (
                <CommandGroup heading="Organizations">
                  {tenants.map((tenant: Tenant) => (
                    <CommandItem
                      key={tenant.id}
                      onSelect={() => handleSelect(tenant)}
                      className="text-sm"
                    >
                      <span className="truncate">{tenant.displayName || tenant.name}</span>
                      {currentTenant?.id === tenant.id && (
                        <Check className="ml-auto h-4 w-4" />
                      )}
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}
            </CommandList>
            <CommandSeparator />
            <CommandList>
              <CommandGroup>
                <DialogTrigger asChild>
                  <CommandItem
                    onSelect={() => {
                      setOpen(false);
                      setShowNewTeamDialog(true);
                    }}
                  >
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Create Organization
                  </CommandItem>
                </DialogTrigger>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <CreateTenantDialog 
        open={showNewTeamDialog} 
        onOpenChange={setShowNewTeamDialog} 
      />
    </Dialog>
  );
}