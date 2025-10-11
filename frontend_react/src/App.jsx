import React from 'react';
import './App.css';
import { AuthProvider } from './firebase/lib/features/auth/auth.provider.jsx';
import AppRouter from './routes/index.jsx';
function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;