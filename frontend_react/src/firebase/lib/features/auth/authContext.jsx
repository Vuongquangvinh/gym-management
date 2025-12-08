import { createContext, useContext } from 'react';

// 1. Tạo và export Context với giá trị mặc định
export const AuthContext = createContext({
  currentUser: null,
  loading: true,
});

// 2. Tạo và export custom hook để sử dụng Context
export const useAuth = () => {
  return useContext(AuthContext);
};
