import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import CheckinModel from './checkin.model.js';

export const CheckinContext = createContext({
  items: [],
  loading: true,
  loadingMore: false,
  error: null,
  fetchMore: async () => [],
  hasMore: true,
  members: [],
  membersLoading: true,
  membersError: null,
  filters: {},
  updateFilters: () => {},
});

export function useCheckins() {
  return useContext(CheckinContext);
}

export function CheckinProvider({ children, limit = 30 }) {
  // State chính
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // State cho member list và filters
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const [filters, setFilters] = useState({});

  // Effect để load dữ liệu khi filters thay đổi
  useEffect(() => {
    async function fetchCheckins() {
      setLoading(true);
      try {
        console.log('Fetching checkins with filters:', filters);
        const result = await CheckinModel.getAll(filters, limit);
        
        setItems(result.checkins);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      } catch (err) {
        console.error('Error fetching checkins:', err);
        setError(err);
        setItems([]);
        setLastDoc(null);
        setHasMore(false);
      } finally {
        setLoading(false);
      }
    }

    fetchCheckins();
  }, [filters, limit]);

  useEffect(() => {
    const fetchMembers = async () => {
      try {
        setMembersLoading(true);
        const fetchedMembers = await fetchAllMembers();
        setMembers(fetchedMembers);
      } catch (err) {
        setMembersError(err);
      } finally {
        setMembersLoading(false);
      }
    };

    fetchMembers();
  }, []);

  const fetchMore = useCallback(async () => {
    if (!hasMore || loadingMore) return;
    
    setLoadingMore(true);
    try {
      const result = await CheckinModel.getAll(filters, limit, lastDoc);
      
      if (result.checkins.length) {
        setItems(prev => [...prev, ...result.checkins]);
        setLastDoc(result.lastDoc);
        setHasMore(result.hasMore);
      }
      
      return result.checkins;
    } catch (e) {
      console.error('Error loading more checkins:', e);
      setError(e);
      throw e;
    } finally {
      setLoadingMore(false);
    }
  }, [filters, limit, lastDoc, hasMore, loadingMore]);

  const addCheckin = async (payload) => {
    try {
      const result = await CheckinService.createCheckin(payload);
      console.log('Check-in thành công:', result);
      setItems((prev) => [result, ...prev]); // Cập nhật danh sách check-ins
      return result;
    } catch (error) {
      console.error('Lỗi khi thêm check-in:', error);
      toast.error('Có lỗi xảy ra khi tạo check-in. Vui lòng thử lại!', {
        position: "top-right",
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      });
      throw error;
    }
  };

  // Cập nhật filters với validation
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => {
      // Kiểm tra xem có thay đổi thực sự nào không
      const next = { ...prev, ...newFilters };
      const hasChanges = Object.keys(next).some(key => 
        prev[key] !== next[key] && 
        (!prev[key] || !next[key] || prev[key].toString() !== next[key].toString())
      );
      
      if (!hasChanges) {
        console.log('No actual filter changes, skipping update');
        return prev;
      }
      
      console.log('Updating filters from:', prev, 'to:', next);
      return next;
    });
  }, []);

  const value = {
    items,
    loading,
    loadingMore,
    error,
    fetchMore,
    hasMore,
    members,
    membersLoading,
    membersError,
    addCheckin,
    filters,
    updateFilters
  };

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export default { CheckinProvider, useCheckins };