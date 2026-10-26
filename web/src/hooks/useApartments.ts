import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { SearchFilters, SearchResponse, ChatResponse } from '@/types';

export function useApartments(filters: SearchFilters, enabled = true) {
  return useQuery({
    queryKey: ['apartments', filters],
    queryFn: () => api.search(filters),
    enabled,
    staleTime: 5 * 60 * 1000,
    placeholderData: (previous) => previous,
  });
}

export function useChatSearch() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ message, city }: { message: string; city?: string }) => 
      api.chat(message, city),
    onSuccess: (data) => {
      // Кэшируем результаты чата
      queryClient.setQueryData(
        ['chat', data.filters],
        data
      );
    },
  });
}

export function useSources() {
  return useQuery({
    queryKey: ['sources'],
    queryFn: () => api.getSources(),
    staleTime: 10 * 60 * 1000,
  });
}

// Префетч для быстрого переключения
export function usePrefetchApartments() {
  const queryClient = useQueryClient();
  
  return (filters: SearchFilters) => {
    queryClient.prefetchQuery({
      queryKey: ['apartments', filters],
      queryFn: () => api.search(filters),
      staleTime: 5 * 60 * 1000,
    });
  };
}