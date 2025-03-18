
// Store for the logout function to avoid circular dependencies
let logoutHandler: (() => Promise<void>) | null = null;

// Register the logout handler from a component
export function registerLogoutHandler(handler: () => Promise<void>) {
  logoutHandler = handler;
}

// Custom fetch function that handles 401 errors globally
export async function apiFetch(url: string, options?: RequestInit): Promise<Response> {
  const response = await fetch(url, options);
  
  if (response.status === 401 || response.status === 422) {
    console.error("Unauthorized request:", response);
    throw Error("Unauthorized");
  }
  
  return response;
}
