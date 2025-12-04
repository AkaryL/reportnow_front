import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import L from 'leaflet';
import html2canvas from 'html2canvas';

/**
 * Utility function to merge Tailwind CSS classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date to relative time (e.g., "5 minutos", "2 horas")
 */
export function formatRelativeTime(minutes: number): string {
  if (minutes < 1) return 'Ahora';
  if (minutes < 60) return `${Math.floor(minutes)} min`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)} hrs`;
  return `${Math.floor(minutes / 1440)} días`;
}

/**
 * Format date to readable string
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Format speed
 */
export function formatSpeed(speed: number): string {
  return `${Math.round(speed)} km/h`;
}

/**
 * Generate unique ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Export data to CSV
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  filename: string,
  headers?: Record<keyof T, string>
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(data[0]) as (keyof T)[];
  const headerRow = headers
    ? keys.map(key => headers[key] || String(key))
    : keys.map(String);

  const csvContent = [
    headerRow.join(','),
    ...data.map(row =>
      keys.map(key => {
        const value = row[key];
        const stringValue = String(value ?? '');
        // Escape quotes and wrap in quotes if contains comma
        return stringValue.includes(',')
          ? `"${stringValue.replace(/"/g, '""')}"`
          : stringValue;
      }).join(',')
    ),
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Get layout storage key for user and route
 */
export function getLayoutKey(userId: string, route: string): string {
  return `reportnow:layout:${userId}:${route}`;
}

/**
 * Debounce function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

/**
 * Export multi-sheet data to Excel with professional styling
 */
export function exportToExcel(
  sheets: { sheetName: string; data: any[]; headers?: Record<string, string> }[],
  filename: string
): void {
  if (sheets.length === 0) {
    console.warn('No sheets to export');
    return;
  }

  const workbook = XLSX.utils.book_new();

  sheets.forEach(({ sheetName, data, headers }) => {
    if (data.length === 0) {
      // Add empty sheet with headers if no data
      const ws = XLSX.utils.json_to_sheet([]);
      XLSX.utils.book_append_sheet(workbook, ws, sheetName);
      return;
    }

    // Create worksheet from data
    const ws = XLSX.utils.json_to_sheet(data);

    // Get the range of the worksheet
    const range = XLSX.utils.decode_range(ws['!ref'] || 'A1');

    // Set column widths
    const colWidths: any[] = [];
    for (let C = range.s.c; C <= range.e.c; ++C) {
      let maxWidth = 10;
      for (let R = range.s.r; R <= range.e.r; ++R) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        const cell = ws[cellAddress];
        if (cell && cell.v) {
          const cellLength = String(cell.v).length;
          maxWidth = Math.max(maxWidth, Math.min(cellLength + 2, 50));
        }
      }
      colWidths.push({ wch: maxWidth });
    }
    ws['!cols'] = colWidths;

    // Style header row (first row)
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: C });
      if (!ws[cellAddress]) continue;

      ws[cellAddress].s = {
        font: {
          bold: true,
          color: { rgb: "FFFFFF" },
          sz: 12
        },
        fill: {
          fgColor: { rgb: "4472C4" }
        },
        alignment: {
          horizontal: "center",
          vertical: "center",
          wrapText: true
        },
        border: {
          top: { style: "thin", color: { rgb: "000000" } },
          bottom: { style: "thin", color: { rgb: "000000" } },
          left: { style: "thin", color: { rgb: "000000" } },
          right: { style: "thin", color: { rgb: "000000" } }
        }
      };
    }

    // Style data rows with alternating colors
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const isEvenRow = R % 2 === 0;
      for (let C = range.s.c; C <= range.e.c; ++C) {
        const cellAddress = XLSX.utils.encode_cell({ r: R, c: C });
        if (!ws[cellAddress]) continue;

        ws[cellAddress].s = {
          font: {
            sz: 11
          },
          fill: {
            fgColor: { rgb: isEvenRow ? "F2F2F2" : "FFFFFF" }
          },
          alignment: {
            horizontal: "left",
            vertical: "center",
            wrapText: false
          },
          border: {
            top: { style: "thin", color: { rgb: "D3D3D3" } },
            bottom: { style: "thin", color: { rgb: "D3D3D3" } },
            left: { style: "thin", color: { rgb: "D3D3D3" } },
            right: { style: "thin", color: { rgb: "D3D3D3" } }
          }
        };
      }
    }

    // Freeze the header row
    ws['!freeze'] = { xSplit: 0, ySplit: 1 };

    XLSX.utils.book_append_sheet(workbook, ws, sheetName);
  });

  XLSX.writeFile(workbook, `${filename}.xlsx`, { cellStyles: true });
}

/**
 * Export data to PDF (opens print dialog)
 */
export function exportToPDF<T extends Record<string, any>>(
  data: T[],
  filename: string,
  title: string
): void {
  if (data.length === 0) {
    console.warn('No data to export');
    return;
  }

  const keys = Object.keys(data[0]);

  const tableRows = data.map(row =>
    `<tr>${keys.map(key => `<td>${row[key] ?? ''}</td>`).join('')}</tr>`
  ).join('');

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>${filename}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 20px; }
        h1 { color: #1a56db; margin-bottom: 20px; }
        .meta { color: #666; margin-bottom: 20px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th { background-color: #1a56db; color: white; padding: 10px 8px; text-align: left; }
        td { padding: 8px; border-bottom: 1px solid #ddd; }
        tr:nth-child(even) { background-color: #f9f9f9; }
        @media print {
          body { padding: 0; }
          h1 { font-size: 18px; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="meta">
        <p>Generado: ${new Date().toLocaleString('es-MX')}</p>
        <p>Total de registros: ${data.length}</p>
      </div>
      <table>
        <thead>
          <tr>${keys.map(key => `<th>${key}</th>`).join('')}</tr>
        </thead>
        <tbody>
          ${tableRows}
        </tbody>
      </table>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
    };
  }
}

/**
 * Capture real map screenshot using Leaflet and html2canvas
 */
async function captureRealMap(lat: number, lng: number): Promise<string> {
  return new Promise((resolve) => {
    // Create hidden container for the map
    const container = document.createElement('div');
    container.style.cssText = `
      position: fixed;
      left: -9999px;
      top: 0;
      width: 500px;
      height: 300px;
      z-index: -1;
    `;
    document.body.appendChild(container);

    // Create map
    const map = L.map(container, {
      center: [lat, lng],
      zoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(map);

    // Custom marker icon
    const customIcon = L.divIcon({
      className: 'custom-marker',
      html: `
        <div style="
          width: 40px;
          height: 40px;
          position: relative;
        ">
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 30px;
            height: 30px;
            background: rgba(220, 38, 38, 0.3);
            border-radius: 50%;
            animation: pulse 2s infinite;
          "></div>
          <div style="
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -100%);
            width: 0;
            height: 0;
            border-left: 12px solid transparent;
            border-right: 12px solid transparent;
            border-top: 30px solid #dc2626;
            filter: drop-shadow(2px 2px 2px rgba(0,0,0,0.3));
          "></div>
          <div style="
            position: absolute;
            top: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 10px;
            height: 10px;
            background: white;
            border-radius: 50%;
          "></div>
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
    });

    // Add marker
    L.marker([lat, lng], { icon: customIcon }).addTo(map);

    // Wait for tiles to load then capture
    setTimeout(async () => {
      try {
        const canvas = await html2canvas(container, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#e5e7eb',
          scale: 2,
        });

        // Add coordinate overlay
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Bottom bar
          const barHeight = 50;
          const barY = canvas.height - barHeight;

          ctx.fillStyle = 'rgba(17, 24, 39, 0.9)';
          ctx.fillRect(0, barY, canvas.width, barHeight);

          // GPS icon
          ctx.fillStyle = '#3b82f6';
          ctx.beginPath();
          ctx.arc(30, barY + 25, 12, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';
          ctx.beginPath();
          ctx.arc(30, barY + 25, 5, 0, Math.PI * 2);
          ctx.fill();

          // Coordinate text
          ctx.fillStyle = '#9ca3af';
          ctx.font = '14px Arial';
          ctx.fillText('UBICACION GPS', 55, barY + 18);

          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 18px Arial';
          ctx.fillText(`${lat.toFixed(6)}, ${lng.toFixed(6)}`, 55, barY + 38);
        }

        const dataUrl = canvas.toDataURL('image/png');
        resolve(dataUrl);
      } catch {
        resolve('');
      } finally {
        // Cleanup
        map.remove();
        document.body.removeChild(container);
      }
    }, 1500); // Wait for tiles to load
  });
}

export interface EquipmentReportData {
  id: string;
  imei: string;
  serial: string;
  brand: string;
  model: string;
  status: string;
  lat?: number;
  lng?: number;
  speed?: number;
  last_seen?: string;
  created_at: string;
  client?: {
    company_name: string;
    contact_name: string;
    email: string;
    contact_phone: string;
  };
  asset?: {
    name: string;
    type: string;
    plate?: string;
    brand?: string;
    model?: string;
    year?: number;
    color?: string;
  };
  notifications?: {
    title: string;
    description: string;
    priority: string;
    ts: string;
  }[];
}

/**
 * Export professional PDF report with maps and detailed info per equipment
 */
export async function exportProPDF(
  equipments: EquipmentReportData[],
  reportTitle: string,
  filename: string,
  onProgress?: (current: number, total: number) => void
): Promise<void> {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // Colors
  const primaryColor: [number, number, number] = [26, 86, 219]; // Blue
  const grayColor: [number, number, number] = [107, 114, 128];
  const darkColor: [number, number, number] = [31, 41, 55];

  // ===== COVER PAGE =====
  // Header background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, pageWidth, 80, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text(reportTitle, pageWidth / 2, 40, { align: 'center' });

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Reporte Detallado de Equipos GPS', pageWidth / 2, 55, { align: 'center' });

  // Report info box
  doc.setFillColor(249, 250, 251);
  doc.roundedRect(margin, 100, pageWidth - margin * 2, 60, 3, 3, 'F');

  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informacion del Reporte', margin + 10, 115);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...grayColor);

  const reportInfo = [
    `Fecha de generacion: ${new Date().toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`,
    `Total de equipos: ${equipments.length}`,
    `Equipos activos: ${equipments.filter(e => e.status === 'active').length}`,
    `Equipos con ubicacion: ${equipments.filter(e => e.lat && e.lng).length}`,
  ];

  reportInfo.forEach((info, index) => {
    doc.text(info, margin + 10, 128 + index * 8);
  });

  // Summary table
  doc.setTextColor(...darkColor);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumen de Equipos', margin, 185);

  const summaryData = equipments.slice(0, 10).map(eq => [
    eq.imei,
    eq.status === 'active' ? 'Activo' : 'Inactivo',
    eq.client?.company_name || 'Sin cliente',
    eq.asset?.name || 'Sin activo',
  ]);

  autoTable(doc, {
    startY: 190,
    head: [['IMEI', 'Estado', 'Cliente', 'Activo']],
    body: summaryData,
    theme: 'striped',
    headStyles: {
      fillColor: primaryColor,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fontSize: 8,
      textColor: darkColor,
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251],
    },
    margin: { left: margin, right: margin },
  });

  if (equipments.length > 10) {
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`... y ${equipments.length - 10} equipos mas (ver paginas siguientes)`, margin, (doc as any).lastAutoTable.finalY + 10);
  }

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...grayColor);
  doc.text('ReportNow - Sistema de Gestion de Flotas', pageWidth / 2, pageHeight - 10, { align: 'center' });

  // ===== EQUIPMENT DETAIL PAGES =====
  for (let i = 0; i < equipments.length; i++) {
    const eq = equipments[i];
    onProgress?.(i + 1, equipments.length);

    doc.addPage();

    // Header with equipment number
    doc.setFillColor(...primaryColor);
    doc.rect(0, 0, pageWidth, 25, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text(`Equipo ${i + 1} de ${equipments.length}`, margin, 16);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`IMEI: ${eq.imei}`, pageWidth - margin, 16, { align: 'right' });

    let yPos = 35;

    // Equipment info section
    doc.setTextColor(...darkColor);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Informacion del Equipo', margin, yPos);
    yPos += 8;

    // Equipment details table
    const equipmentDetails = [
      ['IMEI', eq.imei],
      ['Serial', eq.serial || 'N/A'],
      ['Marca / Modelo', `${eq.brand || 'N/A'} / ${eq.model || 'N/A'}`],
      ['Estado', eq.status === 'active' ? 'Activo' : 'Inactivo'],
      ['Ultima senal', eq.last_seen ? formatDate(eq.last_seen) : 'Sin registro'],
      ['Velocidad', eq.speed ? `${eq.speed} km/h` : 'N/A'],
      ['Fecha de alta', formatDate(eq.created_at)],
    ];

    autoTable(doc, {
      startY: yPos,
      body: equipmentDetails,
      theme: 'plain',
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 45, textColor: grayColor },
        1: { textColor: darkColor },
      },
      margin: { left: margin, right: pageWidth / 2 + 10 },
    });

    // Client info (right side)
    if (eq.client) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Cliente', pageWidth / 2 + 5, 35);

      const clientDetails = [
        ['Empresa', eq.client.company_name],
        ['Contacto', eq.client.contact_name || 'N/A'],
        ['Email', eq.client.email || 'N/A'],
        ['Telefono', eq.client.contact_phone || 'N/A'],
      ];

      autoTable(doc, {
        startY: 43,
        body: clientDetails,
        theme: 'plain',
        styles: {
          fontSize: 9,
          cellPadding: 2,
        },
        columnStyles: {
          0: { fontStyle: 'bold', cellWidth: 35, textColor: grayColor },
          1: { textColor: darkColor },
        },
        margin: { left: pageWidth / 2 + 5, right: margin },
      });
    }

    yPos = 95;

    // Asset info
    if (eq.asset) {
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 35, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Activo Asignado', margin + 5, yPos + 8);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(`Nombre: ${eq.asset.name}`, margin + 5, yPos + 16);
      doc.text(`Tipo: ${eq.asset.type}`, margin + 5, yPos + 22);
      doc.text(`Placa: ${eq.asset.plate || 'N/A'}`, margin + 5, yPos + 28);

      doc.text(`Marca: ${eq.asset.brand || 'N/A'}`, pageWidth / 2, yPos + 16);
      doc.text(`Modelo: ${eq.asset.model || 'N/A'}`, pageWidth / 2, yPos + 22);
      doc.text(`Color: ${eq.asset.color || 'N/A'}`, pageWidth / 2, yPos + 28);

      yPos += 42;
    }

    // Map section
    const lat = eq.lat ? Number(eq.lat) : null;
    const lng = eq.lng ? Number(eq.lng) : null;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Ultima Ubicacion Registrada', margin, yPos);
      yPos += 5;

      // Capture real map
      try {
        const mapImage = await captureRealMap(lat, lng);
        if (mapImage) {
          doc.addImage(mapImage, 'PNG', margin, yPos, 110, 66);
        } else {
          // Placeholder if map fails
          doc.setFillColor(229, 231, 235);
          doc.rect(margin, yPos, 110, 66, 'F');
          doc.setFontSize(10);
          doc.setTextColor(...grayColor);
          doc.text('Mapa no disponible', margin + 55, yPos + 33, { align: 'center' });
        }
      } catch {
        doc.setFillColor(229, 231, 235);
        doc.rect(margin, yPos, 110, 66, 'F');
        doc.setFontSize(10);
        doc.setTextColor(...grayColor);
        doc.text('Mapa no disponible', margin + 55, yPos + 33, { align: 'center' });
      }

      // Coordinates info (right of map)
      doc.setFillColor(249, 250, 251);
      doc.roundedRect(margin + 115, yPos, 60, 66, 2, 2, 'F');

      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Coordenadas', margin + 120, yPos + 12);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...grayColor);
      doc.text(`Lat:`, margin + 120, yPos + 26);
      doc.setTextColor(...darkColor);
      doc.text(`${lat.toFixed(6)}`, margin + 120, yPos + 34);

      doc.setTextColor(...grayColor);
      doc.text(`Lng:`, margin + 120, yPos + 46);
      doc.setTextColor(...darkColor);
      doc.text(`${lng.toFixed(6)}`, margin + 120, yPos + 54);

      doc.setFontSize(7);
      doc.setTextColor(...primaryColor);
      doc.textWithLink('Ver en Google Maps', margin + 120, yPos + 63, {
        url: `https://www.google.com/maps?q=${lat},${lng}`,
      });

      yPos += 74;
    } else {
      doc.setFillColor(254, 243, 199);
      doc.roundedRect(margin, yPos, pageWidth - margin * 2, 15, 2, 2, 'F');
      doc.setFontSize(9);
      doc.setTextColor(146, 64, 14);
      doc.text('Este equipo no tiene ubicacion registrada', margin + 5, yPos + 10);
      yPos += 22;
    }

    // Notifications timeline
    if (eq.notifications && eq.notifications.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...darkColor);
      doc.text('Historial de Notificaciones', margin, yPos);
      yPos += 5;

      const notifData = eq.notifications.slice(0, 8).map(n => [
        formatDate(n.ts),
        n.priority === 'high' ? 'Alta' : n.priority === 'medium' ? 'Media' : 'Baja',
        n.title,
        n.description.substring(0, 50) + (n.description.length > 50 ? '...' : ''),
      ]);

      autoTable(doc, {
        startY: yPos,
        head: [['Fecha', 'Prioridad', 'Titulo', 'Descripcion']],
        body: notifData,
        theme: 'striped',
        headStyles: {
          fillColor: [107, 114, 128],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 7,
          textColor: darkColor,
        },
        columnStyles: {
          0: { cellWidth: 35 },
          1: { cellWidth: 20 },
          2: { cellWidth: 45 },
          3: { cellWidth: 'auto' },
        },
        margin: { left: margin, right: margin },
      });

      if (eq.notifications.length > 8) {
        doc.setFontSize(7);
        doc.setTextColor(...grayColor);
        doc.text(`+ ${eq.notifications.length - 8} notificaciones adicionales`, margin, (doc as any).lastAutoTable.finalY + 5);
      }
    }

    // Page number
    doc.setFontSize(8);
    doc.setTextColor(...grayColor);
    doc.text(`Pagina ${i + 2} de ${equipments.length + 1}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
  }

  // Save the PDF
  doc.save(`${filename}.pdf`);
}
