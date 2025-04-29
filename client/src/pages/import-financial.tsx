import { apiRequest, queryClient } from "@/lib/queryClient";
import { formatDate } from "@/lib/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { CalendarIcon, Link2, Upload } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useLocation } from "wouter";
import { z } from "zod";
import DashboardLayout from "@/layouts/dashboard-layout";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
        Card,
        CardContent,
        CardDescription,
        CardFooter,
        CardHeader,
        CardTitle,
} from "@/components/ui/card";
import {
        Form,
        FormControl,
        FormDescription,
        FormField,
        FormItem,
        FormLabel,
        FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
        Popover,
        PopoverContent,
        PopoverTrigger,
} from "@/components/ui/popover";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Create custom zod schema for form validation
const formSchema = z.object({
        date: z.date({
                required_error: "Please select a date for this financial data.",
        }),
        objectiveId: z
                .string()
                .optional()
                .transform((val) => (val && val !== "none" ? parseInt(val) : null)),
        revenue: z
                .string()
                .optional()
                .transform((val) => (val ? parseFloat(val) : null)),
        cost: z
                .string()
                .optional()
                .transform((val) => (val ? parseFloat(val) : null)),
        ebitda: z
                .string()
                .optional()
                .transform((val) => (val ? parseFloat(val) : null)),
        profitAfterTaxMargin: z
                .string()
                .optional()
                .transform((val) => (val ? parseFloat(val) : null)),
        cumulativeAudience: z
                .string()
                .optional()
                .transform((val) => (val ? parseInt(val) : null)),
        notes: z.string().optional(),
        source: z.string().optional(),
        uploadedById: z.number().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export default function ImportFinancial() {
        const [isSubmitting, setIsSubmitting] = useState(false);
        const [_, navigate] = useLocation();
        const { toast } = useToast();

        // Get objectives for mapping
        const { data: objectives = [] } = useQuery({
                queryKey: ["/api/objectives"],
        });

        // Set up form with default values
        const form = useForm<FormValues>({
                resolver: zodResolver(formSchema),
                defaultValues: {
                        date: new Date(),
                        revenue: "",
                        cost: "",
                        ebitda: "",
                        profitAfterTaxMargin: "",
                        cumulativeAudience: "",
                        notes: "",
                        uploadedById: 1, // Current user ID
                },
        });

        // Create mutation for submitting form
        const mutation = useMutation({
                mutationFn: async (data: FormValues) => {
                        return apiRequest("POST", "/api/financial-data", data);
                },
                onSuccess: () => {
                        toast({
                                title: "Financial data imported",
                                description: "Your financial data has been successfully imported.",
                                variant: "default",
                        });
                        queryClient.invalidateQueries({ queryKey: ["/api/financial-data"] });
                        form.reset();
                        setIsSubmitting(false);
                },
                onError: (error) => {
                        console.error("Error submitting financial data:", error);
                        toast({
                                title: "Error",
                                description: "Failed to import financial data. Please try again.",
                                variant: "destructive",
                        });
                        setIsSubmitting(false);
                },
        });

        function onSubmit(data: FormValues) {
                setIsSubmitting(true);
                mutation.mutate(data);
        }

        // Function to handle file upload
        function handleFileUpload(event: React.ChangeEvent<HTMLInputElement>) {
                const file = event.target.files?.[0];
                if (!file) return;

                // In a real implementation, we would parse the file (CSV, Excel) here
                // and populate the form with the data

                toast({
                        title: "File Upload",
                        description: "File upload feature is not implemented in this demo.",
                });
        }

        return (
                <DashboardLayout title="Import Financial Data" subtitle="Import financial metrics to track against your objectives and key results">
                    <div className="container mx-auto py-8">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="md:col-span-2">
                                        <Card>
                                                <CardHeader>
                                                        <CardTitle>Manual Input</CardTitle>
                                                        <CardDescription>
                                                                Enter financial data manually to track against your objectives
                                                        </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                        <Form {...form}>
                                                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                {/* Date Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="date"
                                                                                        render={({ field }) => (
                                                                                                <FormItem className="flex flex-col">
                                                                                                        <FormLabel>Date</FormLabel>
                                                                                                        <Popover>
                                                                                                                <PopoverTrigger asChild>
                                                                                                                        <FormControl>
                                                                                                                                <Button
                                                                                                                                        variant={"outline"}
                                                                                                                                        className={cn(
                                                                                                                                                "pl-3 text-left font-normal",
                                                                                                                                                !field.value && "text-muted-foreground"
                                                                                                                                        )}
                                                                                                                                >
                                                                                                                                        {field.value ? (
                                                                                                                                                formatDate(field.value)
                                                                                                                                        ) : (
                                                                                                                                                <span>Pick a date</span>
                                                                                                                                        )}
                                                                                                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                                                                                                </Button>
                                                                                                                        </FormControl>
                                                                                                                </PopoverTrigger>
                                                                                                                <PopoverContent className="w-auto p-0" align="start">
                                                                                                                        <Calendar
                                                                                                                                mode="single"
                                                                                                                                selected={field.value}
                                                                                                                                onSelect={field.onChange}
                                                                                                                                disabled={(date) =>
                                                                                                                                        date > new Date() || date < new Date("1900-01-01")
                                                                                                                                }
                                                                                                                                initialFocus
                                                                                                                        />
                                                                                                                </PopoverContent>
                                                                                                        </Popover>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />

                                                                                {/* Objective Mapping Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="objectiveId"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>Map to Objective</FormLabel>
                                                                                                        <Select
                                                                                                                onValueChange={field.onChange}
                                                                                                                defaultValue={field.value?.toString()}
                                                                                                        >
                                                                                                                <FormControl>
                                                                                                                        <SelectTrigger>
                                                                                                                                <SelectValue placeholder="Select an objective" />
                                                                                                                        </SelectTrigger>
                                                                                                                </FormControl>
                                                                                                                <SelectContent>
                                                                                                                        <SelectItem value="none">None</SelectItem>
                                                                                                                        {objectives.map((objective: any) => (
                                                                                                                                <SelectItem key={objective.id} value={objective.id.toString()}>
                                                                                                                                        {objective.title}
                                                                                                                                </SelectItem>
                                                                                                                        ))}
                                                                                                                </SelectContent>
                                                                                                        </Select>
                                                                                                        <FormDescription>
                                                                                                                Link this data to a specific objective for tracking
                                                                                                        </FormDescription>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                                                {/* Revenue Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="revenue"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>Revenue</FormLabel>
                                                                                                        <FormControl>
                                                                                                                <div className="relative">
                                                                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                                                                                                $
                                                                                                                        </span>
                                                                                                                        <Input
                                                                                                                                type="number"
                                                                                                                                placeholder="0.00"
                                                                                                                                className="pl-7"
                                                                                                                                {...field}
                                                                                                                        />
                                                                                                                </div>
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />

                                                                                {/* Cost Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="cost"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>Cost</FormLabel>
                                                                                                        <FormControl>
                                                                                                                <div className="relative">
                                                                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                                                                                                $
                                                                                                                        </span>
                                                                                                                        <Input
                                                                                                                                type="number"
                                                                                                                                placeholder="0.00"
                                                                                                                                className="pl-7"
                                                                                                                                {...field}
                                                                                                                        />
                                                                                                                </div>
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />

                                                                                {/* EBITDA Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="ebitda"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>EBITDA</FormLabel>
                                                                                                        <FormControl>
                                                                                                                <div className="relative">
                                                                                                                        <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">
                                                                                                                                $
                                                                                                                        </span>
                                                                                                                        <Input
                                                                                                                                type="number"
                                                                                                                                placeholder="0.00"
                                                                                                                                className="pl-7"
                                                                                                                                {...field}
                                                                                                                        />
                                                                                                                </div>
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />
                                                                        </div>

                                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                                {/* Profit After Tax Margin Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="profitAfterTaxMargin"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>Profit After Tax Margin</FormLabel>
                                                                                                        <FormControl>
                                                                                                                <div className="relative">
                                                                                                                        <Input type="number" placeholder="0.00" {...field} />
                                                                                                                        <span className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-500">
                                                                                                                                %
                                                                                                                        </span>
                                                                                                                </div>
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />

                                                                                {/* Cumulative Audience Field */}
                                                                                <FormField
                                                                                        control={form.control}
                                                                                        name="cumulativeAudience"
                                                                                        render={({ field }) => (
                                                                                                <FormItem>
                                                                                                        <FormLabel>Cumulative Audience</FormLabel>
                                                                                                        <FormControl>
                                                                                                                <Input type="number" placeholder="0" {...field} />
                                                                                                        </FormControl>
                                                                                                        <FormMessage />
                                                                                                </FormItem>
                                                                                        )}
                                                                                />
                                                                        </div>

                                                                        {/* Notes Field */}
                                                                        <FormField
                                                                                control={form.control}
                                                                                name="notes"
                                                                                render={({ field }) => (
                                                                                        <FormItem>
                                                                                                <FormLabel>Notes</FormLabel>
                                                                                                <FormControl>
                                                                                                        <Textarea
                                                                                                                placeholder="Add any additional context or information about this data..."
                                                                                                                className="resize-none"
                                                                                                                {...field}
                                                                                                        />
                                                                                                </FormControl>
                                                                                                <FormMessage />
                                                                                        </FormItem>
                                                                                )}
                                                                        />

                                                                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                                                                                {isSubmitting ? "Submitting..." : "Submit Financial Data"}
                                                                        </Button>
                                                                </form>
                                                        </Form>
                                                </CardContent>
                                        </Card>
                                </div>

                                <div>
                                        <Card>
                                                <CardHeader>
                                                        <CardTitle>Bulk Import</CardTitle>
                                                        <CardDescription>
                                                                Import financial data from CSV or Excel files
                                                        </CardDescription>
                                                </CardHeader>
                                                <CardContent className="space-y-6">
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                                                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                                                <div className="mt-4">
                                                                        <label htmlFor="file-upload" className="cursor-pointer">
                                                                                <span className="text-primary font-medium">Click to upload</span>
                                                                                <span className="text-gray-500"> or drag and drop</span>
                                                                                <input
                                                                                        id="file-upload"
                                                                                        name="file-upload"
                                                                                        type="file"
                                                                                        className="sr-only"
                                                                                        onChange={handleFileUpload}
                                                                                        accept=".csv,.xlsx"
                                                                                />
                                                                        </label>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                                CSV or Excel files up to 10MB
                                                                        </p>
                                                                </div>
                                                        </div>

                                                        <div>
                                                                <Button
                                                                        variant="outline"
                                                                        className="w-full flex items-center justify-center"
                                                                >
                                                                        <Link2 className="mr-2 h-4 w-4" />
                                                                        Connect to Data Source
                                                                </Button>
                                                                <p className="text-xs text-gray-500 mt-2 text-center">
                                                                        Connect to external systems for automated data import
                                                                </p>
                                                        </div>
                                                </CardContent>
                                                <CardFooter className="bg-gray-50 border-t rounded-b-lg">
                                                        <div className="text-xs text-gray-500 w-full">
                                                                <h4 className="font-medium text-gray-700 mb-1">
                                                                        Need help importing data?
                                                                </h4>
                                                                <p>
                                                                        Download our{" "}
                                                                        <a href="#" className="text-primary">
                                                                                template file
                                                                        </a>{" "}
                                                                        or check the{" "}
                                                                        <a href="#" className="text-primary">
                                                                                import guide
                                                                        </a>{" "}
                                                                        for help.
                                                                </p>
                                                        </div>
                                                </CardFooter>
                                        </Card>
                                </div>
                        </div>
                    </div>
                </DashboardLayout>
        );
}
