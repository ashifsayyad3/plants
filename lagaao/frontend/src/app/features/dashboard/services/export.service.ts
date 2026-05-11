import { Injectable } from '@angular/core';

/**
 * Lazy-loads xlsx and jspdf at call time so they don't bloat the initial bundle.
 * Install:  npm i xlsx jspdf jspdf-autotable
 */
@Injectable({ providedIn: 'root' })
export class ExportService {

  // ── Excel ────────────────────────────────────────────────────────────────────

  async exportToExcel<T extends Record<string, unknown>>(
    rows: T[],
    filename = 'export',
    sheetName = 'Data',
  ): Promise<void> {
    const XLSX = await import('xlsx');
    const ws   = XLSX.utils.json_to_sheet(rows);
    const wb   = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, `${filename}.xlsx`);
  }

  // ── PDF ──────────────────────────────────────────────────────────────────────

  async exportToPdf<T extends Record<string, unknown>>(
    rows: T[],
    columns: { header: string; dataKey: keyof T }[],
    filename = 'export',
    title    = 'Export',
  ): Promise<void> {
    const { default: jsPDF } = await import('jspdf');
    const autoTable          = (await import('jspdf-autotable')).default;

    const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });

    doc.setFontSize(16);
    doc.text(title, 40, 40);
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text(`Generated: ${new Date().toLocaleString()}`, 40, 58);

    autoTable(doc, {
      startY: 70,
      head: [columns.map((c) => c.header)],
      body: rows.map((row) => columns.map((c) => String(row[c.dataKey] ?? ''))),
      styles:     { fontSize: 9, cellPadding: 6 },
      headStyles: { fillColor: [92, 53, 199], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 247, 255] },
    });

    doc.save(`${filename}.pdf`);
  }

  // ── CSV (no extra dep) ────────────────────────────────────────────────────────

  exportToCsv<T extends Record<string, unknown>>(rows: T[], filename = 'export'): void {
    if (!rows.length) return;
    const keys    = Object.keys(rows[0]) as (keyof T)[];
    const header  = keys.join(',');
    const body    = rows.map((r) => keys.map((k) => `"${String(r[k] ?? '').replace(/"/g, '""')}"`).join(','));
    const csv     = [header, ...body].join('\n');
    const blob    = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url     = URL.createObjectURL(blob);
    const a       = Object.assign(document.createElement('a'), { href: url, download: `${filename}.csv` });
    a.click();
    URL.revokeObjectURL(url);
  }
}
