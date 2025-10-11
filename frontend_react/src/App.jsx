import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './firebase/lib/features/auth/auth.provider.jsx';
import Login from './features/auth/pages/LoginPage';
import ForgotPassword from './features/auth/pages/ForgotPassword';
import ProtectedRoute from './features/auth/components/ProtectedRoute';
import AdminLayout from './features/admin/AdminLayout';
import Dashboard from './features/admin/Dashboard';
const Members = React.lazy(()=>import('./features/admin/pages/Members'));
const Checkins = React.lazy(()=>import('./features/admin/pages/Checkins'));
const Packages = React.lazy(()=>import('./features/admin/pages/Packages'));
const Reports = React.lazy(()=>import('./features/admin/pages/Reports'));
const Settings = React.lazy(()=>import('./features/admin/pages/Settings'));
function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <React.Suspense fallback={<div>Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Login />} />
                        <Route path="/forgot" element={<ForgotPassword />} />

                        <Route path="/admin" element={<AdminLayout />}>
                            <Route index element={<Dashboard />} />
                            <Route path="members" element={<Members />} />
                            <Route path="checkins" element={<Checkins />} />
                            <Route path="packages" element={<Packages />} />
                            <Route path="reports" element={<Reports />} />
                            <Route path="settings" element={<Settings />} />
                        </Route>
                    </Routes>
                </React.Suspense>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;