import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

// Store for the logout function to avoid circular dependencies
let logoutHandler: (() => Promise<void>) | null = null;

// Register the logout handler from a component
export function registerLogoutHandler(handler: () => Promise<void>) {
  logoutHandler = handler;
}

// Custom fetch function that handles 401 errors globally
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  // Handle 401 Unauthorized errors globally
  if (response.status === 401) {
    // Call the registered logout handler
    if (logoutHandler) {
      await logoutHandler();
    } else {
      console.error("No logout handler registered");
      // Fallback: redirect to login
      window.location.href = "/login";
    }
  }
  
  return response;
}

// React hook for using the API with automatic 401 handling
export function useApi() {
  const router = useRouter();
  const { toast } = useToast();
  
  // Register the logout handler on component mount
  React.useEffect(() => {
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
    
    registerLogoutHandler(handleLogout);
  }, [router, toast]);
  
  return { fetch: apiFetch };
}