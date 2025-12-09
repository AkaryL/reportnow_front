import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tokens de diseño
const COLORS = {
  primary: '#2563eb',
  primarySoft: '#e0edff',
  slate900: '#0f172a',
  slate700: '#334155',
  slate500: '#6b7280',
  neutral50: '#f9fafb',
  neutral100: '#f3f4f6',
  accentGreen: '#16a34a',
  white: '#ffffff',
};

interface EquipmentInfo {
  brand: string;
  model: string;
  imei: string;
  serial: string;
  status: string;
  clientName: string;
  assetName: string;
  simInfo: string;
  lastSignal: string;
}

interface RouteStats {
  totalPoints: number;
  maxSpeed: number;
  avgSpeed: number;
  stoppedPoints: number;
}

interface StatusSegment {
  status: string;
  startTime: string;
  endTime: string;
  duration: number;
  pointCount: number;
}

interface PDFGeneratorOptions {
  equipment: EquipmentInfo;
  dateRange: string;
  routeStats?: RouteStats;
  statusSegments?: StatusSegment[];
  mapElement?: HTMLElement | null;
  timelineElement?: HTMLElement | null;
  statsElement?: HTMLElement | null;
  chartElements?: HTMLElement[];
}

// Función auxiliar para convertir hex a RGB
function hexToRgb(hex: string): [number, number, number] {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? [parseInt(result[1], 16), parseInt(result[2], 16), parseInt(result[3], 16)]
    : [0, 0, 0];
}

// Función para capturar elemento como imagen
async function captureElement(element: HTMLElement): Promise<string | null> {
  try {
    const dataUrl = await toPng(element, {
      cacheBust: true,
      backgroundColor: '#ffffff',
      pixelRatio: 2,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error capturando elemento:', error);
    return null;
  }
}

// Clase para generar PDFs
class PDFGenerator {
  private doc: jsPDF;
  private cursorY: number = 40;
  private marginX: number = 40;
  private pageWidth: number;
  private pageHeight: number;

  constructor() {
    this.doc = new jsPDF('p', 'pt', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  private sectionTitle(text: string) {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(COLORS.slate900));
    this.doc.text(text, this.marginX, this.cursorY);
    this.doc.setDrawColor(...hexToRgb(COLORS.primary));
    this.doc.setLineWidth(0.8);
    this.doc.line(this.marginX, this.cursorY + 4, this.marginX + 40, this.cursorY + 4);
    this.cursorY += 20;
  }

  private drawHeader(title: string, subtitle: string, status: string) {
    const headerHeight = 90;
    this.doc.setFillColor(...hexToRgb(COLORS.primary));
    this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');

    // Logo / nombre sistema
    this.doc.setFontSize(16);
    this.doc.setTextColor(255, 255, 255);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ReportNow', this.marginX, 40);

    // Estado / chip
    const chipText = status.toUpperCase();
    const chipPaddingX = 10;
    const chipWidth = this.doc.getTextWidth(chipText) + chipPaddingX * 2;
    const chipHeight = 18;
    const chipX = this.pageWidth - this.marginX - chipWidth;
    const chipY = 25;

    const chipColor = status === 'active' ? COLORS.accentGreen : COLORS.slate500;
    this.doc.setFillColor(...hexToRgb(chipColor));
    this.doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 9, 9, 'F');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(chipText, chipX + chipPaddingX, chipY + chipHeight - 6);

    // Titulo reporte
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(title, this.marginX, 70);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(226, 232, 240);
    this.doc.text(subtitle, this.marginX, 88);

    this.cursorY = headerHeight + 20;
  }

  private drawEquipmentCard(equipment: EquipmentInfo) {
    const mainCardX = this.marginX;
    const mainCardY = this.cursorY;
    const mainCardW = this.pageWidth - this.marginX * 2;
    const mainCardH = 90;

    this.doc.setFillColor(...hexToRgb(COLORS.neutral50));
    this.doc.roundedRect(mainCardX, mainCardY, mainCardW, mainCardH, 12, 12, 'F');

    // Nombre dispositivo
    this.doc.setTextColor(...hexToRgb(COLORS.slate900));
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${equipment.brand} ${equipment.model}`, mainCardX + 16, mainCardY + 26);

    // Info secundaria
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...hexToRgb(COLORS.slate500));
    this.doc.text(`IMEI: ${equipment.imei} · S/N: ${equipment.serial}`, mainCardX + 16, mainCardY + 44);

    // Mini tarjetas
    const innerTop = mainCardY + 55;
    const colWidth = mainCardW / 4 - 6;

    const cards = [
      { label: 'CLIENTE', value: equipment.clientName },
      { label: 'ACTIVO', value: equipment.assetName },
      { label: 'SIM', value: equipment.simInfo },
      { label: 'ULTIMA SENAL', value: equipment.lastSignal },
    ];

    this.doc.setFontSize(8);
    cards.forEach((card, index) => {
      const x = mainCardX + 12 + index * (colWidth + 6);
      const y = innerTop;

      this.doc.setTextColor(...hexToRgb(COLORS.slate500));
      this.doc.text(card.label, x, y);

      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(COLORS.slate900));
      this.doc.setFont('helvetica', 'bold');

      const lines = this.doc.splitTextToSize(card.value, colWidth - 10);
      this.doc.text(lines, x, y + 12);

      this.doc.setFont('helvetica', 'normal');
      this.doc.setFontSize(8);
    });

    this.cursorY = mainCardY + mainCardH + 24;
  }

  private drawStatsCards(stats: RouteStats) {
    const cardW = (this.pageWidth - this.marginX * 2 - 36) / 4;
    const cardH = 60;

    const statsData = [
      { label: 'Puntos registrados', value: stats.totalPoints.toString(), color: COLORS.primary },
      { label: 'Vel. maxima', value: `${stats.maxSpeed.toFixed(0)} km/h`, color: '#ef4444' },
      { label: 'Vel. promedio', value: `${stats.avgSpeed.toFixed(0)} km/h`, color: COLORS.accentGreen },
      { label: 'Puntos detenido', value: stats.stoppedPoints.toString(), color: COLORS.slate500 },
    ];

    statsData.forEach((stat, i) => {
      const x = this.marginX + i * (cardW + 12);
      const y = this.cursorY;

      this.doc.setFillColor(...hexToRgb(COLORS.white));
      this.doc.roundedRect(x, y, cardW, cardH, 8, 8, 'F');

      this.doc.setFontSize(8);
      this.doc.setTextColor(...hexToRgb(COLORS.slate500));
      this.doc.text(stat.label, x + 10, y + 16);

      this.doc.setFontSize(16);
      this.doc.setTextColor(...hexToRgb(stat.color));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(stat.value, x + 10, y + 40);
      this.doc.setFont('helvetica', 'normal');
    });

    this.cursorY += cardH + 20;
  }

  private drawFilters(dateRange: string) {
    this.doc.setFillColor(...hexToRgb(COLORS.neutral100));
    const filtersH = 50;
    this.doc.roundedRect(this.marginX, this.cursorY, this.pageWidth - this.marginX * 2, filtersH, 10, 10, 'F');

    this.doc.setFontSize(9);
    this.doc.setTextColor(...hexToRgb(COLORS.slate500));

    const filters = [
      { label: 'RANGO DE FECHAS', value: dateRange },
      { label: 'GENERADO', value: format(new Date(), "dd/MM/yyyy HH:mm", { locale: es }) },
    ];

    const colWFilters = (this.pageWidth - this.marginX * 2 - 40) / 2;

    filters.forEach((f, i) => {
      const x = this.marginX + 20 + i * colWFilters;
      const y = this.cursorY + 18;

      this.doc.text(f.label, x, y);
      this.doc.setFontSize(10);
      this.doc.setTextColor(...hexToRgb(COLORS.slate900));
      this.doc.text(f.value, x, y + 16);
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(COLORS.slate500));
    });

    this.cursorY += filtersH + 20;
  }

  private async addImage(imageData: string, height: number = 200) {
    const imgWidth = this.pageWidth - this.marginX * 2;

    // Verificar si necesitamos nueva página
    if (this.cursorY + height > this.pageHeight - 50) {
      this.doc.addPage();
      this.cursorY = 40;
    }

    this.doc.addImage(imageData, 'PNG', this.marginX, this.cursorY, imgWidth, height);
    this.cursorY += height + 20;
  }

  private drawTimeline(segments: StatusSegment[]) {
    const STATUS_LABELS: Record<string, string> = {
      engine_on: 'Encendido',
      moving: 'En movimiento',
      stopped: 'Detenido',
      engine_off: 'Motor apagado',
    };

    const STATUS_COLORS: Record<string, string> = {
      engine_on: '#16a34a',
      moving: '#2563eb',
      stopped: '#f59e0b',
      engine_off: '#6b7280',
    };

    const tableData = segments.map(seg => {
      const start = format(new Date(seg.startTime), 'HH:mm:ss', { locale: es });
      const end = format(new Date(seg.endTime), 'HH:mm:ss', { locale: es });
      const duration = this.formatDuration(seg.duration);
      return [
        STATUS_LABELS[seg.status] || seg.status,
        start,
        end,
        duration,
        seg.pointCount.toString(),
      ];
    });

    autoTable(this.doc, {
      startY: this.cursorY,
      margin: { left: this.marginX, right: this.marginX },
      head: [['Estado', 'Inicio', 'Fin', 'Duracion', 'Puntos']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 9,
        textColor: hexToRgb(COLORS.slate700),
        cellPadding: 8,
      },
      headStyles: {
        fillColor: hexToRgb(COLORS.primary),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: hexToRgb(COLORS.neutral50),
      },
      theme: 'grid',
    });

    this.cursorY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  private formatDuration(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }

  private drawFooter() {
    const footerY = this.pageHeight - 30;
    this.doc.setFontSize(8);
    this.doc.setTextColor(...hexToRgb(COLORS.slate500));
    this.doc.text('Reporte generado desde ReportNow', this.marginX, footerY);

    const pageCount = this.doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      this.doc.text(`Pagina ${i} de ${pageCount}`, this.pageWidth - this.marginX - 60, footerY);
    }
  }

  // Método público para generar PDF completo
  async generateFullReport(options: PDFGeneratorOptions): Promise<void> {
    const { equipment, dateRange, routeStats, statusSegments, mapElement, timelineElement, statsElement } = options;

    this.drawHeader('Reporte Completo', `${equipment.brand} ${equipment.model}`, equipment.status);
    this.drawEquipmentCard(equipment);

    this.sectionTitle('Parametros del reporte');
    this.drawFilters(dateRange);

    if (routeStats) {
      this.sectionTitle('Estadisticas del recorrido');
      this.drawStatsCards(routeStats);
    }

    if (mapElement) {
      this.sectionTitle('Mapa del recorrido');
      const mapImage = await captureElement(mapElement);
      if (mapImage) {
        await this.addImage(mapImage, 250);
      }
    }

    if (statusSegments && statusSegments.length > 0) {
      this.sectionTitle('Timeline de estados');
      this.drawTimeline(statusSegments);
    }

    if (statsElement) {
      this.doc.addPage();
      this.cursorY = 40;
      this.sectionTitle('Graficas y estadisticas');
      const statsImage = await captureElement(statsElement);
      if (statsImage) {
        await this.addImage(statsImage, 400);
      }
    }

    this.drawFooter();
    this.doc.save(`${equipment.brand}_${equipment.model}_reporte_completo_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }

  // Método para generar PDF de historial (mapa + timeline combinados)
  async generateHistoryReport(options: PDFGeneratorOptions): Promise<void> {
    const { equipment, dateRange, routeStats, statusSegments, mapElement } = options;

    this.drawHeader('Historial de Recorrido', `${equipment.brand} ${equipment.model}`, equipment.status);
    this.drawEquipmentCard(equipment);

    this.sectionTitle('Parametros del reporte');
    this.drawFilters(dateRange);

    if (routeStats) {
      this.sectionTitle('Estadisticas del recorrido');
      this.drawStatsCards(routeStats);
    }

    if (mapElement) {
      this.sectionTitle('Mapa del recorrido');
      const mapImage = await captureElement(mapElement);
      if (mapImage) {
        await this.addImage(mapImage, 280);
      }
    }

    if (statusSegments && statusSegments.length > 0) {
      // Verificar si necesitamos nueva página
      if (this.cursorY > this.pageHeight - 200) {
        this.doc.addPage();
        this.cursorY = 40;
      }

      this.sectionTitle('Timeline de estados');
      this.drawTimeline(statusSegments);

      // Resumen de estados
      this.sectionTitle('Resumen por estado');
      const summary: Record<string, { duration: number; count: number }> = {};
      statusSegments.forEach(seg => {
        if (!summary[seg.status]) {
          summary[seg.status] = { duration: 0, count: 0 };
        }
        summary[seg.status].duration += seg.duration;
        summary[seg.status].count += seg.pointCount;
      });

      const STATUS_LABELS: Record<string, string> = {
        engine_on: 'Encendido',
        moving: 'En movimiento',
        stopped: 'Detenido',
        engine_off: 'Motor apagado',
      };

      const summaryData = Object.entries(summary).map(([status, data]) => [
        STATUS_LABELS[status] || status,
        this.formatDuration(data.duration),
        data.count.toString(),
      ]);

      autoTable(this.doc, {
        startY: this.cursorY,
        margin: { left: this.marginX, right: this.marginX },
        head: [['Estado', 'Tiempo total', 'Puntos']],
        body: summaryData,
        styles: {
          font: 'helvetica',
          fontSize: 9,
          textColor: hexToRgb(COLORS.slate700),
          cellPadding: 8,
        },
        headStyles: {
          fillColor: hexToRgb(COLORS.primary),
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        theme: 'grid',
      });
    }

    this.drawFooter();
    this.doc.save(`${equipment.brand}_${equipment.model}_historial_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }

  // Método para generar PDF de estadísticas
  async generateStatsReport(options: PDFGeneratorOptions): Promise<void> {
    const { equipment, dateRange, routeStats, statsElement } = options;

    this.drawHeader('Reporte de Estadisticas', `${equipment.brand} ${equipment.model}`, equipment.status);
    this.drawEquipmentCard(equipment);

    this.sectionTitle('Parametros del reporte');
    this.drawFilters(dateRange);

    if (routeStats) {
      this.sectionTitle('Estadisticas generales');
      this.drawStatsCards(routeStats);
    }

    if (statsElement) {
      this.sectionTitle('Graficas de actividad');
      const statsImage = await captureElement(statsElement);
      if (statsImage) {
        await this.addImage(statsImage, 450);
      }
    }

    this.drawFooter();
    this.doc.save(`${equipment.brand}_${equipment.model}_estadisticas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }
}

// Funciones exportables
export async function generateFullPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator();
  await generator.generateFullReport(options);
}

export async function generateHistoryPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator();
  await generator.generateHistoryReport(options);
}

export async function generateStatsPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator();
  await generator.generateStatsReport(options);
}

// ============ GENERADOR DE PDF PARA LISTAS ============

interface ListPDFOptions {
  title: string;
  subtitle?: string;
  columns: { header: string; key: string; width?: number }[];
  data: Record<string, any>[];
  filename: string;
  filters?: { label: string; value: string }[];
}

export async function generateListPDF(options: ListPDFOptions): Promise<void> {
  const { title, subtitle, columns, data, filename, filters } = options;

  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let cursorY = 40;

  // Header azul
  const headerHeight = 70;
  doc.setFillColor(...hexToRgb(COLORS.primary));
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Logo
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('ReportNow', marginX, 35);

  // Titulo
  doc.setFontSize(18);
  doc.text(title, marginX, 58);

  cursorY = headerHeight + 20;

  // Subtitulo si existe
  if (subtitle) {
    doc.setFontSize(11);
    doc.setTextColor(...hexToRgb(COLORS.slate500));
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, marginX, cursorY);
    cursorY += 20;
  }

  // Filtros aplicados
  if (filters && filters.length > 0) {
    doc.setFillColor(...hexToRgb(COLORS.neutral100));
    const filtersH = 40;
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, filtersH, 8, 8, 'F');

    doc.setFontSize(8);
    const filterWidth = (pageWidth - marginX * 2 - 20) / filters.length;

    filters.forEach((f, i) => {
      const x = marginX + 10 + i * filterWidth;
      doc.setTextColor(...hexToRgb(COLORS.slate500));
      doc.text(f.label.toUpperCase(), x, cursorY + 14);
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(COLORS.slate900));
      doc.text(f.value, x, cursorY + 28);
      doc.setFontSize(8);
    });

    cursorY += filtersH + 15;
  }

  // Info de registros
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(COLORS.slate700));
  doc.text(`Total de registros: ${data.length}`, marginX, cursorY);
  doc.text(`Generado: ${format(new Date(), "dd/MM/yyyy HH:mm", { locale: es })}`, pageWidth - marginX - 150, cursorY);
  cursorY += 20;

  // Tabla
  const tableHeaders = columns.map(col => col.header);
  const tableData = data.map(item =>
    columns.map(col => {
      const value = item[col.key];
      if (value === null || value === undefined) return '-';
      if (typeof value === 'boolean') return value ? 'Si' : 'No';
      return String(value);
    })
  );

  autoTable(doc, {
    startY: cursorY,
    margin: { left: marginX, right: marginX },
    head: [tableHeaders],
    body: tableData,
    styles: {
      font: 'helvetica',
      fontSize: 8,
      textColor: hexToRgb(COLORS.slate700),
      cellPadding: 6,
    },
    headStyles: {
      fillColor: hexToRgb(COLORS.primary),
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    alternateRowStyles: {
      fillColor: hexToRgb(COLORS.neutral50),
    },
    theme: 'grid',
  });

  // Footer
  const footerY = pageHeight - 30;
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(COLORS.slate500));
    doc.text('Reporte generado desde ReportNow', marginX, footerY);
    doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - marginX - 60, footerY);
  }

  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
}

export type { PDFGeneratorOptions, EquipmentInfo, RouteStats, StatusSegment, ListPDFOptions };
