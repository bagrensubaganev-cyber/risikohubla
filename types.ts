
export interface DropdownOption {
  value: string;
  label: string;
  metadata?: Record<string, any>;
}

export interface SpreadsheetData {
  columns: string[];
  rows: Record<string, string>[];
}

export interface RiskProfileSubmission {
  id: string;
  timestamp: string;
  unitKerja: string;
  tahun: string;
  sasaran: string;
  indikator: string;
  seleraRisiko: string;
  prosesBisnis: string;
  aktivitas: string;
  kategoriPenyebab: string;
  peristiwa: string;
  penyebab: string;
  dampak: string;
  kategoriRisiko: string;
  sistemPengendalian: string;
  frekuensiScore: number;
  dampakScore: number;
  besaranRisiko: number;
  levelRisiko: string;
  mitigasiStatus: 'YA' | 'TIDAK';
  rencanaPenanganan: string;
  outputPenanganan: string;
  status?: 'draft' | 'synced';
}
