import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export function StrategyMap() {
  return (
    <Card className="mb-8">
      <CardHeader className="px-5 py-4 flex justify-between items-center">
        <CardTitle className="text-lg font-medium text-neutral-900">Strategy Map</CardTitle>
        <div>
          <Button variant="outline" size="sm" className="mr-2">
            Export
          </Button>
          <Button size="sm">
            Edit Strategy
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-5">
        <div className="bg-neutral-50 p-4 rounded-lg border border-dashed border-neutral-300 flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-neutral-400 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2" />
            </svg>
            <h3 className="text-lg font-medium text-neutral-900 mb-1">Strategy Map Visualization</h3>
            <p className="text-sm text-neutral-600 mb-4 max-w-md mx-auto">
              Visualize how your team's objectives connect to company-wide goals to ensure alignment.
            </p>
            <Button variant="outline" className="text-primary-700 border-primary-300 hover:bg-primary-50">
              View Full Strategy Map
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
