
import React from 'react';
import { RiskProfileSubmission } from '../types';
import * as XLSX from 'xlsx';
import { Download, FileText, Edit3, Trash2, CloudCheck, Clock } from 'lucide-react';

interface Props {
  submissions: RiskProfileSubmission[];
  onEdit?: (sub: RiskProfileSubmission) => void;
  onDelete?: (id: string) => void;
}

const SubmissionTable: React.FC<Props> = ({ submissions, onEdit, onDelete }) => {
  const handleExport = () => {
    const dataToExport = submissions.map(s => ({
      'Timestamp': new Date(s.timestamp).toLocaleString('id-ID'),
      'Unit Kerja': s.unitKerja,
      'Tahun': s.tahun,
      'Sasaran Kegiatan': s.sasaran,
      'Indikator Kinerja': s.indikator,
      'Selera Risiko': s.seleraRisiko,
      'Proses Bisnis': s.prosesBisnis,
      'Aktivitas': s.aktivitas,
      'Kategori Penyebab': s.kategoriPenyebab,
      'Peristiwa Risiko': s.peristiwa,
      'Penyebab Risiko': s.penyebab,
      'Dampak Risiko': s.dampak,
      'Kategori Risiko': s.kategoriRisiko,
      'Sistem Pengendalian': s.sistemPengendalian,
      'Skor Frekuensi': s.frekuensiScore,
      'Skor Dampak': s.dampakScore,
      'Besaran Risiko': s.besaranRisiko,
      'Level Risiko': s.levelRisiko,
      'Status Mitigasi': s.mitigasiStatus,
      'Rencana Penanganan': s.rencanaPenanganan,
      'Output Penanganan': s.outputPenanganan,
      'Status Data': s.status === 'synced' ? 'Sudah ke Cloud' : 'Draft Lokal'
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Database Profil Risiko");
    
    // Set column widths
    const maxWidths = Object.keys(dataToExport[0] || {}).map(() => ({ wch: 20 }));
    worksheet['!cols'] = maxWidths;

    XLSX.writeFile(workbook, `Profil_Risiko_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (submissions.length === 0) {
    return (
      <div className="py-20 text-center bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
        <FileText className="text-slate-200 mx-auto mb-4" size={48} />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">Database Belum Tersedia</p>
      </div>
    );
  }

  const getBadgeColor = (level: string) => {
    switch (level) {
      case 'Sangat Tinggi': return 'bg-red-100 text-red-600 border-red-200';
      case 'Tinggi': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Sedang': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'Rendah': return 'bg-green-100 text-green-600 border-green-200';
      case 'Sangat Rendah': return 'bg-blue-100 text-blue-600 border-blue-200';
      default: return 'bg-slate-100 text-slate-600 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button 
          onClick={handleExport}
          className="flex items-center gap-3 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-xl text-xs font-bold transition-all shadow-lg shadow-emerald-100 uppercase tracking-widest"
        >
          <Download size={16} /> Unduh Database (Excel)
        </button>
      </div>

      <div className="overflow-hidden border border-slate-100 rounded-3xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <th className="px-6 py-5">Unit & Sasaran</th>
                <th className="px-6 py-5">Peristiwa & Level</th>
                <th className="px-6 py-5 text-center">Status Cloud</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {submissions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50/50 transition-colors group">
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-black text-slate-900">{sub.unitKerja}</span>
                      <span className="text-[10px] text-blue-600 font-bold uppercase line-clamp-1">{sub.sasaran}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs text-slate-600 line-clamp-1 italic font-medium">"{sub.peristiwa}"</span>
                      <div className="flex items-center gap-2">
                         <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border uppercase ${getBadgeColor(sub.levelRisiko)}`}>
                           {sub.levelRisiko} ({sub.besaranRisiko})
                         </span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">{sub.kategoriRisiko}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-center">
                    {sub.status === 'synced' ? (
                      <div className="inline-flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full text-[9px] font-black border border-emerald-100 uppercase">
                        <CloudCheck size={12} /> Tersinkron
                      </div>
                    ) : (
                      <div className="inline-flex items-center gap-1.5 text-amber-600 bg-amber-50 px-3 py-1 rounded-full text-[9px] font-black border border-amber-100 uppercase">
                        <Clock size={12} /> Draft Lokal
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-5 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => onEdit?.(sub)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-blue-600 hover:bg-blue-600 hover:text-white transition-all shadow-sm"
                        title="Edit Data"
                      >
                        <Edit3 size={14} />
                      </button>
                      <button 
                        onClick={() => onDelete?.(sub.id)}
                        className="p-2.5 bg-white border border-slate-200 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                        title="Hapus Data"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default SubmissionTable;
