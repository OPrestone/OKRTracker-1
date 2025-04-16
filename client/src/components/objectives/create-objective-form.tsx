import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { 
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { PlusCircle, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertObjectiveSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import z from "zod";

interface TimeframeType {
  id: number;
  name: string;
}

interface TeamType {
  id: number;
  name: string;
}

interface UserType {
  id: number;
  firstName: string;
  lastName: string;
}

const objectiveFormSchema = insertObjectiveSchema.extend({
  level: z.enum(["company", "department", "team", "individual"]),
});

type ObjectiveFormValues = z.infer<typeof objectiveFormSchema>;

type KeyResultFormValues = {
  title: string;
  description?: string;
  targetValue?: string;
  startValue?: string;
}

interface CreateObjectiveFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CreateObjectiveForm({ onSuccess, onCancel }: CreateObjectiveFormProps) {
  const { toast } = useToast();
  const [keyResults, setKeyResults] = useState<KeyResultFormValues[]>([
    { title: "", description: "", targetValue: "", startValue: "" }
  ]);

  // Fetch necessary data for the form
  const { data: users = [] } = useQuery<UserType[]>({
    queryKey: ["/api/users"],
  });

  const { data: teams = [] } = useQuery<TeamType[]>({
    queryKey: ["/api/teams"],
  });

  const { data: timeframes = [] } = useQuery<TimeframeType[]>({
    queryKey: ["/api/timeframes"],
  });

  // Form setup
  const form = useForm<ObjectiveFormValues>({
    resolver: zodResolver(objectiveFormSchema),
    defaultValues: {
      title: "",
      description: "",
      level: "individual",
      ownerId: 1, // Default to the current user
      teamId: null,
      timeframeId: 1, // Default to the first timeframe 
      status: "not_started",
      parentId: null
    },
  });

  // Handle key result updates
  const addKeyResult = () => {
    setKeyResults([...keyResults, { title: "", description: "", targetValue: "", startValue: "" }]);
  };

  const removeKeyResult = (index: number) => {
    if (keyResults.length > 1) {
      setKeyResults(keyResults.filter((_, i) => i !== index));
    }
  };

  const updateKeyResult = (index: number, field: keyof KeyResultFormValues, value: string) => {
    const updatedKeyResults = [...keyResults];
    updatedKeyResults[index] = { ...updatedKeyResults[index], [field]: value };
    setKeyResults(updatedKeyResults);
  };

  // Handle creating objective
  const createObjectiveMutation = useMutation({
    mutationFn: async (data: ObjectiveFormValues) => {
      const res = await apiRequest("POST", "/api/objectives", data);
      return await res.json();
    },
    onSuccess: async (objective) => {
      // Create key results
      const validKeyResults = keyResults.filter(kr => kr.title.trim() !== "");
      
      for (const keyResult of validKeyResults) {
        await apiRequest("POST", "/api/key-results", {
          ...keyResult,
          objectiveId: objective.id,
          status: "not_started"
        });
      }
      
      toast({
        title: "Objective Created",
        description: "Your objective has been created successfully.",
      });
      
      queryClient.invalidateQueries({ queryKey: ['/api/objectives'] });
      
      if (onSuccess) {
        onSuccess();
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create objective",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ObjectiveFormValues) => {
    createObjectiveMutation.mutate(data);
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Objective Title</FormLabel>
              <FormControl>
                <Input 
                  placeholder="Enter objective title" 
                  {...field} 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea 
                  placeholder="Enter a detailed description" 
                  onChange={field.onChange}
                  value={field.value || ""}
                  name={field.name}
                  ref={field.ref}
                  onBlur={field.onBlur}
                  disabled={field.disabled}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Level</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="department">Department</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="individual">Individual</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="timeframeId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timeframe</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timeframe" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {timeframes.map((timeframe) => (
                      <SelectItem 
                        key={timeframe.id} 
                        value={timeframe.id.toString()}
                      >
                        {timeframe.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ownerId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Owner</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(parseInt(value))}
                  defaultValue={field.value?.toString()}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select owner" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {users.map((user) => (
                      <SelectItem 
                        key={user.id} 
                        value={user.id.toString()}
                      >
                        {user.firstName} {user.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="teamId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Team</FormLabel>
                <Select
                  onValueChange={(value) => 
                    field.onChange(value === "null" ? null : parseInt(value))
                  }
                  defaultValue={field.value?.toString() || "null"}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select team" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="null">No Team</SelectItem>
                    {teams.map((team) => (
                      <SelectItem 
                        key={team.id} 
                        value={team.id.toString()}
                      >
                        {team.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Key Results</h3>
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={addKeyResult}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Key Result
            </Button>
          </div>
          
          {keyResults.map((keyResult, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-medium">Key Result #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeKeyResult(index)}
                  disabled={keyResults.length <= 1}
                >
                  <Trash2 className="h-4 w-4 text-gray-500" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor={`kr-title-${index}`} className="text-sm font-medium">
                    Title
                  </label>
                  <Input
                    id={`kr-title-${index}`}
                    placeholder="Enter key result title"
                    value={keyResult.title}
                    onChange={(e) => updateKeyResult(index, "title", e.target.value)}
                  />
                </div>
                
                <div className="grid w-full items-center gap-1.5">
                  <label htmlFor={`kr-description-${index}`} className="text-sm font-medium">
                    Description
                  </label>
                  <Textarea
                    id={`kr-description-${index}`}
                    placeholder="Enter description"
                    value={keyResult.description}
                    onChange={(e) => updateKeyResult(index, "description", e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor={`kr-start-${index}`} className="text-sm font-medium">
                      Start Value
                    </label>
                    <Input
                      id={`kr-start-${index}`}
                      placeholder="e.g., 0, 50%, 1000"
                      value={keyResult.startValue}
                      onChange={(e) => updateKeyResult(index, "startValue", e.target.value)}
                    />
                  </div>
                  
                  <div className="grid w-full items-center gap-1.5">
                    <label htmlFor={`kr-target-${index}`} className="text-sm font-medium">
                      Target Value
                    </label>
                    <Input
                      id={`kr-target-${index}`}
                      placeholder="e.g., 100%, $10000"
                      value={keyResult.targetValue}
                      onChange={(e) => updateKeyResult(index, "targetValue", e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end space-x-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={createObjectiveMutation.isPending}
          >
            {createObjectiveMutation.isPending ? "Creating..." : "Create Objective"}
          </Button>
        </div>
      </form>
    </Form>
  );
}