import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  FileText, Video, FileArchive, Download, Play, ArrowRight, 
  Bookmark, CheckCircle2, BookOpen
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

// Resource Item Card for the grid
interface ResourceCardProps {
  title: string;
  description: string;
  type: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function ResourceCard({ title, description, type, icon, onClick }: ResourceCardProps) {
  return (
    <Card 
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary-200 h-full flex flex-col"
      onClick={onClick}
    >
      <CardContent className="p-4 flex flex-col h-full">
        <div className="bg-primary-50 text-primary-700 p-4 rounded-lg mb-4 self-start">
          {icon}
        </div>
        <h3 className="font-medium text-lg mb-2">{title}</h3>
        <p className="text-muted-foreground text-sm mb-4 flex-grow">{description}</p>
        <div className="flex justify-between items-center">
          <Badge variant={type === "template" ? "outline" : type === "video" ? "secondary" : "default"}>
            {type}
          </Badge>
          <Button variant="ghost" size="sm" className="p-0 h-auto">
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Template Resource Modal Content
interface TemplateResourceProps {
  resource: any;
  onClose: () => void;
}

function TemplateResource({ resource, onClose }: TemplateResourceProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileArchive className="h-5 w-5 text-primary" />
          <span>{resource.title}</span>
        </DialogTitle>
        <DialogDescription>
          {resource.description}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="bg-muted p-4 rounded-md mb-4">
          <h3 className="font-medium mb-2 text-sm">This template includes:</h3>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Customizable OKR templates for different departments</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Example key results with measurement criteria</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Tracking spreadsheets with built-in formulas</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span>Instructions for implementation in your team</span>
            </li>
          </ul>
        </div>
        
        <div className="border rounded-md p-4 mb-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileArchive className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{resource.title}.zip</span>
            </div>
            <Badge>2.4 MB</Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-4">
            Contains Excel, Google Sheets, and PDF versions of the template
          </p>
          <Button className="w-full flex items-center justify-center gap-2">
            <Download className="h-4 w-4" />
            Download Template
          </Button>
        </div>
        
        <div className="text-sm text-muted-foreground">
          <p className="mb-2">
            <strong>Note:</strong> These templates are designed to be customized to fit your organization's specific needs.
          </p>
          <p>
            For more guidance, check out our OKR implementation guide or schedule a consultation with our team.
          </p>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="default" onClick={onClose}>
          <Bookmark className="h-4 w-4 mr-2" />
          Save for Later
        </Button>
      </DialogFooter>
    </>
  );
}

// Video Resource Modal Content
function VideoResource({ resource, onClose }: TemplateResourceProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          <span>{resource.title}</span>
        </DialogTitle>
        <DialogDescription>
          {resource.description}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="aspect-video bg-black rounded-md relative mb-4 flex items-center justify-center">
          <div className="absolute inset-0 flex items-center justify-center">
            <Button size="icon" className="rounded-full w-16 h-16 bg-primary/90 hover:bg-primary">
              <Play className="h-8 w-8 text-white" />
            </Button>
          </div>
          <div className="absolute bottom-4 right-4">
            <Badge className="bg-black/70 text-white hover:bg-black/60">8:24</Badge>
          </div>
        </div>
        
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-1">Overview</h3>
            <p className="text-sm text-muted-foreground">
              This video tutorial walks you through the essential steps of setting up and tracking OKRs effectively. 
              Perfect for new team members or as a refresher for veterans of the OKR methodology.
            </p>
          </div>
          
          <div>
            <h3 className="font-medium mb-1">Key Topics</h3>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Writing measurable and actionable objectives</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Creating quantifiable key results</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Setting up regular check-ins and reviews</span>
              </li>
              <li className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-primary" />
                <span>Using OKRs for strategic alignment</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" onClick={onClose}>
          Close
        </Button>
        <Button variant="default">
          <Bookmark className="h-4 w-4 mr-2" />
          Save for Later
        </Button>
      </DialogFooter>
    </>
  );
}

// Article/Best Practice Resource Modal Content
function ArticleResource({ resource, onClose }: TemplateResourceProps) {
  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <span>{resource.title}</span>
        </DialogTitle>
        <DialogDescription>
          {resource.description}
        </DialogDescription>
      </DialogHeader>
      
      <div className="py-4">
        <div className="prose prose-sm max-w-none">
          <h3>Introduction to OKRs</h3>
          <p>
            Objectives and Key Results (OKRs) have revolutionized how organizations set and achieve goals. 
            First popularized by Intel and later adopted by Google, OKRs have become the standard methodology 
            for aligning teams and driving measurable outcomes.
          </p>
          
          <h3>Best Practices</h3>
          <ol>
            <li>
              <strong>Keep objectives aspirational</strong> - Objectives should inspire and challenge teams 
              to push boundaries.
            </li>
            <li>
              <strong>Make key results measurable</strong> - Every key result should have a quantifiable 
              metric that indicates success.
            </li>
            <li>
              <strong>Limit the number of OKRs</strong> - Focus on 3-5 objectives with 3-5 key results each to 
              maintain clarity and focus.
            </li>
            <li>
              <strong>Review regularly</strong> - Schedule weekly or bi-weekly check-ins to track progress and 
              make adjustments as needed.
            </li>
            <li>
              <strong>Separate aspirational and committed OKRs</strong> - Distinguish between moonshot goals 
              (where 70% achievement is good) and committed goals (which should be 100% achieved).
            </li>
          </ol>
          
          <h3>Common Pitfalls</h3>
          <ul>
            <li>Using OKRs as a task list rather than focusing on outcomes</li>
            <li>Setting too many objectives, diluting focus</li>
            <li>Creating key results that aren't measurable</li>
            <li>Failing to align OKRs across the organization</li>
            <li>Not adjusting OKRs when circumstances change significantly</li>
          </ul>
          
          <div className="bg-muted p-4 rounded-md my-4">
            <p className="font-medium mb-2">Pro Tip:</p>
            <p className="text-sm">
              Consider using a "traffic light" system (red, yellow, green) for tracking 
              key result progress during check-ins to quickly visualize status.
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter className="flex justify-between">
        <Button variant="outline" className="flex items-center" onClick={onClose}>
          <ArrowRight className="h-4 w-4 mr-2 rotate-180" />
          Back
        </Button>
        <div className="flex gap-2">
          <Button variant="outline">
            <Bookmark className="h-4 w-4 mr-2" />
            Save
          </Button>
          <Button variant="default">
            <BookOpen className="h-4 w-4 mr-2" />
            Read Full Article
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}

export function AdditionalResources() {
  const [selectedResource, setSelectedResource] = useState<any | null>(null);
  const [resourceDialogOpen, setResourceDialogOpen] = useState(false);
  
  // Fetch resources from the API
  const { data: resources = [], isLoading, error } = useQuery<any[]>({
    queryKey: ['/api/resources'],
  });
  
  const handleResourceClick = (resource: any) => {
    setSelectedResource(resource);
    setResourceDialogOpen(true);
  };
  
  const handleCloseDialog = () => {
    setResourceDialogOpen(false);
  };
  
  const renderResourceModalContent = () => {
    if (!selectedResource) return null;
    
    switch (selectedResource.type) {
      case 'template':
        return <TemplateResource resource={selectedResource} onClose={handleCloseDialog} />;
      case 'video':
        return <VideoResource resource={selectedResource} onClose={handleCloseDialog} />;
      case 'article':
      default:
        return <ArticleResource resource={selectedResource} onClose={handleCloseDialog} />;
    }
  };
  
  // Helper function to get appropriate icon for resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="h-6 w-6" />;
      case 'template':
        return <FileArchive className="h-6 w-6" />;
      case 'article':
      default:
        return <FileText className="h-6 w-6" />;
    }
  };
  
  // Filter resources by type
  const getFilteredResources = (type: string) => {
    if (!resources) return [];
    return resources.filter((resource: any) => resource.type === type);
  };
  
  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-6">Additional Resources</h2>
      
      <Tabs defaultValue="all">
        <TabsList className="mb-6">
          <TabsTrigger value="all">All Resources</TabsTrigger>
          <TabsTrigger value="templates">OKR Templates</TabsTrigger>
          <TabsTrigger value="videos">Video Tutorials</TabsTrigger>
          <TabsTrigger value="bestPractices">Best Practices</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                    <Skeleton className="h-6 w-3/4 mb-2" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-full mb-1" />
                    <Skeleton className="h-4 w-2/3 mb-4" />
                    <div className="flex justify-between">
                      <Skeleton className="h-6 w-20" />
                      <Skeleton className="h-6 w-6 rounded-full" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-8">
              Error loading resources. Please try again later.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {resources && resources.length > 0 ? (
                resources.map((resource: any) => (
                  <ResourceCard 
                    key={resource.id}
                    title={resource.title}
                    description={resource.description}
                    type={resource.type}
                    icon={getResourceIcon(resource.type)}
                    onClick={() => handleResourceClick(resource)}
                  />
                ))
              ) : (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  No resources available. Check back soon for updates.
                </div>
              )}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="templates">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && resources && getFilteredResources('template').map((resource: any) => (
              <ResourceCard 
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                icon={<FileArchive className="h-6 w-6" />}
                onClick={() => handleResourceClick(resource)}
              />
            ))}
            {!isLoading && resources && getFilteredResources('template').length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No templates available. Check back soon for updates.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="videos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && resources && getFilteredResources('video').map((resource: any) => (
              <ResourceCard 
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                icon={<Video className="h-6 w-6" />}
                onClick={() => handleResourceClick(resource)}
              />
            ))}
            {!isLoading && resources && getFilteredResources('video').length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No video tutorials available. Check back soon for updates.
              </div>
            )}
          </div>
        </TabsContent>
        
        <TabsContent value="bestPractices">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {!isLoading && resources && getFilteredResources('article').map((resource: any) => (
              <ResourceCard 
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                icon={<FileText className="h-6 w-6" />}
                onClick={() => handleResourceClick(resource)}
              />
            ))}
            {!isLoading && resources && getFilteredResources('article').length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No best practice guides available. Check back soon for updates.
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Resource Detail Dialog */}
      <Dialog open={resourceDialogOpen} onOpenChange={setResourceDialogOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
          {renderResourceModalContent()}
        </DialogContent>
      </Dialog>
    </div>
  );
}