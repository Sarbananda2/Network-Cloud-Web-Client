import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { User } from "@shared/models/auth";

async function fetchUser(): Promise<User | null> {
  const response = await fetch("/api/auth/user", {
    credentials: "include",
  });

  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    throw new Error(`${response.status}: ${response.statusText}`);
  }

  return response.json();
}

async function logout(): Promise<void> {
  window.location.href = "/api/logout";
}

export function useAuth() {
  const queryClient = useQueryClient();
  const { data: user, isLoading, fetchStatus } = useQuery<User | null>({
    queryKey: ["/api/auth/user"],
    queryFn: fetchUser,
    retry: false,
    staleTime: 1000 * 30, // 30 seconds - shorter to catch logout state faster
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });

  const logoutMutation = useMutation({
    mutationFn: logout,
    onMutate: () => {
      // Clear auth cache immediately before redirect
      queryClient.setQueryData(["/api/auth/user"], null);
    },
  });

  // Only show loading on initial load, not on background refetches
  const isInitialLoading = isLoading && fetchStatus === "fetching";

  return {
    user,
    isLoading: isInitialLoading,
    isAuthenticated: !!user,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
