
import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { db } from '../services/dbService';
import { Button, Input, Card } from '../components/UI';
import { RefreshCw } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeRole, setActiveRole] = useState<Role>(Role.STUDENT);
  const [identifier, setIdentifier] = useState(''); // Name for student, Username for admin
  const [credential, setCredential] = useState(''); // Class for student, Password for admin
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load classes for dropdown
    const loadClasses = async () => {
        try {
            const data = await db.getClasses();
            setClasses(data);
        } catch (err) {
            console.error("Failed to load classes from server", err);
        }
    };
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    try {
        const user = await db.login(identifier, credential, activeRole);
        if (user) {
          onLogin(user);
        } else {
          // This might be unreachable if db.login throws on 401
          setError('Login gagal. Periksa kembali data Anda.');
        }
    } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f0f4f8] p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl md:text-3xl font-bold text-[#0f4c81] tracking-wider">SMK Muhammadiyah Kalibawang</h1>
          <p className="text-gray-500 mt-2">Computer Based Test System (Online Mode)</p>
        </div>

        <Card className="border-t-4 border-blue-600">
          <div className="flex mb-6 bg-gray-100 p-1 rounded-lg">
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeRole === Role.STUDENT ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setActiveRole(Role.STUDENT); setIdentifier(''); setCredential(''); setError(''); }}
            >
              Siswa
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${activeRole === Role.ADMIN ? 'bg-white text-blue-700 shadow-sm' : 'text-gray-500'}`}
              onClick={() => { setActiveRole(Role.ADMIN); setIdentifier(''); setCredential(''); setError(''); }}
            >
              Admin / Guru
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {activeRole === Role.STUDENT ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap</label>
                  <Input 
                    value={identifier} 
                    onChange={e => setIdentifier(e.target.value)} 
                    placeholder="Masukkan nama lengkap Anda"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Kelas</label>
                  {classes.length > 0 ? (
                      <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        value={credential}
                        onChange={e => setCredential(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                  ) : (
                      <div className="text-sm text-gray-400 italic p-2 border rounded bg-gray-50">
                          Memuat daftar kelas... (Pastikan Server Aktif)
                      </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <Input 
                    value={identifier} 
                    onChange={e => setIdentifier(e.target.value)} 
                    placeholder="Masukkan Username"
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                  <Input 
                    type="password"
                    value={credential} 
                    onChange={e => setCredential(e.target.value)} 
                    placeholder="Masukkan Password"
                    required 
                  />
                </div>
              </>
            )}

            {error && <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">{error}</div>}
            
            <Button type="submit" className="w-full py-3 text-lg font-semibold mt-4" disabled={loading}>
              {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={18} className="animate-spin"/> Masuk...</span> : 'MASUK'}
            </Button>
          </form>
        </Card>
        
        <div className="text-center mt-6 text-xs text-gray-400">
          &copy; 2025 SMK Muhammadiyah Kalibawang.
        </div>
      </div>
    </div>
  );
};
