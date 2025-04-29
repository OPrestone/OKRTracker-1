import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FileText, Video, FileArchive } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface ResourceItemProps {
  title: string;
  description: string;
  type: string;
  url: string;
}

function ResourceItem({ title, description, type, url }: ResourceItemProps) {
  // Determine icon based on resource type
  const getResourceIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video className="text-neutral-400 text-4xl" />;
      case 'template':
        return <FileArchive className="text-neutral-400 text-4xl" />;
      case 'article':
      default:
        return <FileText className="text-neutral-400 text-4xl" />;
    }
  };

  // Determine action text based on resource type
  const getActionText = (type: string) => {
    switch (type) {
      case 'video':
        return 'Watch videos';
      case 'template':
        return 'Download templates';
      case 'article':
      default:
        return 'Read guide';
    }
  };

  return (
    <div className="border border-neutral-200 rounded-lg overflow-hidden">
      <div className="h-36 bg-neutral-100 flex items-center justify-center">
        {getResourceIcon(type)}
      </div>
      <div className="p-4">
        <h3 className="font-medium text-neutral-900 mb-1">{title}</h3>
        <p className="text-sm text-neutral-600 mb-3">{description}</p>
        <a 
          href={url} 
          className="text-xs font-medium text-primary-600 hover:text-primary-800 flex items-center"
        >
          {getActionText(type)}
          <ArrowRight className="ml-1 w-4 h-4" />
        </a>
      </div>
    </div>
  );
}

export function ResourcesSection() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/resources'],
  });

  return (
    <Card>
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Helpful Resources</CardTitle>
        <a href="/resources" className="text-sm font-medium text-primary-600 hover:text-primary-800">
          View all
        </a>
      </CardHeader>
      <CardContent className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <>
            {[...Array(3)].map((_, i) => (
              <div key={i} className="border border-neutral-200 rounded-lg overflow-hidden">
                <Skeleton className="h-36 w-full" />
                <div className="p-4">
                  <Skeleton className="h-5 w-40 mb-2" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-full mb-3" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </div>
            ))}
          </>
        ) : error ? (
          <div className="text-red-500">Error loading resources</div>
        ) : (
          <>
            {data && data.slice(0, 3).map((resource: any) => (
              <ResourceItem
                key={resource.id}
                title={resource.title}
                description={resource.description}
                type={resource.type}
                url={resource.url}
              />
            ))}
          </>
        )}
      </CardContent>
    </Card>
  );
}
