import React, { useState, ReactNode } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentExam } from './pages/StudentExam';
import { User, Role } from './types';

interface ErrorBoundaryProps {
  children?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorMsg: string;
}

// Error Boundary must be a Class Component
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    hasError: false,
    errorMsg: ''
  };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true, errorMsg: error.toString() };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center p-6">
              <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan Sistem</h1>
                  <p className="text-gray-600 mb-4">Aplikasi mengalami crash.</p>
                  <pre className="text-xs text-left bg-gray-100 p-2 rounded mb-4 overflow-auto max-h-32 text-red-500">
                    {this.state.errorMsg}
                  </pre>
                  <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 w-full">Muat Ulang</button>
              </div>
          </div>
      );
    }

    // Cast props to any to avoid TypeScript error 'Property props does not exist on type ErrorBoundary'
    return (this.props as any).children;
  }
}

const AppContent: React.FC = () => {
  // Use lazy initialization for user state to avoid flicker on refresh
  const [user, setUser] = useState<User | null>(() => {
    try {
        const savedUser = localStorage.getItem('exambit_user');
        return savedUser ? JSON.parse(savedUser) : null;
    } catch (e) {
        console.error("Storage parsing error", e);
        return null;
    }
  });

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('exambit_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    // Hapus semua data localstorage (termasuk jawaban sementara, user session, dll)
    // agar bersih saat user berikutnya login
    localStorage.clear();
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === Role.ADMIN) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <StudentExam user={user} onLogout={handleLogout} />;
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
};

export default App;