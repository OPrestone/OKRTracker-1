import React, { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AuthTest() {
  const { user, login, logout } = useAuth();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Test login function
  const handleTestLogin = async () => {
    try {
      await login("admin@example.com", "password");
      setErrorMessage(null);
    } catch (error) {
      setErrorMessage(`Login error: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <Card>
        <CardHeader>
          <CardTitle>Authentication Test Page</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <strong>Authentication Status:</strong>{" "}
              {user ? (
                <span className="text-green-500">Authenticated</span>
              ) : (
                <span className="text-red-500">Not Authenticated</span>
              )}
            </div>

            {user && (
              <div className="border p-4 rounded-md bg-gray-50">
                <h3 className="font-medium mb-2">User Details:</h3>
                <pre className="text-sm overflow-auto">{JSON.stringify(user, null, 2)}</pre>
              </div>
            )}

            {errorMessage && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {errorMessage}
              </div>
            )}

            <div className="flex gap-4">
              <Button onClick={handleTestLogin} variant="default">
                Test Login
              </Button>
              
              {user && (
                <Button onClick={logout} variant="destructive">
                  Test Logout
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}