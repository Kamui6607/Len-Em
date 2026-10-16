import { QueryClient } from "@tanstack/react-query";

// ============================================================
// TanStack Query Client Configuration
// ============================================================

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes — data considered fresh
      gcTime: 1000 * 60 * 30,   // 30 minutes — keep in cache
      retry: 2,                 // Retry failed requests twice
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
    mutations: {
      retry: 0,
    },
  },
});
/**
 * Huỷ đơn (hoặc duyệt yêu cầu huỷ) làm BE hoàn stock — đánh dấu cache sản phẩm
 * cũ để danh sách / chi tiết sản phẩm tải lại stock mới.
 */
export function invalidateProductCaches() {
  return queryClient.invalidateQueries({ queryKey: ["products"] });
}
