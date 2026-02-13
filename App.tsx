
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShieldCheck, 
  Settings, 
  Save, 
  Loader2,
  AlertCircle,
  History,
  Zap,
  PlusCircle,
  Trash2,
  CloudUpload,
  Edit3,
  BarChart3,
  ListChecks,
  LogOut,
  KeyRound,
  FileSpreadsheet,
  FileText,
  X,
  Database
} from 'lucide-react';
import { SpreadsheetData, RiskProfileSubmission } from './types';
import { fetchSheetData, extractOptions, getValByHeader } from './services/spreadsheetService';
import AdvancedDropdown from './components/AdvancedDropdown';
import SubmissionTable from './components/SubmissionTable';
import * as XLSX from 'xlsx';

const DEFAULT_SHEET = "https://docs.google.com/spreadsheets/d/1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms/edit";
const TEMPLATE_PASSWORD = "123456";

const RISK_MATRIX_SCORES = [
  [1, 3, 5, 8, 20],   // Freq 1
  [2, 7, 11, 13, 21], // Freq 2
  [4, 10, 14, 17, 22], // Freq 3
  [6, 12, 16, 19, 24], // Freq 4
  [9, 15, 18, 23, 25]  // Freq 5
];

const getRiskLevelDetail = (score: number) => {
  if (score >= 20) return { name: 'Sangat Tinggi', color: 'bg-red-600', text: 'white' };
  if (score >= 16) return { name: 'Tinggi', color: 'bg-orange-500', text: 'white' };
  if (score >= 12) return { name: 'Sedang', color: 'bg-yellow-400', text: 'slate-900' };
  if (score >= 6) return { name: 'Rendah', color: 'bg-green-600', text: 'white' };
  return { name: 'Sangat Rendah', color: 'bg-blue-500', text: 'white' };
};

const App: React.FC = () => {
  const [sheetUrl, setSheetUrl] = useState(DEFAULT_SHEET);
  const [appsScriptUrl, setAppsScriptUrl] = useState(""); 
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [masterData, setMasterData] = useState<SpreadsheetData | null>(null);
  const [activeTab, setActiveTab] = useState<'form' | 'monitor'>('form');

  // --- Auth State ---
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginUnit, setLoginUnit] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [showLoginSettings, setShowLoginSettings] = useState(false);

  // --- Form State ---
  const [editingId, setEditingId] = useState<string | null>(null);
  const [unitKerja, setUnitKerja] = useState("");
  const [tahun, setTahun] = useState("2025");
  const [sasaran, setSasaran] = useState("");
  const [indikator, setIndikator] = useState("");
  const [seleraRisiko, setSeleraRisiko] = useState("");
  const [prosesBisnis, setProsesBisnis] = useState("");
  const [isManualProbis, setIsManualProbis] = useState(false);
  const [manualProbisText, setManualProbisText] = useState("");
  const [aktivitas, setAktivitas] = useState("");
  const [kategoriPenyebab, setKategoriPenyebab] = useState("");
  const [peristiwa, setPeristiwa] = useState("");
  const [isManualPeristiwa, setIsManualPeristiwa] = useState(false);
  const [manualPeristiwaText, setManualPeristiwaText] = useState("");
  const [penyebab, setPenyebab] = useState("");
  const [dampak, setDampak] = useState("");
  const [kategoriRisiko, setKategoriRisiko] = useState("");
  const [sistemPengendalian, setSistemPengendalian] = useState("");
  
  const [frekuensiScore, setFrekuensiScore] = useState<number>(0);
  const [dampakScore, setDampakScore] = useState<number>(0);

  const [mitigasiStatus, setMitigasiStatus] = useState<'YA' | 'TIDAK'>('YA');
  const [rencanaPenanganan, setRencanaPenanganan] = useState("");
  const [outputPenanganan, setOutputPenanganan] = useState("");

  const [currentBatch, setCurrentBatch] = useState<RiskProfileSubmission[]>([]);
  const [submissions, setSubmissions] = useState<RiskProfileSubmission[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    const savedSheet = localStorage.getItem('sheet_url');
    if (savedSheet) setSheetUrl(savedSheet);
    
    handleLoadData(savedSheet || DEFAULT_SHEET);
    
    const saved = localStorage.getItem('risk_profile_v11');
    const savedUrl = localStorage.getItem('apps_script_url');
    if (saved) setSubmissions(JSON.parse(saved));
    if (savedUrl) setAppsScriptUrl(savedUrl);
  }, []);

  const handleLoadData = async (url: string) => {
    setIsLoading(true);
    try {
      const data = await fetchSheetData(url);
      setMasterData(data);
      localStorage.setItem('sheet_url', url);
      setIsConfiguring(false);
    } catch (e) { 
      console.error(e); 
      setLoginError("Gagal mengambil data dari spreadsheet.");
    } finally { 
      setIsLoading(false); 
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUnit) {
      setLoginError("Pilih Unit Kerja terlebih dahulu.");
      return;
    }
    if (loginPassword !== TEMPLATE_PASSWORD) {
      setLoginError("Password salah.");
      return;
    }
    setUnitKerja(loginUnit);
    setIsLoggedIn(true);
    setLoginError("");
  };

  const handleLogout = () => {
    if (confirm("Apakah anda yakin ingin keluar?")) {
      setIsLoggedIn(false);
      setLoginUnit("");
      setLoginPassword("");
    }
  };

  const besaranRisiko = (frekuensiScore >= 1 && frekuensiScore <= 5 && dampakScore >= 1 && dampakScore <= 5) 
    ? RISK_MATRIX_SCORES[frekuensiScore - 1][dampakScore - 1] 
    : 0;
  
  const levelRisikoDetail = getRiskLevelDetail(besaranRisiko);

  useEffect(() => {
    if (mitigasiStatus === 'YA' && besaranRisiko > 0 && !rencanaPenanganan && !editingId) {
       applyDefaultTemplate(besaranRisiko);
    }
  }, [besaranRisiko, mitigasiStatus, editingId]);

  const applyDefaultTemplate = (score: number) => {
    if (score >= 16) {
       setRencanaPenanganan("Melakukan koordinasi intensif dengan pimpinan unit, melakukan audit kepatuhan khusus secara mingguan, dan mengalokasikan anggaran kontinjensi.");
       setOutputPenanganan("Laporan monitoring mingguan dan Berita Acara hasil audit kepatuhan khusus.");
    } else if (score >= 12) {
       setRencanaPenanganan("Melakukan evaluasi prosedur operasional dan monitoring berkala setiap akhir bulan.");
       setOutputPenanganan("Dokumen hasil evaluasi bulanan dan matriks pemantauan risiko.");
    } else {
       setRencanaPenanganan("Monitoring rutin sesuai prosedur standar operasional (SOP) yang berlaku.");
       setOutputPenanganan("Checklist monitoring rutin triwulanan.");
    }
  };

  const onSasaranChange = (val: string) => {
    setSasaran(val);
    setIndikator("");
    setSeleraRisiko("");
    setProsesBisnis("");
    setPeristiwa("");
  };

  const onIndikatorChange = (val: string, metadata?: any) => {
    setIndikator(val);
    setProsesBisnis("");
    setPeristiwa("");
    setSeleraRisiko(metadata?.selera || "");
  };

  const onProbisChange = (val: string) => {
    if (val === "LAINNYA") {
      setIsManualProbis(true);
      setProsesBisnis("");
    } else {
      setIsManualProbis(false);
      setProsesBisnis(val);
      if (masterData && val) {
        const row = masterData.rows.find(r => getValByHeader(r, 'Proses Bisnis') === val);
        setAktivitas(row ? getValByHeader(row, 'Aktivitas') : "");
      }
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setIndikator(""); setSeleraRisiko(""); setProsesBisnis(""); setAktivitas("");
    setKategoriPenyebab(""); setPeristiwa(""); setManualPeristiwaText("");
    setPenyebab(""); setDampak(""); setKategoriRisiko(""); setSistemPengendalian("");
    setFrekuensiScore(0); setDampakScore(0);
    setRencanaPenanganan(""); setOutputPenanganan(""); 
    setIsManualProbis(false); setManualProbisText("");
    setIsManualPeristiwa(false);
  };

  const addToBatch = () => {
    const finalPeristiwa = isManualPeristiwa ? manualPeristiwaText : peristiwa;
    const finalProbis = isManualProbis ? manualProbisText : prosesBisnis;
    
    if (!finalPeristiwa || !indikator || !unitKerja || !sasaran || frekuensiScore === 0 || dampakScore === 0) {
      return alert("Mohon lengkapi seluruh data termasuk analisis frekuensi dan dampak!");
    }

    const entry: RiskProfileSubmission = {
      id: editingId || Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      unitKerja, tahun, sasaran, indikator, seleraRisiko,
      prosesBisnis: finalProbis, aktivitas, kategoriPenyebab, 
      peristiwa: finalPeristiwa, penyebab, dampak, 
      kategoriRisiko, sistemPengendalian,
      frekuensiScore, dampakScore, besaranRisiko, 
      levelRisiko: levelRisikoDetail.name,
      mitigasiStatus,
      rencanaPenanganan: mitigasiStatus === 'YA' ? rencanaPenanganan : "N/A",
      outputPenanganan: mitigasiStatus === 'YA' ? outputPenanganan : "N/A",
      status: 'draft' as const
    };

    if (editingId) {
      const updated = submissions.map(s => s.id === editingId ? entry : s);
      setSubmissions(updated);
      localStorage.setItem('risk_profile_v11', JSON.stringify(updated));
      alert("Data berhasil diperbarui.");
    } else {
      setCurrentBatch([...currentBatch, entry]);
    }
    clearForm();
  };

  const handleEditSubmission = (sub: RiskProfileSubmission) => {
    setActiveTab('form');
    setEditingId(sub.id);
    setUnitKerja(sub.unitKerja);
    setTahun(sub.tahun);
    setSasaran(sub.sasaran);
    setIndikator(sub.indikator);
    setSeleraRisiko(sub.seleraRisiko);
    
    setProsesBisnis(sub.prosesBisnis);
    setAktivitas(sub.aktivitas);
    setKategoriPenyebab(sub.kategoriPenyebab);
    setPeristiwa(sub.peristiwa);
    setPenyebab(sub.penyebab);
    setDampak(sub.dampak);
    setKategoriRisiko(sub.kategoriRisiko);
    setSistemPengendalian(sub.sistemPengendalian);
    setFrekuensiScore(sub.frekuensiScore);
    setDampakScore(sub.dampakScore);
    setMitigasiStatus(sub.mitigasiStatus);
    setRencanaPenanganan(sub.rencanaPenanganan);
    setOutputPenanganan(sub.outputPenanganan);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const syncToCloud = async () => {
    const unsynced = submissions.filter(s => s.status === 'draft');
    const totalToSync = [...currentBatch, ...unsynced];
    
    if (totalToSync.length === 0) return alert("Semua data sudah sinkron.");
    setIsSyncing(true);

    try {
      if (appsScriptUrl) {
        await fetch(appsScriptUrl, { 
          method: 'POST', 
          mode: 'no-cors', 
          body: JSON.stringify(totalToSync) 
        });
      }

      const syncedIds = totalToSync.map(t => t.id);
      const updated: RiskProfileSubmission[] = [
        ...currentBatch.map(b => ({ ...b, status: 'synced' as const })),
        ...submissions.map(s => syncedIds.includes(s.id) ? { ...s, status: 'synced' as const } : s)
      ];
      
      setSubmissions(updated);
      localStorage.setItem('risk_profile_v11', JSON.stringify(updated));
      setCurrentBatch([]);
      alert("Sinkronisasi berhasil!");
    } catch (e) { 
      alert("Gagal sinkronisasi."); 
    } finally { 
      setIsSyncing(false); 
    }
  };

  const handleExportDraftExcel = () => {
    if (currentBatch.length === 0) return alert("Daftar draft kosong.");
    const dataToExport = currentBatch.map(s => ({
      'Unit Kerja': s.unitKerja,
      'Tahun': s.tahun,
      'Sasaran': s.sasaran,
      'Indikator': s.indikator,
      'Proses Bisnis': s.prosesBisnis,
      'Peristiwa': s.peristiwa,
      'Penyebab': s.penyebab,
      'Dampak': s.dampak,
      'Skor': s.besaranRisiko,
      'Level': s.levelRisiko
    }));
    const ws = XLSX.utils.json_to_sheet(dataToExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Draft Risiko");
    XLSX.writeFile(wb, `Draft_Risiko_${unitKerja}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportDraftPDF = () => {
    if (currentBatch.length === 0) return alert("Daftar draft kosong.");
    window.print();
  };

  const unitOptions = useMemo(() => masterData ? extractOptions(masterData, 'Unit Kerja') : [], [masterData]);
  
  // Menampilkan semua sasaran dari master data tanpa filter unit (Request User)
  const sasaranOptions = useMemo(() => {
    if (!masterData) return [];
    const uniqueSasaran = new Set<string>();
    masterData.rows.forEach(r => {
      const val = getValByHeader(r, 'Sasaran');
      if (val) uniqueSasaran.add(val);
    });
    return Array.from(uniqueSasaran).map(s => ({ value: s, label: s }));
  }, [masterData]);
  
  const filteredIndikator = useMemo(() => {
    if (!masterData || !sasaran) return [];
    const unique = new Map();
    masterData.rows.filter(r => getValByHeader(r, 'Sasaran') === sasaran).forEach(r => {
      const val = getValByHeader(r, 'Indikator');
      if(val) unique.set(val, { value: val, label: val, metadata: { selera: getValByHeader(r, 'Selera Risiko') } });
    });
    return Array.from(unique.values());
  }, [masterData, sasaran]);

  const filteredProbis = useMemo(() => {
    if (!masterData || !sasaran || !indikator) return [];
    const unique = new Map();
    masterData.rows.filter(r => getValByHeader(r, 'Sasaran') === sasaran && getValByHeader(r, 'Indikator') === indikator).forEach(r => {
      const val = getValByHeader(r, 'Proses Bisnis');
      if(val) unique.set(val, { value: val, label: val });
    });
    const options = Array.from(unique.values());
    return [...options, { value: 'LAINNYA', label: '➕ Proses Bisnis Lainnya...' }];
  }, [masterData, sasaran, indikator]);

  const filteredPeristiwa = useMemo(() => {
    const targetProbis = isManualProbis ? "LAINNYA" : prosesBisnis;
    if (!masterData || !targetProbis || !kategoriPenyebab) return [];
    
    const uniqueOptions = new Map();
    masterData.rows
      .filter(r => getValByHeader(r, 'Proses Bisnis') === targetProbis && 
                   getValByHeader(r, 'Kategori Penyebab').toLowerCase().includes(kategoriPenyebab.toLowerCase()))
      .forEach(r => {
        const val = getValByHeader(r, 'Peristiwa Risiko');
        if (val && !uniqueOptions.has(val)) {
          uniqueOptions.set(val, {
            value: val, label: val,
            metadata: { 
              penyebab: getValByHeader(r, 'Penyebab'), 
              dampak: getValByHeader(r, 'Dampak'), 
              kategori: getValByHeader(r, 'Kategori Risiko'), 
              pengendalian: getValByHeader(r, 'Sistem Pengendalian'),
              rencana: getValByHeader(r, 'Rencana Penanganan'),
              output: getValByHeader(r, 'Output Penanganan')
            }
          });
        }
      });
    return [...Array.from(uniqueOptions.values()), { value: 'LAINNYA', label: '➕ Isi Peristiwa Lainnya...' }];
  }, [masterData, prosesBisnis, isManualProbis, kategoriPenyebab]);

  const saveConfig = () => {
    localStorage.setItem('apps_script_url', appsScriptUrl);
    handleLoadData(sheetUrl);
    alert("Konfigurasi disimpan!");
    setIsConfiguring(false);
    setShowLoginSettings(false);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#f4f7fa] flex items-center justify-center p-6 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-100 rounded-full blur-[120px] opacity-50" />

        <div className="w-full max-w-lg bg-white rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] p-12 border border-white/50 backdrop-blur-sm relative z-10">
          <button 
            onClick={() => setShowLoginSettings(!showLoginSettings)} 
            className="absolute top-8 right-8 p-3 rounded-2xl bg-slate-50 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-all border border-slate-100"
          >
            {showLoginSettings ? <X size={20} /> : <Settings size={20} />}
          </button>

          <div className="text-center mb-10">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 w-20 h-20 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-blue-200">
              <ShieldCheck className="text-white" size={40} />
            </div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Portal Risiko</h2>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Ditjen Perhubungan Laut</p>
          </div>

          {showLoginSettings ? (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="p-6 bg-blue-50/50 rounded-3xl border border-blue-100">
                <h3 className="text-xs font-black text-blue-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                   <Database size={14} /> Spreadsheet Master
                </h3>
                <input 
                  type="text" 
                  value={sheetUrl} 
                  onChange={(e) => setSheetUrl(e.target.value)} 
                  className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs outline-none mb-4 focus:border-blue-500" 
                />
                <button 
                  onClick={() => handleLoadData(sheetUrl)} 
                  disabled={isLoading} 
                  className="w-full bg-blue-600 text-white py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                >
                  {isLoading ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />} Simpan & Sinkronkan
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleLogin} className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Unit Kerja</label>
                <AdvancedDropdown 
                  options={unitOptions} 
                  value={loginUnit} 
                  onChange={setLoginUnit} 
                  placeholder="Cari Unit Kerja..." 
                  isLoading={isLoading} 
                  label="" 
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Password Sistem</label>
                <div className="relative">
                  <KeyRound className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                  <input 
                    type="password" 
                    value={loginPassword} 
                    onChange={e => setLoginPassword(e.target.value)} 
                    placeholder="Input Password..." 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl pl-13 pr-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all" 
                  />
                </div>
              </div>

              {loginError && (
                <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center gap-3 text-rose-500 text-[10px] font-bold uppercase tracking-wider">
                   <AlertCircle size={16} /> {loginError}
                </div>
              )}

              <button 
                type="submit" 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-blue-600 transition-all active:scale-[0.98]"
              >
                MASUK SISTEM
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-700 antialiased font-['Inter',sans-serif]">
      {/* PRINT VIEW */}
      <div className="hidden print:block p-10 bg-white">
        <h1 className="text-2xl font-bold mb-4 uppercase">Rekap Draft Profil Risiko</h1>
        <div className="grid grid-cols-2 gap-4 mb-8 text-sm">
           <p><strong>Unit Kerja:</strong> {unitKerja}</p>
           <p><strong>Tanggal Cetak:</strong> {new Date().toLocaleString('id-ID')}</p>
        </div>
        <table className="w-full border-collapse border border-slate-300">
           <thead>
             <tr className="bg-slate-100">
               <th className="border border-slate-300 p-2 text-xs">Sasaran</th>
               <th className="border border-slate-300 p-2 text-xs">Peristiwa</th>
               <th className="border border-slate-300 p-2 text-xs">Skor</th>
               <th className="border border-slate-300 p-2 text-xs">Level</th>
             </tr>
           </thead>
           <tbody>
             {currentBatch.map(s => (
               <tr key={s.id}>
                 <td className="border border-slate-300 p-2 text-[10px]">{s.sasaran}</td>
                 <td className="border border-slate-300 p-2 text-[10px]">{s.peristiwa}</td>
                 <td className="border border-slate-300 p-2 text-[10px] text-center">{s.besaranRisiko}</td>
                 <td className="border border-slate-300 p-2 text-[10px] text-center font-bold">{s.levelRisiko}</td>
               </tr>
             ))}
           </tbody>
        </table>
      </div>

      <nav className="bg-white/80 backdrop-blur-md border-b border-slate-200 h-20 sticky top-0 z-50 px-8 flex items-center justify-between shadow-sm print:hidden">
        <div className="flex items-center gap-4">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><ShieldCheck className="w-6 h-6 text-white" /></div>
          <div>
            <h1 className="text-lg font-bold text-slate-900 leading-tight">Profil Risiko Digital</h1>
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-3 py-0.5 rounded-full border border-blue-100">
              {unitKerja}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button onClick={() => setActiveTab('form')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'form' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>PENGISIAN</button>
            <button onClick={() => setActiveTab('monitor')} className={`px-6 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'monitor' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-800'}`}>DATABASE MONITOR</button>
          </div>
          <button onClick={() => setIsConfiguring(!isConfiguring)} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-400 hover:text-blue-600 transition-all"><Settings size={20} /></button>
          <button onClick={handleLogout} className="flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-500 border border-rose-100 rounded-xl text-xs font-black uppercase hover:bg-rose-500 hover:text-white transition-all">
            <LogOut size={16} /> Keluar
          </button>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-8 print:hidden">
        {isConfiguring && (
          <div className="bg-white border border-slate-200 p-8 rounded-3xl mb-10 shadow-xl animate-in slide-in-from-top-4">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div>
                   <h3 className="text-xs font-black mb-4 text-slate-400 uppercase tracking-widest">Spreadsheet Master</h3>
                   <input type="text" value={sheetUrl} onChange={e => setSheetUrl(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm focus:ring-4 focus:ring-blue-500/10 outline-none" />
                </div>
                <div>
                   <h3 className="text-xs font-black mb-4 text-slate-400 uppercase tracking-widest">Apps Script API</h3>
                   <div className="flex gap-2">
                      <input type="text" value={appsScriptUrl} onChange={e => setAppsScriptUrl(e.target.value)} placeholder="https://script.google.com/..." className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10" />
                      <button onClick={saveConfig} className="bg-slate-900 text-white px-8 py-3 rounded-xl text-xs font-bold uppercase hover:bg-black transition-all">Update</button>
                   </div>
                </div>
             </div>
          </div>
        )}

        {activeTab === 'form' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8 space-y-8">
              <div className="bg-white border border-slate-200 rounded-[2rem] p-10 shadow-sm relative">
                <div className="flex items-center gap-4 mb-10">
                   <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-600 font-bold">1</div>
                   <div>
                      <h2 className="text-xl font-bold text-slate-900">Identitas Pengisian</h2>
                      <p className="text-xs text-slate-500">Informasi unit dan sasaran strategis</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                   <div className="md:col-span-3">
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🏢 Unit Kerja Terpilih</label>
                      <div className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-black text-slate-900">
                         {unitKerja}
                      </div>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📅 Tahun</label>
                      <input type="number" value={tahun} onChange={e => setTahun(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-bold focus:bg-white outline-none" />
                   </div>
                   <div className="md:col-span-4">
                      <AdvancedDropdown label="🎯 Sasaran Kegiatan" options={sasaranOptions} value={sasaran} onChange={onSasaranChange} />
                   </div>
                </div>
              </div>

              <div className={`bg-white border border-slate-200 rounded-[2rem] p-10 shadow-xl transition-all ${!sasaran ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                <div className="flex items-center justify-between mb-10">
                   <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold">2</div>
                      <h2 className="text-xl font-bold text-slate-900">{editingId ? 'Edit Analisis Risiko' : 'Detail Analisis Risiko'}</h2>
                   </div>
                   {editingId && (
                     <button onClick={clearForm} className="text-[10px] font-bold bg-amber-50 text-amber-600 px-4 py-2 rounded-full border border-amber-100 uppercase tracking-widest">Batal Edit</button>
                   )}
                </div>

                <div className="space-y-8">
                   <AdvancedDropdown label="📈 Indikator Kinerja" options={filteredIndikator} value={indikator} onChange={onIndikatorChange} />
                   
                   {seleraRisiko && (
                      <div className="p-5 bg-blue-600 rounded-2xl flex items-center gap-5 text-white shadow-xl animate-in slide-in-from-left-4">
                         <AlertCircle size={24} />
                         <div>
                            <p className="text-[10px] font-bold uppercase opacity-70 tracking-widest">🛡️ Selera Risiko Terdeteksi</p>
                            <p className="text-lg font-bold leading-tight">{seleraRisiko}</p>
                         </div>
                      </div>
                   )}

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <AdvancedDropdown label="🔗 Proses Bisnis" options={filteredProbis} value={isManualProbis ? "LAINNYA" : prosesBisnis} onChange={onProbisChange} />
                        {isManualProbis && (
                          <textarea value={manualProbisText} onChange={e => setManualProbisText(e.target.value)} placeholder="Tulis Proses Bisnis secara manual..." className="w-full mt-2 bg-blue-50 border border-blue-100 rounded-xl px-4 py-3 text-sm focus:bg-white outline-none" />
                        )}
                        {prosesBisnis && aktivitas && (
                           <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                              <Zap size={14} className="text-amber-500" /> 
                              <span><strong>Aktivitas:</strong> {aktivitas}</span>
                           </div>
                        )}
                      </div>
                      <AdvancedDropdown label="🛠️ Kategori Penyebab" options={[{value:'Man',label:'Man'},{value:'Money',label:'Money'},{value:'Method',label:'Method'},{value:'Machine',label:'Machine'},{value:'Material',label:'Material'},{value:'External',label:'External'}]} value={kategoriPenyebab} onChange={setKategoriPenyebab} />
                   </div>

                   <div className="space-y-6">
                      <AdvancedDropdown label="⚠️ Peristiwa Risiko" options={filteredPeristiwa} value={isManualPeristiwa ? 'LAINNYA' : peristiwa} onChange={(v, m) => {
                         if(v==='LAINNYA') { setIsManualPeristiwa(true); setPeristiwa(""); }
                         else { 
                           setIsManualPeristiwa(false); setPeristiwa(v);
                           if(m) { 
                             setPenyebab(m.penyebab); 
                             setDampak(m.dampak); 
                             setKategoriRisiko(m.kategori); 
                             setSistemPengendalian(m.pengendalian); 
                             setRencanaPenanganan(m.rencana || "");
                             setOutputPenanganan(m.output || "");
                           }
                         }
                      }} />
                      {isManualPeristiwa && (
                        <textarea value={manualPeristiwaText} onChange={e=>setManualPeristiwaText(e.target.value)} placeholder="Tulis peristiwa risiko secara manual..." className="w-full bg-blue-50/30 border border-blue-100 rounded-2xl px-6 py-4 text-sm outline-none focus:bg-white" />
                      )}
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">📍 Penyebab Risiko</label>
                        <textarea value={penyebab} onChange={e=>setPenyebab(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none focus:bg-white transition-all" />
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">💥 Dampak Risiko</label>
                        <textarea value={dampak} onChange={e=>setDampak(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm min-h-[100px] outline-none focus:bg-white transition-all" />
                      </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <AdvancedDropdown 
                        label="📂 Kategori Risiko" 
                        options={[
                          {value:'Risiko Hukum',label:'Risiko Hukum'},
                          {value:'Risiko Bencana',label:'Risiko Bencana'},
                          {value:'Risiko Kecurangan',label:'Risiko Kecurangan'},
                          {value:'Risiko Kepatuhan',label:'Risiko Kepatuhan'},
                          {value:'Risiko Operasional',label:'Risiko Operasional'},
                          {value:'Risiko Reputasi',label:'Risiko Reputasi'}
                        ]} 
                        value={kategoriRisiko} 
                        onChange={setKategoriRisiko} 
                      />
                      <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">🛡️ Sistem Pengendalian</label>
                        <textarea value={sistemPengendalian} onChange={e=>setSistemPengendalian(e.target.value)} placeholder="Sistem kontrol yang sudah ada..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 text-sm min-h-[80px] outline-none focus:bg-white transition-all" />
                      </div>
                   </div>

                   <div className="p-8 bg-blue-50/50 rounded-3xl border border-blue-100 space-y-8">
                      <div className="flex items-center gap-3 mb-2">
                         <BarChart3 className="text-blue-600" />
                         <h3 className="font-bold text-blue-900">Analisis Besaran & Level Risiko</h3>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <AdvancedDropdown 
                           label="📊 Tingkat Frekuensi" 
                           options={[{value:'5',label:'Hampir pasti terjadi (5)'},{value:'4',label:'Sering terjadi (4)'},{value:'3',label:'Kadang terjadi (3)'},{value:'2',label:'Jarang terjadi (2)'},{value:'1',label:'Hampir tidak terjadi (1)'}]} 
                           value={frekuensiScore > 0 ? frekuensiScore.toString() : ""} 
                           onChange={(v)=>setFrekuensiScore(parseInt(v))} 
                         />
                         <AdvancedDropdown 
                           label="🌊 Tingkat Dampak" 
                           options={[{value:'5',label:'Sangat Signifikan (5)'},{value:'4',label:'Signifikan (4)'},{value:'3',label:'Moderat (3)'},{value:'2',label:'Minor (2)'},{value:'1',label:'Tidak Signifikan (1)'}]} 
                           value={dampakScore > 0 ? dampakScore.toString() : ""} 
                           onChange={(v)=>setDampakScore(parseInt(v))} 
                         />
                      </div>
                      
                      {besaranRisiko > 0 && (
                        <div className={`p-6 rounded-2xl flex items-center justify-between ${levelRisikoDetail.color} text-${levelRisikoDetail.text} shadow-xl shadow-blue-200 transition-all duration-500 scale-in`}>
                           <div>
                              <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">📉 Besaran Risiko</p>
                              <p className="text-4xl font-black">{besaranRisiko}</p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-bold uppercase opacity-80 tracking-widest">Level Risiko</p>
                              <p className="text-2xl font-bold">{levelRisikoDetail.name.toUpperCase()}</p>
                           </div>
                        </div>
                      )}
                   </div>

                   <div className="p-8 bg-slate-50 rounded-3xl flex items-center justify-between border border-slate-100">
                      <div>
                         <h4 className="font-bold text-slate-900 text-sm">Rencana mitigasi?</h4>
                         <p className="text-xs text-slate-500">Otomatis terisi template jika "YA"</p>
                      </div>
                      <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                         <button type="button" onClick={()=>setMitigasiStatus('YA')} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all ${mitigasiStatus==='YA'?'bg-slate-900 text-white shadow-md':'text-slate-400'}`}>YA</button>
                         <button type="button" onClick={()=>setMitigasiStatus('TIDAK')} className={`px-8 py-2.5 rounded-lg text-xs font-bold transition-all ${mitigasiStatus==='TIDAK'?'bg-slate-400 text-white shadow-md':'text-slate-400'}`}>TIDAK</button>
                      </div>
                   </div>

                   {mitigasiStatus==='YA' && (
                     <div className="space-y-6 animate-in slide-in-from-bottom-2">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">Rencana Penanganan</label>
                              <textarea value={rencanaPenanganan} onChange={e=>setRencanaPenanganan(e.target.value)} placeholder="Tulis rencana..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:bg-white min-h-[100px]" />
                           </div>
                           <div>
                              <label className="block text-[10px] font-bold text-slate-400 mb-1">Output Penanganan</label>
                              <textarea value={outputPenanganan} onChange={e=>setOutputPenanganan(e.target.value)} placeholder="Tulis output..." className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-medium outline-none focus:bg-white min-h-[100px]" />
                           </div>
                        </div>
                     </div>
                   )}

                   <button type="button" onClick={addToBatch} className={`w-full ${editingId ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'} text-white py-6 rounded-[2rem] font-bold text-sm uppercase tracking-widest shadow-xl transition-all flex items-center justify-center gap-3 active:scale-[0.98]`}>
                      {editingId ? <Save size={20} /> : <PlusCircle size={20} />}
                      {editingId ? 'Simpan Perubahan' : 'Tambah ke Daftar Risiko'}
                   </button>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 space-y-8">
               <div className="bg-white border border-slate-200 rounded-[2rem] p-8 shadow-sm sticky top-28 border-t-8 border-t-blue-600 flex flex-col min-h-[600px]">
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-slate-100">
                     <div>
                        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2"><ListChecks size={18} className="text-blue-600" /> Daftar Risiko Terpilih</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-wider">{currentBatch.length} Risiko Baru</p>
                     </div>
                  </div>

                  {currentBatch.length === 0 ? (
                    <div className="flex-1 flex flex-col items-center justify-center opacity-40 italic text-xs text-center p-10">
                       <History size={32} className="mb-4 text-slate-200" />
                       <p className="text-[10px] font-black uppercase tracking-widest text-slate-300">Belum ada risiko dipilih</p>
                    </div>
                  ) : (
                    <div className="flex-1 space-y-4 mb-8 overflow-y-auto pr-2 custom-scrollbar">
                       {currentBatch.map((item) => (
                         <div key={item.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-start justify-between relative group hover:bg-blue-50/30 transition-colors">
                            <div className="flex-1 min-w-0 pr-3">
                               <p className="text-[10px] font-bold text-blue-600 truncate uppercase tracking-tighter mb-1">{item.sasaran}</p>
                               <p className="text-[12px] font-medium text-slate-700 line-clamp-2 italic leading-tight mb-2">"{item.peristiwa}"</p>
                               <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${getRiskLevelDetail(item.besaranRisiko).color} text-white`}>Score: {item.besaranRisiko}</span>
                            </div>
                            <button 
                              onClick={()=>setCurrentBatch(currentBatch.filter(b=>b.id!==item.id))} 
                              className="text-slate-300 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                         </div>
                       ))}
                    </div>
                  )}

                  <div className="space-y-3 pt-6 border-t border-slate-100">
                    <button 
                      disabled={currentBatch.length === 0 && submissions.filter(s=>s.status==='draft').length === 0 || isSyncing}
                      onClick={syncToCloud}
                      className="w-full bg-slate-900 disabled:bg-slate-100 text-white py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-3 hover:bg-black transition-all active:scale-[0.98]"
                    >
                      {isSyncing ? <Loader2 size={18} className="animate-spin" /> : <CloudUpload size={18} />}
                      Kirim ke Cloud
                    </button>
                    
                    <div className="grid grid-cols-2 gap-3">
                       <button 
                        onClick={handleExportDraftExcel}
                        className="flex-1 bg-emerald-50 text-emerald-600 border border-emerald-100 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-600 hover:text-white transition-all"
                       >
                         <FileSpreadsheet size={16} /> Excel
                       </button>
                       <button 
                        onClick={handleExportDraftPDF}
                        className="flex-1 bg-slate-100 text-slate-600 border border-slate-200 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-900 hover:text-white transition-all"
                       >
                         <FileText size={16} /> PDF
                       </button>
                    </div>
                  </div>
               </div>
            </div>
          </div>
        ) : (
          <div className="space-y-10 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm flex items-center justify-between">
                <div>
                   <h2 className="text-2xl font-bold text-slate-900">Database & Monitor</h2>
                   <p className="text-sm text-slate-500">Unit: <strong>{unitKerja}</strong></p>
                </div>
                <div className="bg-blue-50 text-blue-600 px-6 py-3 rounded-2xl border border-blue-100 flex items-center gap-3">
                   <Edit3 size={18} />
                   <span className="text-[11px] font-bold uppercase tracking-widest">Mode Monitor Aktif</span>
                </div>
             </div>
             
             <div className="bg-white rounded-[2.5rem] p-10 border border-slate-200 shadow-sm">
                <SubmissionTable 
                  submissions={submissions.filter(s => s.unitKerja === unitKerja)} 
                  onEdit={handleEditSubmission}
                  onDelete={(id) => {
                    if (confirm("Hapus data ini?")) {
                      const updated = submissions.filter(s => s.id !== id);
                      setSubmissions(updated);
                      localStorage.setItem('risk_profile_v11', JSON.stringify(updated));
                    }
                  }}
                />
             </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
