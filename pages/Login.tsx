
import React, { useState, useEffect } from 'react';
import { Role, User } from '../types';
import { db } from '../services/dbService';
import { Button, Input, Card } from '../components/UI';
import { RefreshCw, AlertTriangle, Database } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [activeRole, setActiveRole] = useState<Role>(Role.STUDENT);
  const [identifier, setIdentifier] = useState(''); // Name for student (UNUSED NOW), Username for admin
  const [credential, setCredential] = useState(''); // Class for student, Password for admin
  const [error, setError] = useState('');
  const [classes, setClasses] = useState<{id: string, name: string}[]>([]);
  const [loading, setLoading] = useState(false);
  const [classLoadError, setClassLoadError] = useState('');
  const [setupRequired, setSetupRequired] = useState(false);

  useEffect(() => {
    // Load classes for dropdown
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

            // Menampilkan pesan error yang bisa dibaca user
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

    // LOGIKA LOGIN SISWA: Tanpa Nama, Generate ID Sesi Unik
    if (activeRole === Role.STUDENT) {
        if (!credential) {
            setError("Silakan pilih kelas terlebih dahulu.");
            setLoading(false);
            return;
        }
        // Buat ID unik acak agar sesi siswa tidak bentrok satu sama lain di sistem
        const randomId = Math.floor(1000 + Math.random() * 9000);
        loginIdentifier = `Peserta-${randomId}`;
    }
    
    try {
        const user = await db.login(loginIdentifier, credential, activeRole);
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

  if (setupRequired) {
      return (
          <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
              <Card className="max-w-2xl w-full">
                  <div className="text-center mb-6">
                      <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Database size={32} />
                      </div>
                      <h2 className="text-2xl font-bold text-gray-800">Setup Database Diperlukan</h2>
                      <p className="text-gray-600 mt-2">Aplikasi terhubung ke Supabase, tetapi tabel belum dibuat.</p>
                  </div>
                  
                  <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-6">
                      <h3 className="font-bold text-yellow-800 flex items-center gap-2 mb-2">
                          <AlertTriangle size={18}/> Instruksi Setup:
                      </h3>
                      <ol className="list-decimal pl-5 text-sm text-yellow-800 space-y-2">
                          <li>Buka <strong>Supabase Dashboard</strong> Project Anda.</li>
                          <li>Masuk ke menu <strong>SQL Editor</strong> di sidebar kiri.</li>
                          <li>Klik <strong>New Query</strong>.</li>
                          <li>Copy kode SQL di bawah ini dan Paste di editor tersebut.</li>
                          <li>Klik tombol <strong>RUN</strong> di pojok kanan bawah editor.</li>
                          <li>Setelah sukses, refresh halaman ini.</li>
                      </ol>
                  </div>

                  <div className="relative">
                      <pre className="bg-gray-800 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto h-64">
{`-- 1. Tabel Users
create table users (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password text not null,
  role text not null,
  full_name text
);
insert into users (username, password, role, full_name) 
values ('admin', 'admin123', 'ADMIN', 'Administrator');

-- 2. Tabel Kelas
create table classes (
  id uuid default gen_random_uuid() primary key,
  name text not null
);

-- 3. Tabel Soal
create table questions (
  id uuid default gen_random_uuid() primary key,
  text text not null,
  type text default 'EXTERNAL_FORM',
  topic text,
  google_form_url text,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 4. Tabel Ujian
create table exams (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  token text not null,
  mode text default 'GOOGLE_FORM',
  google_form_url text,
  duration_minutes int default 60,
  start_time timestamp with time zone,
  is_active boolean default false,
  assigned_classes jsonb default '[]'::jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now())
);

-- 5. Tabel Hasil
create table results (
  id uuid default gen_random_uuid() primary key,
  exam_id uuid references exams(id) on delete cascade,
  student_name text not null,
  class_name text not null,
  score int default 0,
  status text default 'COMPLETED',
  completed_at timestamp with time zone default timezone('utc'::text, now()),
  violation_count int default 0
);

-- 6. Tabel Sesi
create table sessions (
  id uuid default gen_random_uuid() primary key,
  student_name text not null,
  class_name text not null,
  last_seen timestamp with time zone default timezone('utc'::text, now()),
  unique(student_name, class_name)
);

-- 7. Public Access Policies
alter table users enable row level security;
alter table classes enable row level security;
alter table questions enable row level security;
alter table exams enable row level security;
alter table results enable row level security;
alter table sessions enable row level security;

create policy "Public Access Users" on users for all using (true);
create policy "Public Access Classes" on classes for all using (true);
create policy "Public Access Questions" on questions for all using (true);
create policy "Public Access Exams" on exams for all using (true);
create policy "Public Access Results" on results for all using (true);
create policy "Public Access Sessions" on sessions for all using (true);`}
                      </pre>
                  </div>
                  
                  <div className="mt-6 text-center">
                      <Button onClick={() => window.location.reload()}>Sudah Run SQL? Refresh Halaman</Button>
                  </div>
              </Card>
          </div>
      )
  }

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
                <div className="py-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Pilih Kelas</label>
                  {classLoadError ? (
                      <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex gap-2 items-start">
                          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                          <div>
                              <strong>Error Memuat Data:</strong><br/>
                              {classLoadError}
                          </div>
                      </div>
                  ) : classes.length > 0 ? (
                      <select 
                        className="w-full px-3 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
                        value={credential}
                        onChange={e => setCredential(e.target.value)}
                        required
                      >
                        <option value="">-- Pilih Kelas --</option>
                        {classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                      </select>
                  ) : (
                      <div className="text-sm text-gray-400 italic p-2 border rounded bg-gray-50">
                          Memuat daftar kelas...
                      </div>
                  )}
                  <p className="text-xs text-gray-500 mt-2">* Pilih kelas Anda untuk melihat daftar ujian yang tersedia.</p>
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
