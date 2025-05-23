import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

/**
 * Diagnostic page that doesn't depend on authentication
 * This helps isolate rendering issues from authentication issues
 */
export default function DiagnosticPage() {
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [apiResponse, setApiResponse] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  // Simple server health check
  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => {
        setServerStatus('online');
        setApiResponse(data);
      })
      .catch(err => {
        setServerStatus('offline');
        setError(err.message);
      });
  }, []);

  return (
    <div className="container mx-auto py-10 px-4">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader className="bg-primary/5">
          <CardTitle className="text-2xl">OKR Platform Diagnostic Page</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-2">Server Status</h2>
              <div className="flex items-center gap-2">
                <div 
                  className={`w-3 h-3 rounded-full ${
                    serverStatus === 'online' ? 'bg-green-500' : 
                    serverStatus === 'offline' ? 'bg-red-500' : 'bg-yellow-500'
                  }`} 
                />
                <span className="capitalize">{serverStatus}</span>
              </div>
              {error && (
                <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
                  {error}
                </div>
              )}
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-2">Browser Information</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">User Agent:</span>
                  <p className="mt-1 text-gray-600">{navigator.userAgent}</p>
                </div>
                <div>
                  <span className="font-medium">Screen Size:</span>
                  <p className="mt-1 text-gray-600">{window.innerWidth}x{window.innerHeight}</p>
                </div>
              </div>
            </div>

            <Separator />

            <div>
              <h2 className="text-xl font-semibold mb-2">API Response</h2>
              {apiResponse ? (
                <pre className="bg-gray-50 p-4 rounded-md overflow-auto text-sm">
                  {JSON.stringify(apiResponse, null, 2)}
                </pre>
              ) : (
                <p className="text-gray-500 italic">No API response available</p>
              )}
            </div>

            <div className="flex justify-center mt-6">
              <Button 
                onClick={() => window.location.href = '/'}
                variant="outline"
                className="mr-4"
              >
                Return to Home
              </Button>
              <Button 
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}