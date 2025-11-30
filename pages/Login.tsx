import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { db } from '../services/dbService';
import { Button, Input, Card } from '../components/UI';
import { RefreshCw, AlertTriangle, Database, User as UserIcon, Lock, GraduationCap, ChevronDown } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeRole, setActiveRole] = useState<Role>(Role.STUDENT);
  const [identifier, setIdentifier] = useState(''); 
  const [credential, setCredential] = useState(''); 
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [classLoadError, setClassLoadError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    const loadClasses = async () => {
        try {
            setClassLoadError('');
            const data = await db.getClasses();
            setClasses(data);
        } catch (err: any) {
            console.error("Failed to load classes from server", err);
            if (err.message.includes("SETUP_REQUIRED")) {
                setSetupRequired(true);
            }
            setClassLoadError(err.message || "Gagal menghubungi server database.");
        }
    };
    loadClasses();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    let loginIdentifier = identifier;

    if (activeRole === Role.STUDENT) {
        if (!identifier.trim()) {
            setError("Silakan masukkan nama lengkap.");
            setLoading(false);
            return;
        }
        if (!credential) {
            setError("Silakan pilih kelas terlebih dahulu.");
            setLoading(false);
            return;
        }
        loginIdentifier = identifier.trim();
    }
    
    try {
        const user = await db.login(loginIdentifier, credential, activeRole);
        if (user) {
          onLogin(user);
        } else {
          setError('Login gagal. Periksa kembali data Anda.');
        }
    } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan koneksi ke server.');
    } finally {
        setLoading(false);
    }
  };

  if (setupRequired) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6 font-sans">
              <Card className="max-w-xl w-full border-t-4 border-yellow-500 shadow-xl">
                  <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-yellow-50 text-yellow-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                          <Database size={40} />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800 tracking-tight">Setup Database Diperlukan</h2>
                      <p className="text-gray-500 mt-3">Aplikasi terhubung ke Supabase, tetapi struktur tabel belum ditemukan.</p>
                  </div>
                  
                  <div className="bg-yellow-50/50 border border-yellow-200 p-6 rounded-xl mb-8">
                      <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-4 text-lg">
                          <AlertTriangle size={20}/> Langkah Perbaikan:
                      </h3>
                      <ol className="list-decimal pl-5 text-yellow-900 space-y-3">
                          <li>Buka <strong>Supabase Dashboard</strong> Project Anda.</li>
                          <li>Masuk ke menu <strong>SQL Editor</strong>.</li>
                          <li>Buat <strong>New Query</strong>, copy-paste kode SQL Setup.</li>
                          <li>Klik <strong>RUN</strong>.</li>
                      </ol>
                  </div>
                  
                  <div className="mt-6 text-center">
                      <Button onClick={() => window.location.reload()} variant="primary" className="w-full py-3">Refresh Halaman</Button>
                  </div>
              </Card>
          </div>
      )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4 font-sans">
      <div className="w-full max-w-md">
        
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-2xl shadow-lg shadow-blue-600/30 mb-6 transform -rotate-3">
             <GraduationCap className="text-white" size={32} />
          </div>
          <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">SMK Muh Kalibawang</h1>
          <p className="text-blue-600 font-medium mt-2 bg-blue-50 inline-block px-3 py-1 rounded-full text-sm">Computer Based Test</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-100">
          {/* Role Switcher */}
          <div className="grid grid-cols-2 p-1.5 bg-gray-50/80 border-b border-gray-100">
            <button
              className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeRole === Role.STUDENT ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
              onClick={() => { setActiveRole(Role.STUDENT); setIdentifier(''); setCredential(''); setError(''); }}
            >
              <UserIcon size={16} /> Siswa
            </button>
            <button
              className={`py-2.5 text-sm font-bold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeRole === Role.ADMIN ? 'bg-white text-blue-600 shadow-sm ring-1 ring-gray-200' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100/50'}`}
              onClick={() => { setActiveRole(Role.ADMIN); setIdentifier(''); setCredential(''); setError(''); }}
            >
              <Lock size={16} /> Admin / Guru
            </button>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              {activeRole === Role.STUDENT ? (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Nama Lengkap</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input 
                          value={identifier} 
                          onChange={e => setIdentifier(e.target.value)} 
                          placeholder="Ketik nama lengkap Anda"
                          className="pl-10"
                          required 
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Kelas</label>
                    {classLoadError ? (
                        <div className="p-3 bg-red-50 border border-red-100 rounded-lg text-sm text-red-600 flex gap-2 items-start">
                            <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{classLoadError}</span>
                        </div>
                    ) : (
                        <div className="relative group">
                           <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <GraduationCap size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                          </div>
                          <select 
                            className="w-full pl-10 pr-10 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-white appearance-none cursor-pointer transition-colors"
                            value={credential}
                            onChange={e => setCredential(e.target.value)}
                            required
                          >
                            <option value="">-- Pilih Kelas --</option>
                            {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                          </select>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-gray-400">
                             <ChevronDown size={16} />
                          </div>
                        </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Username</label>
                    <div className="relative group">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <UserIcon size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input 
                        value={identifier} 
                        onChange={e => setIdentifier(e.target.value)} 
                        placeholder="Username Admin"
                        className="pl-10"
                        required 
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-sm font-semibold text-gray-700">Password</label>
                    <div className="relative group">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Lock size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
                      </div>
                      <Input 
                        type="password"
                        value={credential} 
                        onChange={e => setCredential(e.target.value)} 
                        placeholder="Password Admin"
                        className="pl-10"
                        required 
                      />
                    </div>
                  </div>
                </>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-sm rounded-lg flex items-center gap-2 animate-pulse">
                   <AlertTriangle size={16} /> {error}
                </div>
              )}
              
              <Button type="submit" className="w-full py-3 text-base shadow-lg shadow-blue-500/30" disabled={loading}>
                {loading ? <span className="flex items-center justify-center gap-2"><RefreshCw size={18} className="animate-spin"/> Masuk...</span> : 'MASUK SEKARANG'}
              </Button>
            </form>
          </div>
        </div>
        
        <div className="text-center mt-8 space-y-2">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-widest">&copy; 2025 SMK Muhammadiyah Kalibawang</p>
          <p className="text-[10px] text-gray-300">Supported by ExamBit Engine</p>
        </div>
      </div>
    </div>
  );
};