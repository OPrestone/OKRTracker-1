import { useQuery } from "@tanstack/react-query";
import { useLocation, useRouter } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, PlusCircle, Check } from "lucide-react";
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
import { useState, useEffect, useCallback } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BuildingIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import CreateTenantDialog from "./create-tenant-dialog";

export type Tenant = {
  id: number;
  name: string;
  displayName: string;
  slug: string;
  userRole: string;
  isDefault?: boolean;
  plan?: string;
  status?: string;
};

export default function TenantSwitcher() {
  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [, navigate] = useRouter();
  const [location] = useLocation();

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });
  
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  
  // Find the current tenant based on URL path
  const getCurrentTenant = () => {
    if (!tenants || tenants.length === 0) return null;
    
    // If the path includes /tenants/{slug}, extract the slug
    const match = location.match(/\/tenants\/([^/]+)/);
    if (match) {
      const urlSlug = match[1];
      const matchedTenant = tenants.find(t => t.slug === urlSlug);
      if (matchedTenant) return matchedTenant;
    }
    
    // Otherwise, return default tenant or first one
    const defaultTenant = tenants.find(t => t.isDefault) || tenants[0];
    return defaultTenant;
  };

  // Update selected tenant when tenants data is loaded or location changes
  useEffect(() => {
    if (tenants && tenants.length > 0) {
      setSelectedTenant(getCurrentTenant());
    }
  }, [tenants, location]);

  const onTenantSelect = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setOpen(false);
    
    // If already on a tenant page, replace the tenant slug in the path
    if (location.startsWith('/tenants/')) {
      const newPath = location.replace(/\/tenants\/[^/]+/, `/tenants/${tenant.slug}`);
      navigate(newPath);
    } else {
      // Otherwise navigate to the tenant detail page
      navigate(`/tenants/${tenant.slug}`);
    }
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            aria-label="Select organization"
            className="w-full justify-between bg-slate-800/70 border-slate-700 text-white hover:bg-slate-700 hover:text-white"
          >
            {isLoading ? (
              <Skeleton className="h-5 w-[120px]" />
            ) : selectedTenant ? (
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 bg-slate-700">
                  <AvatarFallback className="text-xs text-slate-300">
                    {selectedTenant.displayName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate">{selectedTenant.displayName}</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <BuildingIcon className="h-4 w-4" />
                <span>Select organization</span>
              </div>
            )}
            {open ? (
              <ChevronUp className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            ) : (
              <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[240px] p-0">
          <Command>
            <CommandList>
              <CommandInput placeholder="Search organization..." />
              <CommandEmpty>No organization found.</CommandEmpty>
              {isLoading ? (
                <div className="p-2 space-y-2">
                  <Skeleton className="h-8 w-full" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <CommandGroup>
                  {tenants?.map((tenant) => (
                    <CommandItem
                      key={tenant.id}
                      onSelect={() => onTenantSelect(tenant)}
                      className="text-sm flex items-center gap-2"
                    >
                      <Avatar className="h-5 w-5 bg-slate-700">
                        <AvatarFallback className="text-xs text-slate-300">
                          {tenant.displayName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <span>{tenant.displayName}</span>
                      {tenant.id === selectedTenant?.id && (
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
                <CommandItem
                  onSelect={() => {
                    setOpen(false);
                    setCreateTenantOpen(true);
                  }}
                  className="cursor-pointer"
                >
                  <PlusCircle className="mr-2 h-5 w-5" />
                  Create Organization
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      
      <CreateTenantDialog 
        open={createTenantOpen} 
        onOpenChange={setCreateTenantOpen} 
      />
    </>
  );
}