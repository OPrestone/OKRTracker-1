import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, FileSpreadsheet, Upload } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";

interface CSVImportProps {
  onImport: (data: any[]) => void;
  templateFields: string[];
  templateName: string;
  maxFileSize?: number; // In MB
}

export function CSVImport({ 
  onImport, 
  templateFields, 
  templateName,
  maxFileSize = 5 // Default to 5MB
}: CSVImportProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate sample CSV content based on template fields
  const sampleCSV = [
    templateFields.join(','),
    templateFields.map(field => {
      if (field.includes('email')) return 'user@example.com';
      if (field.includes('role')) return 'member';
      if (field.includes('name')) return 'John Doe';
      if (field.includes('department')) return 'Marketing';
      return 'example';
    }).join(',')
  ].join('\n');

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  // Handle drag events
  const handleDragOver = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragging(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  // Process the CSV file
  const processFile = (file: File) => {
    // Reset previous errors
    setError(null);

    // Check file type
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      return;
    }

    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      setError(`File size exceeds ${maxFileSize}MB limit`);
      return;
    }

    setIsProcessing(true);
    setProgress(10);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        setProgress(50);
        const text = e.target?.result as string;
        
        // Simple CSV parsing (could be improved with a library for production)
        const rows = text.split(/\r?\n/).filter(row => row.trim());
        const headers = rows[0].split(',').map(header => header.trim());
        
        // Validate headers against template fields
        const missingFields = templateFields.filter(field => 
          !headers.some(header => header.toLowerCase() === field.toLowerCase())
        );

        if (missingFields.length > 0) {
          setError(`Missing required fields: ${missingFields.join(', ')}`);
          setIsProcessing(false);
          setProgress(0);
          return;
        }

        setProgress(75);

        // Parse data rows
        const data = [];
        for (let i = 1; i < rows.length; i++) {
          if (!rows[i].trim()) continue;
          
          const values = rows[i].split(',').map(value => value.trim());
          const rowData: Record<string, string> = {};
          
          headers.forEach((header, index) => {
            const matchingField = templateFields.find(
              field => field.toLowerCase() === header.toLowerCase()
            );
            
            if (matchingField && index < values.length) {
              rowData[matchingField] = values[index];
            }
          });
          
          data.push(rowData);
        }

        setProgress(100);
        
        // Pass the parsed data to the parent component
        onImport(data);
        
        // Reset the file input
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      } catch (err) {
        setError('Error parsing CSV file. Please check the format.');
      } finally {
        setIsProcessing(false);
        setTimeout(() => setProgress(0), 500);
      }
    };

    reader.onerror = () => {
      setError('Error reading file');
      setIsProcessing(false);
      setProgress(0);
    };

    reader.readAsText(file);
  };

  // Handle download sample template
  const downloadSampleTemplate = () => {
    const blob = new Blob([sampleCSV], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${templateName.toLowerCase().replace(/\s+/g, '-')}-template.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* File upload area */}
      <div
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
          ${isDragging ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-primary/50 hover:bg-gray-50'}
          ${isProcessing ? 'pointer-events-none opacity-75' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept=".csv"
          className="hidden"
        />
        
        <div className="mb-4 flex justify-center">
          <div className="rounded-full bg-primary/10 p-3">
            <FileSpreadsheet className="h-6 w-6 text-primary" />
          </div>
        </div>
        
        <div className="space-y-1">
          <p className="font-medium text-gray-800">
            {isProcessing ? 'Processing...' : 'Upload CSV file'}
          </p>
          <p className="text-sm text-gray-500">
            Drag and drop a CSV file here, or click to browse
          </p>
        </div>
        
        {isProcessing && progress > 0 && (
          <div className="mt-4 w-full max-w-xs mx-auto">
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>

      {/* Sample template download */}
      <div className="flex justify-center">
        <Button 
          variant="outline" 
          size="sm"
          onClick={downloadSampleTemplate}
          className="text-xs"
        >
          <FileSpreadsheet className="h-3.5 w-3.5 mr-1" />
          Download Template
        </Button>
      </div>
    </div>
  );
}