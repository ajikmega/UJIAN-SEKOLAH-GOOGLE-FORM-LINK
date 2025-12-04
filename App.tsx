import React, { useState } from 'react';
import { Login } from './pages/Login';
import { AdminDashboard } from './pages/AdminDashboard';
import { StudentExam } from './pages/StudentExam';
import { User, Role } from './types';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (loggedInUser: User) => {
    setUser(loggedInUser);
  };

  const handleLogout = () => {
    setUser(null);
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