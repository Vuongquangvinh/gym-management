import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import CheckinService, { fetchAllMembers } from './checkin.service.js';

export const CheckinContext = createContext({
  items: [],
  loading: true,
  error: null,
  fetchMore: async () => [],
  members: [],
  membersLoading: true,
  membersError: null,
});

export function useCheckins() {
  return useContext(CheckinContext);
}

export function CheckinProvider({ children, limit = 30 }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState(null);
  const lastRef = useRef(null);
  const unsubRef = useRef(null);

  useEffect(() => {
    setLoading(true);
    unsubRef.current = CheckinService.subscribeRecentCheckins(
      limit,
      ({ docs, last }) => {
        setItems(docs);
        lastRef.current = last;
        setLoading(false);
      },
      (err) => {
        setError(err);
        setLoading(false);
      }
    );

    return () => {
      if (unsubRef.current) unsubRef.current();
    };
  }, [limit]);

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
    try {
      const { docs, last } = await CheckinService.fetchMoreCheckins(lastRef.current, limit);
      if (docs.length) {
        setItems((prev) => [...prev, ...docs]);
        lastRef.current = last;
      }
      return docs;
    } catch (e) {
      setError(e);
      throw e;
    }
  }, [limit]);

  const addCheckin = async (payload) => {
    try {
      const result = await CheckinService.createCheckin(payload);
      console.log('Check-in thành công:', result);
      setItems((prev) => [result, ...prev]); // Cập nhật danh sách check-ins
      return result;
    } catch (error) {
      console.error('Lỗi khi thêm check-in:', error);
      throw error;
    }
  };

  const value = {
    items,
    loading,
    error,
    fetchMore,
    members,
    membersLoading,
    membersError,
    addCheckin, // Thêm hàm addCheckin vào context
  };

  return <CheckinContext.Provider value={value}>{children}</CheckinContext.Provider>;
}

export default { CheckinProvider, useCheckins };
