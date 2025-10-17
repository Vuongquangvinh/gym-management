import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import CheckinModel from './checkin.model.js';

export const CheckinContext = createContext({
  checkins: [],
  loading: false,
  loadingMore: false,
  error: null,
  hasMore: true,
  filters: {},
  searchCheckins: async () => {},
  loadMore: async () => {},
  updateFilters: () => {},
  addCheckin: async () => {},
});

export function useCheckins() {
  return useContext(CheckinContext);
}

export function CheckinProvider({ children }) {
  // Main data state
  const [checkins, setCheckins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  
  // Pagination state
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  
  // Filter state
  const [filters, setFilters] = useState({});
  
  // Refs for cleanup
  const abortControllerRef = useRef(null);

  // Search checkins với server-side filtering + lazy loading
  const searchCheckins = useCallback(async (newFilters = {}) => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      console.log('CheckinProvider - Searching with filters:', newFilters);
      
      // Reset về page đầu khi search
      const result = await CheckinModel.getAll(newFilters, 10, null);
      
      // Chỉ update state nếu có sự thay đổi thực sự
      setCheckins(prev => {
        const isSame = JSON.stringify(prev.map(c => c.id)) === JSON.stringify(result.checkins.map(c => c.id));
        return isSame ? prev : result.checkins;
      });
      setLastDoc(result.lastDoc);
      setHasMore(result.hasMore);
      setFilters(newFilters);
      
      console.log('CheckinProvider - Search results:', result.checkins.length);
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error searching checkins:', err);
        setError(err);
        setCheckins([]);
        setLastDoc(null);
        setHasMore(false);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Load more checkins (lazy loading)
  const loadMore = useCallback(async () => {
    if (!hasMore || loadingMore || loading) return;

    try {
      setLoadingMore(true);
      setError(null);
      
      console.log('CheckinProvider - Loading more with lastDoc:', lastDoc);
      
      const result = await CheckinModel.getAll(filters, 10, lastDoc);
      
      if (result.checkins.length > 0) {
        setCheckins(prev => [...prev, ...result.checkins]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
        
        console.log('CheckinProvider - Loaded more:', result.checkins.length);
      } else {
        setHasMore(false);
      }
    } catch (err) {
      console.error('Error loading more checkins:', err);
      setError(err);
    } finally {
      setLoadingMore(false);
    }
  }, [hasMore, loadingMore, loading, lastDoc, filters]);

  // Update filters và trigger search
  const updateFilters = useCallback((newFilters) => {
    console.log('CheckinProvider - Updating filters:', newFilters);
    searchCheckins(newFilters);
  }, [searchCheckins]);

  // Add new checkin
  const addCheckin = useCallback(async (payload) => {
    try {
      const result = await CheckinModel.create(payload);
      console.log('CheckinProvider - Checkin created:', result);
      
      // Add to beginning of list
      setCheckins(prev => [result, ...prev]);
      return result;
    } catch (error) {
      console.error('Error creating checkin:', error);
      setError(error);
      throw error;
    }
  }, []);

  // Edit checkin
  const editCheckin = useCallback(async (id, updateData) => {
    try {
      await CheckinModel.update(id, updateData);
      console.log('CheckinProvider - Checkin updated:', id);
      
      // Update in local state
      setCheckins(prev => prev.map(checkin => 
        checkin.id === id ? { ...checkin, ...updateData } : checkin
      ));
      return true;
    } catch (error) {
      console.error('Error updating checkin:', error);
      setError(error);
      throw error;
    }
  }, []);

  // Delete checkin
  const deleteCheckin = useCallback(async (id) => {
    try {
      await CheckinModel.delete(id);
      console.log('CheckinProvider - Checkin deleted:', id);
      
      // Remove from local state
      setCheckins(prev => prev.filter(checkin => checkin.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting checkin:', error);
      setError(error);
      throw error;
    }
  }, []);

  // Load initial data
  useEffect(() => {
    console.log('CheckinProvider - Loading initial data');
    searchCheckins({});
  }, [searchCheckins]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const value = {
    checkins,
    loading,
    loadingMore,
    error,
    hasMore,
    filters,
    searchCheckins,
    loadMore,
    updateFilters,
    addCheckin,
    editCheckin,
    deleteCheckin,
  };

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}
