import { createContext, useContext } from 'react';

export const CheckinContext = createContext({
  items: [],
  checkins: [], // Alias for backward compatibility
  loading: true,
  loadingMore: false,
  error: null,
  fetchMore: async () => [],
  loadMore: async () => [], // Alias for backward compatibility
  hasMore: true,
  members: [],
  membersLoading: true,
  membersError: null,
  filters: {},
  updateFilters: () => {},
  addCheckin: async () => {},
  editCheckin: async () => {}, // Placeholder
  deleteCheckin: async () => {}, // Placeholder
});

export function useCheckins() {
  return useContext(CheckinContext);
}
