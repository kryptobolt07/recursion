import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { demoUser, isDemoMode } from "@/lib/demo";

interface User {
    id: string;
    title: string;
    thumbnail: string;
    subscriberCount: string;
}

export const useAuth = () => {
    const { data, isLoading, error, refetch } = useQuery<{ user: User | null }>({
        queryKey: ["auth_user"],
        queryFn: async () => {
            const res = await apiFetch("/auth/me");
            if (!res.ok) throw new Error("Failed to fetch user");
            return res.json();
        },
        enabled: !isDemoMode,
        // Don't retry on 401/403
        retry: false,
    });

    return {
        user: isDemoMode ? demoUser : data?.user || null,
        isLoading: isDemoMode ? false : isLoading,
        error: isDemoMode ? null : error,
        refetch,
    };
};
