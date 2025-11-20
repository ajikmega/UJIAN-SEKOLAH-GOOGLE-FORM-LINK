import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentExam } from './pages/StudentExam';
import { User, Role } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [hasError, setHasError] = useState(false);
  
  useEffect(() => {
    try {
        const savedUser = localStorage.getItem('exambit_user');
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        }
    } catch (e) {
        console.error("Storage parsing error", e);
    }
  }, []);

  // Simple Error Boundary Logic
  if (hasError) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 text-center p-6">
              <div>
                  <h1 className="text-2xl font-bold text-red-600 mb-2">Terjadi Kesalahan Sistem</h1>
                  <p className="text-gray-600 mb-4">Silakan muat ulang halaman atau hubungi admin.</p>
                  <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-4 py-2 rounded">Muat Ulang</button>
              </div>
          </div>
      );
  }

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('exambit_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('exambit_user');
  };

  try {
      if (!user) {
        return <Login onLogin={handleLogin} />;
      }

      if (user.role === Role.ADMIN) {
        return <AdminDashboard onLogout={handleLogout} />;
      }

      return <StudentExam user={user} onLogout={handleLogout} />;
  } catch (e) {
      console.error("Render error", e);
      setHasError(true);
      return null;
  }
};

export default App;