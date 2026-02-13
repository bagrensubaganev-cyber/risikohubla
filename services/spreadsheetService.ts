
import Papa from 'papaparse';
import { SpreadsheetData, DropdownOption } from '../types';

export const getExportUrl = (url: string): string => {
  const match = url.match(/\/d\/(.+?)\//);
  if (!match) return url;
  const sheetId = match[1];
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
};

// Helper function to find a key in an object regardless of case or spaces
export const getValByHeader = (row: Record<string, string>, headerName: string): string => {
  const target = headerName.toLowerCase().replace(/\s/g, '');
  const key = Object.keys(row).find(k => k.toLowerCase().replace(/\s/g, '') === target);
  return key ? row[key]?.trim() || "" : "";
};

export const fetchSheetData = async (url: string): Promise<SpreadsheetData> => {
  const exportUrl = getExportUrl(url);
  return new Promise((resolve, reject) => {
    Papa.parse(exportUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rawRows = results.data as Record<string, string>[];
        const columns = results.meta.fields || [];
        
        const lastSeenValues: Record<string, string> = {};
        const processedRows = rawRows.map((row) => {
          const newRow = { ...row };
          columns.forEach((col) => {
            const val = newRow[col]?.trim();
            if (val) {
              lastSeenValues[col] = val;
            } else {
              newRow[col] = lastSeenValues[col] || "";
            }
          });
          return newRow;
        });

        resolve({
          columns: columns,
          rows: processedRows,
        });
      },
      error: (error) => reject(error),
    });
  });
};

export const extractOptions = (
  data: SpreadsheetData, 
  columnName: string, 
  metaColumns?: string[]
): DropdownOption[] => {
  const optionsMap = new Map<string, DropdownOption>();
  data.rows.forEach(row => {
    const val = getValByHeader(row, columnName);
    if (val) {
      if (!optionsMap.has(val)) {
        const metadata: Record<string, any> = {};
        metaColumns?.forEach(col => {
          metadata[col] = getValByHeader(row, col);
        });
        optionsMap.set(val, {
          value: val,
          label: val,
          metadata
        });
      }
    }
  });
  return Array.from(optionsMap.values());
};
