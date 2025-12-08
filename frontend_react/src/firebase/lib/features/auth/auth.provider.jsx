import { useState, useEffect } from 'react';
// 1. Import AuthContext từ file mới tạo
import { AuthContext } from './authContext.jsx'; 
import { onAuthObserver } from './auth.service.js';

// 2. File này bây giờ chỉ export duy nhất AuthProvider component
export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthObserver((user) => {
      setCurrentUser(user);
      setLoading(false);
      console.log('[AuthProvider] currentUser:', user);
    });
    return () => unsubscribe(); // Cleanup
  }, []);

  const value = { currentUser, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
