import React from 'react';
import { createRoot } from 'react-dom/client';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

function BasicTestApp() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <Card className="w-[400px]">
        <CardHeader>
          <CardTitle>Basic Test Component</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">This is a basic test component that should render without dependencies.</p>
          <Button>Test Button</Button>
        </CardContent>
      </Card>
    </div>
  );
}

// Only mount this component if running directly
if (import.meta.url.includes('root-test')) {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    const root = createRoot(rootElement);
    root.render(<BasicTestApp />);
  }
}

export default BasicTestApp;