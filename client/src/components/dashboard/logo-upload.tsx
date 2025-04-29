import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Upload, X, Check, Image as ImageIcon, Camera } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useQuery, useQueryClient } from '@tanstack/react-query';

// A component to upload and display the company logo
export function LogoUpload() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Fetch the current company settings (including logo)
  const { data: companySettings, isLoading } = useQuery({
    queryKey: ['/api/company-settings'],
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file type",
          description: "Please upload an image file",
          variant: "destructive"
        });
        return;
      }
      
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 2MB",
          variant: "destructive"
        });
        return;
      }

      setUploadedImage(file);
      
      // Create a preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpload = async () => {
    if (!uploadedImage) return;

    try {
      setIsUploading(true);
      
      const formData = new FormData();
      formData.append('logo', uploadedImage);
      
      // Use fetch directly for file uploads instead of apiRequest
      await fetch('/api/company-logo', {
        method: 'POST',
        body: formData,
        // Don't set Content-Type header as it will be set automatically with boundary
      });
      
      // Success
      toast({
        title: "Logo uploaded",
        description: "Company logo has been updated successfully",
        variant: "default"
      });
      
      // Reset state
      setUploadedImage(null);
      setPreviewUrl(null);
      setIsDialogOpen(false);
      
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/company-settings'] });
      
    } catch (error) {
      console.error('Error uploading logo:', error);
      toast({
        title: "Upload failed",
        description: "There was an error uploading the company logo",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = () => {
    setUploadedImage(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex items-center gap-4">
        <Avatar className="h-16 w-16 border-2 border-gray-200">
          <AvatarImage src={companySettings?.logoUrl || ''} alt="Company logo" />
          <AvatarFallback className="bg-primary/10 text-primary text-xl">
            <ImageIcon size={24} />
          </AvatarFallback>
        </Avatar>
        
        <div className="space-y-1">
          <h3 className="text-sm font-medium">Company Logo</h3>
          <p className="text-sm text-muted-foreground">
            Upload your company logo. It will be displayed in the dashboard and reports.
          </p>
        </div>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="w-fit">
            <Upload className="h-4 w-4 mr-2" />
            {companySettings?.logoUrl ? 'Change Logo' : 'Upload Logo'}
          </Button>
        </DialogTrigger>
        
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload Company Logo</DialogTitle>
            <DialogDescription>
              Upload a square image for best results. Maximum file size: 2MB.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="flex flex-col items-center justify-center gap-4">
              <div 
                className="border-2 border-dashed border-gray-300 rounded-md p-8 w-full flex flex-col items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={handleTriggerFileInput}
              >
                {previewUrl ? (
                  <div className="relative w-40 h-40">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-full object-contain rounded-md"
                    />
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveImage();
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <Camera className="h-10 w-10 text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500 text-center">
                      Click to select an image or drag and drop
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      PNG, JPG, GIF up to 2MB
                    </p>
                  </>
                )}
                
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end gap-3">
            <Button 
              variant="outline" 
              onClick={() => setIsDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!uploadedImage || isUploading}
              className="gap-2"
            >
              {isUploading ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}