import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, PlusCircle, Check, RefreshCw } from "lucide-react";
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
import { Building as BuildingIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import CreateTenantDialog from "./create-tenant-dialog";
import { useTenantContext, Tenant } from "@/hooks/use-tenant-context";

export default function TenantSwitcher() {
  const [createTenantOpen, setCreateTenantOpen] = useState(false);
  const [open, setOpen] = useState(false);
  const [isSwitching, setIsSwitching] = useState(false);
  const [location] = useLocation();
  const { toast } = useToast();

  // Use the tenant context instead of local state
  const { 
    currentTenant: selectedTenant, 
    switchTenant, 
    isLoading 
  } = useTenantContext();
  
  // Get tenants from the API
  const { data: tenants } = useQuery<Tenant[]>({
    queryKey: ["/api/tenants"],
  });

  const onTenantSelect = useCallback((tenant: Tenant) => {
    setOpen(false);
    setIsSwitching(true);
    
    // Show toast to indicate tenant switch is happening
    toast({
      title: "Switching organization",
      description: `Loading data for ${tenant.displayName}...`,
      duration: 3000,
    });
    
    // Small delay to show loading state before reload
    setTimeout(() => {
      // Use the switchTenant function from context which handles full page reload
      switchTenant(tenant);
    }, 500);
  }, [switchTenant, toast]);

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