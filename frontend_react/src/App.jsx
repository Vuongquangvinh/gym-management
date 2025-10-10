import { AuthProvider } from './firebase/lib/features/auth/auth.provider.jsx';
import AppRouter from './routes';

function App() {
    return (
        <AuthProvider>
            <AppRouter />
        </AuthProvider>
    );
}

export default App;