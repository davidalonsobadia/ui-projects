"use client"

import React, { createContext, useContext, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { registerLogoutHandler } from "@/lib/api";

// Create context for authentication
const AuthContext = createContext<{
  logout: () => Promise<void>;
}>({
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { toast } = useToast();
  
  // Define the logout function
  const handleLogout = async () => {
    try {
      // Clear the auth token
      await fetch('/api/auth/logout', { method: 'POST' });
      
      // Show notification
      toast({
        title: "Session expired",
        description: "Your session has expired. Please log in again.",
        variant: "default",
      });
      
      // Redirect to login page
      router.push("/login");
    } catch (error) {
      console.error("Logout error:", error);
      // Force redirect even if the logout API fails
      router.push("/login");
    }
  };
  
  // Register the logout handler on component mount
  useEffect(() => {
    registerLogoutHandler(handleLogout);
  }, []);
  
  return (
    <AuthContext.Provider value={{ logout: handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
}