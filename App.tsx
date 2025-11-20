import React, { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentExam } from './pages/StudentExam';
import { User, Role } from './types';

// Helper for simple hash routing if needed, but here we use State Routing for security within session
const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  
  // Persist login across reloads simplified
  useEffect(() => {
    const savedUser = localStorage.getItem('exambit_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    localStorage.setItem('exambit_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('exambit_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  if (user.role === Role.ADMIN) {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  return <StudentExam user={user} onLogout={handleLogout} />;
};

export default App;