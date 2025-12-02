
import React, { useState, useEffect } from 'react';
import { db } from '../services/dbService';
import { Exam, ClassGroup, Question } from '../types';
import { Button, Input, Card, Modal } from '../components/UI';
import { Plus, Trash, Play, Square, LogOut, BarChart, Users, Database, Link as LinkIcon, ExternalLink, Home, Activity, UserCheck, Monitor, Calendar, Clock, Edit, Trash2, BookOpen, Eye, Search, Filter, ChevronDown, Info, AlertTriangle } from 'lucide-react';

export const AdminDashboard: React.FC<{ onLogout: () => void }> = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'exams' | 'classes' | 'questions'>('dashboard');
  const [exams, setExams] = useState<Exam[]>([]);
  
  const loadExams = async () => {
      try {
        const data = await db.getExams();
        setExams(data);
      } catch (e) {
          console.warn("Failed to load exams", e);
      }
  };

  useEffect(() => {
    loadExams();
  }, [activeTab]);

  return (
    <div className="min-h-screen bg-gray-50/50 flex flex-col font-sans">
      {/* Navbar */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="container mx-auto px-4 lg:px-6 h-16 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 text-white rounded-lg flex items-center justify-center shadow-md shadow-blue-600/20">
                <BookOpen size={20} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-800 leading-tight">SMK Muh Kalibawang</h1>
              <p className="text-xs text-gray-500 font-medium">Administrator Panel</p>
            </div>
          </div>
          <Button onClick={onLogout} className="bg-red-600 text-white hover:bg-red-700 shadow-sm border-transparent px-4">
             <LogOut size={16} /> <span className="hidden sm:inline font-bold">Keluar</span>
          </Button>
        </div>
      </header>

      <div className="flex-1 container mx-auto px-4 lg:px-6 py-8 flex gap-8 flex-col lg:flex-row">
        {/* Sidebar */}
        <aside className="w-full lg:w-64 flex-shrink-0">
          <nav className="space-y-1 lg:sticky lg:top-24">
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Menu Utama</p>
            <NavButton active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} icon={<Home size={18} />} label="Ringkasan" />
            <NavButton active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={<BarChart size={18} />} label="Manajemen Ujian" />
            <div className="my-4 border-t border-gray-100"></div>
            <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Data Master</p>
            <NavButton active={activeTab === 'questions'} onClick={() => setActiveTab('questions')} icon={<Database size={18} />} label="Bank Soal" />
            <NavButton active={activeTab === 'classes'} onClick={() => setActiveTab('classes')} icon={<Users size={18} />} label="Kelas & Siswa" />
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 min-w-0">
          <div className="animate-fade-in">
            {activeTab === 'dashboard' && <DashboardOverview />}
            {activeTab === 'exams' && <ExamManager exams={exams} onUpdate={loadExams} />}
            {activeTab === 'classes' && <ClassManager />}
            {activeTab === 'questions' && <QuestionBank />}
          </div>
        </main>
      </div>
    </div>
  );
};

const NavButton: React.FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button 
    onClick={onClick} 
    className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
      active 
      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
      : 'text-gray-600 hover:bg-white hover:text-blue-600 hover:shadow-sm'
    }`}
  >
    {icon}
    <span>{label}</span>
  </button>
);

// --- Dashboard Overview ---
const DashboardOverview: React.FC = () => {
    const [stats, setStats] = useState({ activeExams: 0, completedStudents: 0, onlineStudents: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await db.getGlobalStats();
                setStats(data);
            } catch (e) {
                console.warn("Stats load error (network issue likely)", e);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
        const interval = setInterval(fetchStats, 10000); 
        return () => clearInterval(interval);
    }, []);

    if(loading) return <div className="p-12 text-center text-gray-400 animate-pulse">Memuat data statistik...</div>;

    return (
        <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Selamat Datang, Admin!</h2>
              <p className="text-gray-500">Berikut adalah ringkasan aktivitas ujian hari ini.</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCardLarge 
                    icon={<Monitor size={28} />} 
                    label="Siswa Online" 
                    value={stats.onlineStudents} 
                    color="bg-emerald-500" 
                    textColor="text-emerald-600"
                    bgSoft="bg-emerald-50"
                    desc="Sesi aktif saat ini"
                />
                <StatCardLarge 
                    icon={<UserCheck size={28} />} 
                    label="Siswa Selesai" 
                    value={stats.completedStudents} 
                    color="bg-blue-500" 
                    textColor="text-blue-600"
                    bgSoft="bg-blue-50"
                    desc="Total riwayat selesai"
                />
                <StatCardLarge 
                    icon={<Activity size={28} />} 
                    label="Ujian Aktif" 
                    value={stats.activeExams} 
                    color="bg-violet-500" 
                    textColor="text-violet-600"
                    bgSoft="bg-violet-50"
                    desc="Sedang berlangsung"
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card title="Aktivitas Terbaru" className="h-64 flex items-center justify-center text-gray-400 border-dashed">
                 <p className="text-sm">Belum ada log aktivitas</p>
              </Card>
              <Card title="Status Server" className="h-64 flex items-center justify-center text-gray-400 border-dashed">
                 <div className="text-center">
                   <div className="w-3 h-3 bg-green-500 rounded-full mx-auto mb-2 animate-pulse"></div>
                   <p className="text-sm font-medium text-green-600">Database Connected</p>
                 </div>
              </Card>
            </div>
        </div>
    );
};

const StatCardLarge: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string, textColor: string, bgSoft: string, desc: string }> = ({ icon, label, value, color, textColor, bgSoft, desc }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-start gap-5 hover:shadow-md transition-shadow">
        <div className={`${color} w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-gray-200`}>
            {icon}
        </div>
        <div>
            <p className="text-gray-500 text-sm font-semibold">{label}</p>
            <p className="text-3xl font-bold text-gray-800 my-1">{value}</p>
            <span className={`${bgSoft} ${textColor} px-2 py-0.5 rounded text-xs font-medium`}>{desc}</span>
        </div>
    </div>
);

// --- Exam Management ---
const ExamManager: React.FC<{ exams: Exam[], onUpdate: () => void }> = ({ exams, onUpdate }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formQuestions, setFormQuestions] = useState<Question[]>([]);
  const [availableClasses, setAvailableClasses] = useState<ClassGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newExam, setNewExam] = useState<Partial<Exam>>({ 
    title: '', token: '', durationMinutes: 60, mode: 'GOOGLE_FORM', googleFormUrl: '', assignedClasses: [] 
  });
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  
  // State untuk melacak apakah sedang menggunakan link dari bank soal
  const [isUsingBankLink, setIsUsingBankLink] = useState(false);

  useEffect(() => {
      if(isModalOpen) {
          setErrorMsg('');
          const loadData = async () => {
            try {
                const [qData, cData] = await Promise.all([db.getQuestions(), db.getClasses()]);
                setFormQuestions(qData.filter(q => q.type === 'EXTERNAL_FORM'));
                setAvailableClasses(cData);
            } catch(e: any) {
                console.warn("Failed to load dependency data", e);
                setErrorMsg("Gagal memuat data pendukung. Periksa koneksi internet.");
            }
          }
          loadData();
      }
  }, [isModalOpen]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setScheduleDate(e.target.value);
  };

  const handleOpenCreate = () => {
      setEditingId(null);
      // Set default to today
      const today = new Date();
      const dateStr = today.toISOString().split('T')[0];
      
      setScheduleDate(dateStr);
      setScheduleTime('07:30');
      
      setNewExam({ 
          title: '', 
          token: '', // Initialize empty token
          durationMinutes: 60, 
          mode: 'GOOGLE_FORM', 
          googleFormUrl: '', 
          assignedClasses: [] 
      });
      setIsUsingBankLink(false);
      setIsModalOpen(true);
  };

  const handleOpenEdit = (exam: Exam) => {
      setEditingId(exam.id);
      setNewExam({...exam});
      
      // Check if this url matches any in the bank to set isUsingBankLink
      // Optimization: For now we assume manual edit allows everything unless we strictly track source
      setIsUsingBankLink(false); // Reset to manual mode for editing to allow flexibility, or check against existing qs

      if (exam.startTime) {
          const d = new Date(exam.startTime);
          setScheduleDate(d.toISOString().split('T')[0]);
          setScheduleTime(d.toTimeString().slice(0, 5));
      } else {
          setScheduleDate('');
          setScheduleTime('');
      }
      setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Anda yakin ingin menghapus ujian ini? Data hasil ujian terkait juga akan dihapus.")) return;
      setLoading(true);
      try { await db.deleteExam(id); await onUpdate(); } catch (e: any) { alert("Gagal menghapus ujian: " + e.message); } finally { setLoading(false); }
  };

  const handleSave = async () => {
    if (newExam.title && newExam.token) {
      let startTime = undefined;
      if (scheduleDate && scheduleTime) {
          startTime = new Date(`${scheduleDate}T${scheduleTime}`).toISOString();
      }
      const examData = { ...newExam, startTime };
      setLoading(true);
      try {
          if (editingId) await db.updateExam({ ...examData, id: editingId } as Exam);
          else await db.addExam({ ...examData, id: '', isActive: false } as Exam);
          setIsModalOpen(false);
          onUpdate();
      } catch(e: any) { alert("Gagal menyimpan: " + e.message); } finally { setLoading(false); }
    }
  };

  const toggleStatus = async (id: string, current: boolean) => {
    setLoading(true);
    try { await db.updateExamStatus(id, !current); onUpdate(); } catch (e: any) { alert("Gagal update status: " + e.message); } finally { setLoading(false); }
  };

  const handleSelectFormFromBank = (e: React.ChangeEvent<HTMLSelectElement>) => {
      const qId = e.target.value;
      const q = formQuestions.find(fq => fq.id === qId);
      
      if (q && q.googleFormUrl) {
          // Parse text to get classes. Format expected: "XII-TKJ-1, XII-TKJ-2"
          const classesFromBank = q.text ? q.text.split(',').map(c => c.trim()).filter(Boolean) : [];
          
          setNewExam({
              ...newExam, 
              googleFormUrl: q.googleFormUrl,
              assignedClasses: classesFromBank
          });
          setIsUsingBankLink(true);
      } else {
          // Reset if deselected
          setNewExam({
              ...newExam, 
              googleFormUrl: '',
              assignedClasses: []
          });
          setIsUsingBankLink(false);
      }
  };

  const handleClassToggle = (className: string) => {
      // Jika menggunakan link bank soal, disable manual toggle
      if (isUsingBankLink) return;

      const current = newExam.assignedClasses || [];
      if (current.includes(className)) setNewExam({ ...newExam, assignedClasses: current.filter(c => c !== className) });
      else setNewExam({ ...newExam, assignedClasses: [...current, className] });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
           <h2 className="text-2xl font-bold text-gray-800">Daftar Ujian</h2>
           <p className="text-gray-500 text-sm">Kelola jadwal dan status ujian siswa.</p>
        </div>
        <Button onClick={handleOpenCreate} disabled={loading}><Plus size={18} /> Tambah Ujian</Button>
      </div>
      
      {loading && <div className="w-full h-1 bg-blue-100 overflow-hidden rounded-full"><div className="w-1/3 h-full bg-blue-600 animate-slide"></div></div>}

      <div className="grid gap-4">
        {exams.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3 text-gray-400"><Calendar size={32}/></div>
                <h3 className="text-lg font-bold text-gray-600">Belum ada ujian</h3>
                <p className="text-gray-400">Silakan buat ujian baru untuk memulai.</p>
            </div>
        ) : exams.map(exam => (
          <div key={exam.id} className={`bg-white rounded-xl shadow-sm border border-gray-200 p-5 flex flex-col md:flex-row justify-between gap-4 hover:shadow-md transition-all ${exam.isActive ? 'ring-2 ring-green-500/20 border-green-500/50' : ''}`}>
             <div className="space-y-3 flex-1">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="font-bold text-lg text-gray-800">{exam.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                            {exam.isActive 
                                ? <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-green-100 text-green-700 px-2 py-0.5 rounded-full"><Activity size={10}/> Aktif</span>
                                : <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full"><Square size={10}/> Non-Aktif</span>
                            }
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono border border-blue-100">Token: <b>{exam.token}</b></span>
                        </div>
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm text-gray-600">
                     <div className="flex items-center gap-2"><Clock size={14} className="text-gray-400"/> {exam.durationMinutes} menit</div>
                     <div className="flex items-center gap-2"><Calendar size={14} className="text-gray-400"/> {exam.startTime ? new Date(exam.startTime).toLocaleDateString() : 'Belum dijadwalkan'}</div>
                     <div className="flex items-center gap-2 col-span-2"><Users size={14} className="text-gray-400"/> {exam.assignedClasses?.length ? exam.assignedClasses.join(', ') : 'Semua Kelas'}</div>
                </div>
             </div>
             
             <div className="flex items-center gap-2 self-start md:self-center border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto mt-2 md:mt-0">
                  <Button variant="ghost" className="p-2" onClick={() => handleOpenEdit(exam)} disabled={loading} title="Edit">
                    <Edit size={18} className="text-blue-600" />
                  </Button>
                  <Button variant="ghost" className="p-2" onClick={() => handleDelete(exam.id)} disabled={loading} title="Hapus">
                    <Trash2 size={18} className="text-red-500" />
                  </Button>
                  <Button variant={exam.isActive ? "danger" : "success"} className="text-xs px-3 py-2 w-full md:w-auto" onClick={() => toggleStatus(exam.id, exam.isActive)} disabled={loading}>
                    {exam.isActive ? 'Stop Ujian' : 'Mulai Ujian'}
                  </Button>
             </div>
          </div>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-xl font-bold mb-6 text-gray-800 border-b pb-4">{editingId ? 'Edit Ujian' : 'Buat Ujian Baru'}</h3>
        
        {errorMsg && (
            <div className="mb-4 bg-red-50 p-3 rounded-lg border border-red-100 flex items-start gap-2 text-sm text-red-600">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <p>{errorMsg}</p>
            </div>
        )}

        <div className="space-y-5 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          
          <div className="space-y-4 bg-blue-50/50 p-4 rounded-xl border border-blue-100">
              <div className="space-y-1.5">
                  <label className="text-sm font-bold text-blue-800 flex items-center gap-2"><Database size={14}/> Pilih Soal (Bank Link)</label>
                  <select className="w-full px-3 py-2.5 border border-blue-200 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20" onChange={handleSelectFormFromBank}>
                      <option value="">-- Pilih Link Tersimpan --</option>
                      {formQuestions.map(q => <option key={q.id} value={q.id}>{q.text} ({q.topic})</option>)}
                  </select>
                  <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                      <Info size={12}/> Kelas akan otomatis terisi sesuai pengaturan Bank Soal.
                  </p>
              </div>
              <div className="relative py-2">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-blue-200"></div></div>
                  <div className="relative flex justify-center text-xs uppercase"><span className="bg-blue-50 px-2 text-blue-400 font-bold">Atau Input Manual</span></div>
              </div>
              <div className="space-y-1.5">
                  <label className="text-sm font-semibold text-gray-700">Paste URL Google Form</label>
                  <Input 
                    value={newExam.googleFormUrl} 
                    onChange={e => {
                        setNewExam({...newExam, googleFormUrl: e.target.value});
                        setIsUsingBankLink(false); // Enable manual class selection if manual url input
                    }} 
                    placeholder="https://docs.google.com/forms/..." 
                    className="text-sm" 
                  />
              </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700">Judul Ujian</label>
            <Input value={newExam.title} onChange={e => setNewExam({...newExam, title: e.target.value})} placeholder="Contoh: Penilaian Akhir Semester" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Tanggal Mulai</label>
                <Input type="date" value={scheduleDate} onChange={handleDateChange} />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Waktu Mulai</label>
                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Token</label>
                <Input 
                    value={newExam.token} 
                    onChange={e => setNewExam({...newExam, token: e.target.value.toUpperCase()})}
                    placeholder="TOKEN"
                    className="font-mono uppercase tracking-widest" 
                />
            </div>
            <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700">Durasi (Menit)</label>
                <Input type="number" value={newExam.durationMinutes} onChange={e => setNewExam({...newExam, durationMinutes: parseInt(e.target.value)})} />
            </div>
          </div>

          <div className="space-y-2">
              <label className="text-sm font-semibold text-gray-700 flex justify-between">
                  <span>Enrollment (Peserta Kelas)</span>
                  {isUsingBankLink && <span className="text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded">Otomatis dari Bank Soal</span>}
              </label>
              <div className={`grid grid-cols-2 sm:grid-cols-3 gap-2 border border-gray-200 p-3 rounded-lg max-h-32 overflow-y-auto ${isUsingBankLink ? 'bg-gray-100 opacity-80' : 'bg-gray-50'}`}>
                  {availableClasses.map(cls => (
                      <label key={cls.id} className={`flex items-center gap-2 text-sm p-2 rounded transition-colors ${!isUsingBankLink ? 'cursor-pointer hover:bg-gray-200' : 'cursor-default'} ${newExam.assignedClasses?.includes(cls.name) ? 'bg-blue-100 text-blue-800 font-medium' : ''}`}>
                          <input 
                            type="checkbox" 
                            checked={newExam.assignedClasses?.includes(cls.name) || false} 
                            onChange={() => handleClassToggle(cls.name)} 
                            className="rounded text-blue-600 focus:ring-blue-500" 
                            disabled={isUsingBankLink}
                          />
                          {cls.name}
                      </label>
                  ))}
              </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>Batal</Button>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan Ujian'}</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// --- Question Bank ---
const QuestionBank: React.FC = () => {
    const [questions, setQuestions] = useState<Question[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [isQModalOpen, setIsQModalOpen] = useState(false);
    const [newQ, setNewQ] = useState<Partial<Question>>({ type: 'EXTERNAL_FORM', topic: '', text: '', googleFormUrl: '' });
    const [loading, setLoading] = useState(false);
    const [selectedClasses, setSelectedClasses] = useState<string[]>([]);

    const loadData = async () => {
        setLoading(true);
        try { 
            const [qData, cData] = await Promise.all([
                db.getQuestions(),
                db.getClasses()
            ]);
            setQuestions(qData.filter(q => q.type === 'EXTERNAL_FORM')); 
            setClasses(cData);
        } catch (e) { console.warn("Load failed", e); } finally { setLoading(false); }
    };
    useEffect(() => { loadData(); }, []);

    const handleClassToggle = (className: string) => {
        if (selectedClasses.includes(className)) {
            setSelectedClasses(selectedClasses.filter(c => c !== className));
        } else {
            setSelectedClasses([...selectedClasses, className]);
        }
    };

    const handleOpenModal = () => {
        setNewQ({ type: 'EXTERNAL_FORM', topic: '', text: '', googleFormUrl: '' });
        setSelectedClasses([]);
        setIsQModalOpen(true);
    };

    const handleAddQuestion = async () => {
        // Gabungkan kelas yang dipilih menjadi string
        const classString = selectedClasses.join(', ');

        if(newQ.topic && newQ.googleFormUrl && classString) {
            setLoading(true);
            try { 
                await db.addQuestion({ ...newQ, id: '', type: 'EXTERNAL_FORM', text: classString } as Question); 
                setIsQModalOpen(false); 
                setNewQ({ type: 'EXTERNAL_FORM', topic: '', text: '', googleFormUrl: '' }); 
                setSelectedClasses([]);
                await loadData(); 
            } catch (e: any) { alert("Error: " + e.message); } finally { setLoading(false); }
        } else {
            alert("Harap lengkapi semua form dan pilih minimal satu kelas.");
        }
    };

    const handleDelete = async (id: string) => {
        if(!confirm("Hapus link ini?")) return;
        setLoading(true);
        try { await db.deleteQuestion(id); await loadData(); } catch (e: any) { alert("Error: " + e.message); } finally { setLoading(false); }
    }

    return (
        <Card title="Bank Soal (Google Form)" action={<Button onClick={handleOpenModal} size="sm"><Plus size={16}/> Tambah Link</Button>}>
            {loading ? <p className="text-center text-gray-400 py-8">Memuat data...</p> : (
                <div className="space-y-3">
                    {questions.length === 0 && <p className="text-center text-gray-400 py-10 italic">Belum ada link form tersimpan.</p>}
                    {questions.map(q => (
                        <div key={q.id} className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-blue-400 hover:shadow-md transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded uppercase">{q.topic}</span>
                                </div>
                                <h4 className="font-semibold text-gray-800">{q.text}</h4>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <a href={q.googleFormUrl} target="_blank" rel="noreferrer" className="flex-1 sm:flex-none text-center bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-2">
                                    <Eye size={16}/> Preview
                                </a>
                                <button onClick={(e) => {e.stopPropagation(); handleDelete(q.id);}} disabled={loading} className="bg-red-50 text-red-500 hover:bg-red-100 p-2 rounded-lg transition-colors">
                                    <Trash size={16} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
             <Modal isOpen={isQModalOpen} onClose={() => setIsQModalOpen(false)}>
                <h3 className="font-bold text-lg mb-6 text-gray-800 border-b pb-3">Tambah Link Google Form</h3>
                <div className="space-y-4">
                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">Mata Pelajaran / Topik</label><Input placeholder="Contoh: Bahasa Inggris" value={newQ.topic} onChange={e => setNewQ({...newQ, topic: e.target.value})} /></div>
                    
                    <div className="space-y-1">
                        <label className="text-sm font-medium text-gray-700">Pilih Kelas</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 border border-gray-200 p-3 rounded-lg bg-gray-50 max-h-32 overflow-y-auto">
                            {classes.map(c => (
                                <label key={c.id} className={`flex items-center gap-2 text-sm p-2 rounded cursor-pointer transition-colors ${selectedClasses.includes(c.name) ? 'bg-blue-100 text-blue-800 font-medium' : 'hover:bg-gray-200'}`}>
                                    <input 
                                        type="checkbox" 
                                        checked={selectedClasses.includes(c.name)} 
                                        onChange={() => handleClassToggle(c.name)} 
                                        className="rounded text-blue-600 focus:ring-blue-500" 
                                    />
                                    {c.name}
                                </label>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-1">Pilih kelas yang dapat mengakses soal ini.</p>
                    </div>

                    <div className="space-y-1"><label className="text-sm font-medium text-gray-700">URL Google Form</label><Input placeholder="https://docs.google.com/forms/..." value={newQ.googleFormUrl} onChange={e => setNewQ({...newQ, googleFormUrl: e.target.value})} /></div>
                    <div className="pt-6 flex justify-end gap-3">
                        <Button variant="outline" onClick={() => setIsQModalOpen(false)}>Batal</Button>
                        <Button onClick={handleAddQuestion} disabled={loading}>{loading ? 'Menyimpan...' : 'Simpan'}</Button>
                    </div>
                </div>
            </Modal>
        </Card>
    );
};

// --- Class Manager ---
const ClassManager: React.FC = () => {
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [loading, setLoading] = useState(false);
    
    const loadClasses = async () => { setLoading(true); try { const data = await db.getClasses(); setClasses(data); } catch(e) {console.warn(e);} setLoading(false); };
    useEffect(() => { loadClasses(); }, []);

    const handleAdd = async () => {
        const input = document.getElementById('newClassInput') as HTMLInputElement;
        if(input.value) { setLoading(true); try { await db.addClass(input.value); input.value = ''; await loadClasses(); } catch(e: any) { alert("Error: " + e.message); } finally { setLoading(false); } }
    };

    const handleDelete = async (id: string) => { if(confirm("Hapus kelas ini?")) { setLoading(true); try { await db.deleteClass(id); await loadClasses(); } catch (e: any) { alert("Error: " + e.message); } finally { setLoading(false); } } };

    return (
        <Card title="Manajemen Kelas" className="max-w-2xl">
              <div className="flex gap-3 mb-6 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <Input placeholder="Nama Kelas Baru (Contoh: XII-TKJ-1)" id="newClassInput" className="bg-white" />
                <Button onClick={handleAdd} disabled={loading}><Plus size={18}/> Tambah</Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {classes.map(c => (
                  <div key={c.id} className="flex justify-between items-center p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-400 hover:shadow-sm transition-all group">
                      <span className="font-medium text-gray-700">{c.name}</span>
                      <button onClick={(e) => {e.stopPropagation(); handleDelete(c.id);}} disabled={loading} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-1">
                          <Trash size={16} />
                      </button>
                  </div>
                ))}
              </div>
              {classes.length === 0 && <p className="text-center text-gray-400 mt-4">Belum ada kelas.</p>}
        </Card>
    )
};
