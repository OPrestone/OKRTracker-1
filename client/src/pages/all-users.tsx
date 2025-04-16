import { useState } from "react";
import DashboardLayout from "@/layouts/dashboard-layout";
import { useQuery } from "@tanstack/react-query";
import { User } from "@shared/schema";

export default function AllUsers() {
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  return (
    <DashboardLayout title="All Users">
      <div>
        <h1 className="text-2xl font-bold mb-4">All Users</h1>
        {isLoading ? (
          <p>Loading users...</p>
        ) : (
          <div>
            {users && users.length > 0 ? (
              <ul>
                {users.map(user => (
                  <li key={user.id}>
                    {user.firstName} {user.lastName} ({user.email})
                  </li>
                ))}
              </ul>
            ) : (
              <p>No users found</p>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
