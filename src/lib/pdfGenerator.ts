import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Tokens de diseño - Colores del sistema (Light Mode)
const COLORS_LIGHT = {
  // Primary (Turquesa/Teal)
  primary: '#1fb6aa',
  primaryLight: '#ccfbf3',
  primary50: '#f0fdfb',

  // Info (Azul)
  info: '#0ea5e9',
  infoLight: '#e0f2fe',

  // OK/Success (Verde)
  ok: '#10b981',
  okLight: '#dcfce7',

  // Warning (Amarillo/Naranja)
  warn: '#f59e0b',
  warnLight: '#fef3c7',

  // Critical/Error (Rojo)
  crit: '#ef4444',
  critLight: '#fee2e2',

  // Púrpura
  purple: '#8b5cf6',
  purpleLight: '#f3e8ff',

  // Cyan
  cyan: '#06b6d4',
  cyanLight: '#cffafe',

  // Amber
  amber: '#f59e0b',
  amberLight: '#fef3c7',

  // Neutrals - Light Mode
  background: '#ffffff',
  cardBg: '#ffffff',
  cardBorder: '#e5e7eb',
  textPrimary: '#0f172a',
  textSecondary: '#334155',
  textMuted: '#6b7280',
  textLight: '#94a3b8',
  neutral50: '#f9fafb',
  neutral100: '#f3f4f6',
  neutral200: '#e5e7eb',
  headerBg: '#1fb6aa',
  headerText: '#ffffff',
  white: '#ffffff',
};

// Tokens de diseño - Colores del sistema (Dark Mode)
const COLORS_DARK = {
  // Primary (Turquesa/Teal)
  primary: '#1fb6aa',
  primaryLight: '#134e4a',
  primary50: '#042f2e',

  // Info (Azul)
  info: '#38bdf8',
  infoLight: '#0c4a6e',

  // OK/Success (Verde)
  ok: '#34d399',
  okLight: '#064e3b',

  // Warning (Amarillo/Naranja)
  warn: '#fbbf24',
  warnLight: '#78350f',

  // Critical/Error (Rojo)
  crit: '#f87171',
  critLight: '#7f1d1d',

  // Púrpura
  purple: '#a78bfa',
  purpleLight: '#4c1d95',

  // Cyan
  cyan: '#22d3ee',
  cyanLight: '#164e63',

  // Amber
  amber: '#fbbf24',
  amberLight: '#78350f',

  // Neutrals - Dark Mode
  background: '#111827',
  cardBg: '#1f2937',
  cardBorder: '#374151',
  textPrimary: '#f9fafb',
  textSecondary: '#e5e7eb',
  textMuted: '#9ca3af',
  textLight: '#6b7280',
  neutral50: '#1f2937',
  neutral100: '#374151',
  neutral200: '#4b5563',
  headerBg: '#134e4a',
  headerText: '#ccfbf1',
  white: '#1f2937', // In dark mode, "white" backgrounds become dark gray
};

// Tipo para los colores
type ThemeColors = typeof COLORS_LIGHT;

// Función para obtener colores según el tema
function getThemeColors(darkMode: boolean): ThemeColors {
  return darkMode ? COLORS_DARK : COLORS_LIGHT;
}

// Mantener COLORS para compatibilidad (usa light por defecto)
const COLORS = COLORS_LIGHT;

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
  // Nuevos datos para PDF nativo
  statsData?: StatsPDFData;
  selectedSections?: string[];
  // Tema oscuro/claro
  darkMode?: boolean;
}

// Interface para datos de estadísticas del PDF (generación nativa)
interface RouteStatsItemPDF {
  ruta: number;
  inicio: string;
  fin: string;
  km_recorridos: number;
  velocidad_promedio: number;
  velocidad_maxima: number;
  tiempo_marcha_horas: number;
  tiempo_ralenti_horas: number;
  tiempo_total_horas: number;
  puntos: number;
}

interface StatsPDFData {
  // Resumen general (8 métricas)
  summary: {
    totalRutas: number;
    kmRecorridos: number;
    velMaxima: number;
    velPromedio: number;
    horasMarcha: number;
    horasRalenti: number;
    horasTotales: number;
    puntosRegistrados: number;
  };

  // Tabla de rutas
  rutas: RouteStatsItemPDF[];

  // Datos para gráfico de velocidad en tiempo (muestreado)
  speedTimeline: Array<{ time: string; speed: number }>;

  // Distribución de velocidad
  speedDistribution: Array<{ range: string; count: number; color: string }>;

  // Estado de movimiento
  movementState: Array<{ label: string; value: number; color: string; percent: number }>;

  // Análisis detallado
  analysis: {
    movingPoints: number;
    movingPercent: number;
    speedExcessPoints: number;
    speedExcessPercent: number;
    highSpeedPoints: number;
    highSpeedPercent: number;
    stoppedPoints: number;
    stoppedPercent: number;
  };

  // Período
  period: {
    firstRecord: string;
    lastRecord: string;
  };

  // Ranking de conductores
  ranking?: {
    currentDriver: {
      name: string;
      phone: string;
      licenseNumber: string;
    } | null;
    otherDrivers: Array<{
      name: string;
      status: string;
    }>;
  };
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
  private darkMode: boolean = false;
  private colors: ThemeColors = COLORS_LIGHT;

  constructor(darkMode: boolean = false) {
    this.doc = new jsPDF('p', 'pt', 'a4');
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.darkMode = darkMode;
    this.colors = getThemeColors(darkMode);

    // Si es modo oscuro, pintar el fondo de la primera página
    if (darkMode) {
      this.doc.setFillColor(...hexToRgb(this.colors.background));
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    }
  }

  // Método para agregar nueva página con fondo correcto
  private addPageWithBackground() {
    this.doc.addPage();
    if (this.darkMode) {
      this.doc.setFillColor(...hexToRgb(this.colors.background));
      this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
    }
  }

  private sectionTitle(text: string) {
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
    this.doc.text(text, this.marginX, this.cursorY);
    this.doc.setDrawColor(...hexToRgb(this.colors.primary));
    this.doc.setLineWidth(0.8);
    this.doc.line(this.marginX, this.cursorY + 4, this.marginX + 40, this.cursorY + 4);
    this.cursorY += 20;
  }

  private drawHeader(title: string, subtitle: string, status: string) {
    const headerHeight = 90;
    this.doc.setFillColor(...hexToRgb(this.colors.headerBg));
    this.doc.rect(0, 0, this.pageWidth, headerHeight, 'F');

    // Logo / nombre sistema
    this.doc.setFontSize(16);
    this.doc.setTextColor(...hexToRgb(this.colors.headerText));
    this.doc.setFont('helvetica', 'bold');
    this.doc.text('ReportNow', this.marginX, 40);

    // Estado / chip
    const chipText = status.toUpperCase();
    const chipPaddingX = 10;
    const chipWidth = this.doc.getTextWidth(chipText) + chipPaddingX * 2;
    const chipHeight = 18;
    const chipX = this.pageWidth - this.marginX - chipWidth;
    const chipY = 25;

    const chipColor = status === 'active' ? this.colors.ok : this.colors.textMuted;
    this.doc.setFillColor(...hexToRgb(chipColor));
    this.doc.roundedRect(chipX, chipY, chipWidth, chipHeight, 9, 9, 'F');
    this.doc.setFontSize(10);
    this.doc.setTextColor(255, 255, 255);
    this.doc.text(chipText, chipX + chipPaddingX, chipY + chipHeight - 6);

    // Titulo reporte
    this.doc.setFontSize(18);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(this.colors.headerText));
    this.doc.text(title, this.marginX, 70);

    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...hexToRgb(this.darkMode ? '#94a3b8' : '#e2e8f0'));
    this.doc.text(subtitle, this.marginX, 88);

    this.cursorY = headerHeight + 20;
  }

  private drawEquipmentCard(equipment: EquipmentInfo) {
    const mainCardX = this.marginX;
    const mainCardY = this.cursorY;
    const mainCardW = this.pageWidth - this.marginX * 2;
    const mainCardH = 90;

    this.doc.setFillColor(...hexToRgb(this.colors.neutral50));
    this.doc.roundedRect(mainCardX, mainCardY, mainCardW, mainCardH, 12, 12, 'F');

    // Nombre dispositivo
    this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
    this.doc.setFontSize(14);
    this.doc.setFont('helvetica', 'bold');
    this.doc.text(`${equipment.brand} ${equipment.model}`, mainCardX + 16, mainCardY + 26);

    // Info secundaria
    this.doc.setFontSize(10);
    this.doc.setFont('helvetica', 'normal');
    this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
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

      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.text(card.label, x, y);

      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
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
      { label: 'Puntos registrados', value: stats.totalPoints.toString(), color: this.colors.primary },
      { label: 'Vel. maxima', value: `${stats.maxSpeed.toFixed(0)} km/h`, color: this.colors.crit },
      { label: 'Vel. promedio', value: `${stats.avgSpeed.toFixed(0)} km/h`, color: this.colors.ok },
      { label: 'Puntos detenido', value: stats.stoppedPoints.toString(), color: this.colors.textMuted },
    ];

    statsData.forEach((stat, i) => {
      const x = this.marginX + i * (cardW + 12);
      const y = this.cursorY;

      this.doc.setFillColor(...hexToRgb(this.colors.white));
      this.doc.roundedRect(x, y, cardW, cardH, 8, 8, 'F');

      this.doc.setFontSize(8);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
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
    this.doc.setFillColor(...hexToRgb(this.colors.neutral100));
    const filtersH = 50;
    this.doc.roundedRect(this.marginX, this.cursorY, this.pageWidth - this.marginX * 2, filtersH, 10, 10, 'F');

    this.doc.setFontSize(9);
    this.doc.setTextColor(...hexToRgb(this.colors.textMuted));

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
      this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
      this.doc.text(f.value, x, y + 16);
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
    });

    this.cursorY += filtersH + 20;
  }

  // ============ MÉTODOS NATIVOS PARA GRÁFICAS ============

  // Dibujar resumen de estadísticas (8 cards en grid 4x2)
  private drawStatsSummaryNative(summary: StatsPDFData['summary']) {
    const cardW = (this.pageWidth - this.marginX * 2 - 36) / 4;
    const cardH = 55;
    const gap = 12;

    const statsData = [
      // Primera fila
      { label: 'Total de rutas', value: summary.totalRutas.toString(), color: this.colors.info, bgColor: this.colors.infoLight },
      { label: 'Km recorridos', value: summary.kmRecorridos.toFixed(1), color: this.colors.purple, bgColor: this.colors.purpleLight },
      { label: 'Vel. máxima', value: `${summary.velMaxima.toFixed(0)} km/h`, color: this.colors.crit, bgColor: this.colors.critLight },
      { label: 'Vel. promedio', value: `${summary.velPromedio.toFixed(0)} km/h`, color: this.colors.ok, bgColor: this.colors.okLight },
      // Segunda fila
      { label: 'Horas en marcha', value: summary.horasMarcha.toFixed(1) + 'h', color: this.colors.ok, bgColor: this.colors.okLight },
      { label: 'Horas ralentí', value: summary.horasRalenti.toFixed(1) + 'h', color: this.colors.warn, bgColor: this.colors.warnLight },
      { label: 'Horas totales', value: summary.horasTotales.toFixed(1) + 'h', color: this.colors.cyan, bgColor: this.colors.cyanLight },
      { label: 'Puntos registrados', value: summary.puntosRegistrados.toString(), color: this.colors.textMuted, bgColor: this.colors.neutral100 },
    ];

    statsData.forEach((stat, i) => {
      const row = Math.floor(i / 4);
      const col = i % 4;
      const x = this.marginX + col * (cardW + gap);
      const y = this.cursorY + row * (cardH + gap);

      // Fondo de la card
      this.doc.setFillColor(...hexToRgb(stat.bgColor));
      this.doc.roundedRect(x, y, cardW, cardH, 6, 6, 'F');

      // Valor grande
      this.doc.setFontSize(18);
      this.doc.setTextColor(...hexToRgb(stat.color));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(stat.value, x + cardW / 2, y + 25, { align: 'center' });

      // Etiqueta
      this.doc.setFontSize(8);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(stat.label, x + cardW / 2, y + 42, { align: 'center' });
    });

    this.cursorY += (cardH + gap) * 2 + 10;
  }

  // Dibujar tabla de rutas nativa
  private drawRoutesTableNative(rutas: RouteStatsItemPDF[]) {
    // Verificar si necesitamos nueva página
    if (this.cursorY > this.pageHeight - 200) {
      this.addPageWithBackground();
      this.cursorY = 40;
    }

    const tableData = rutas.map(ruta => [
      ruta.ruta.toString(),
      ruta.inicio, // Already formatted as 'dd/MM/yyyy HH:mm'
      ruta.fin,    // Already formatted as 'dd/MM/yyyy HH:mm'
      ruta.km_recorridos.toFixed(2),
      ruta.velocidad_promedio.toFixed(1),
      ruta.velocidad_maxima.toFixed(1),
      ruta.tiempo_marcha_horas.toFixed(2) + 'h',
      ruta.tiempo_ralenti_horas.toFixed(2) + 'h',
      ruta.puntos.toString(),
    ]);

    autoTable(this.doc, {
      startY: this.cursorY,
      margin: { left: this.marginX, right: this.marginX },
      head: [['#', 'Inicio', 'Fin', 'Km', 'Vel.Prom', 'Vel.Máx', 'Marcha', 'Ralentí', 'Pts']],
      body: tableData,
      styles: {
        font: 'helvetica',
        fontSize: 8,
        textColor: hexToRgb(this.colors.textPrimary),
        cellPadding: 6,
        lineColor: hexToRgb(this.colors.cardBorder),
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: hexToRgb(this.colors.primary),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
      },
      bodyStyles: {
        fillColor: hexToRgb(this.colors.cardBg),
      },
      alternateRowStyles: {
        fillColor: hexToRgb(this.colors.neutral100),
      },
      columnStyles: {
        0: { cellWidth: 25 },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' },
        6: { halign: 'right' },
        7: { halign: 'right' },
        8: { halign: 'right' },
      },
      theme: 'grid',
      willDrawPage: (data) => {
        // Pintar fondo en páginas nuevas creadas por autoTable (excepto la primera iteración)
        if (this.darkMode && data.pageNumber > 1) {
          this.doc.setFillColor(...hexToRgb(this.colors.background));
          this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        }
      },
    });

    this.cursorY = (this.doc as any).lastAutoTable.finalY + 20;
  }

  // Dibujar gráfico de barras nativo (Distribución de velocidad)
  private drawNativeBarChart(data: StatsPDFData['speedDistribution'], title: string) {
    // Verificar si necesitamos nueva página
    if (this.cursorY > this.pageHeight - 200) {
      this.addPageWithBackground();
      this.cursorY = 40;
    }

    const chartX = this.marginX;
    const chartY = this.cursorY;
    const chartWidth = this.pageWidth - this.marginX * 2;
    const chartHeight = 150;
    const barAreaHeight = 100;

    // Título
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
    this.doc.text(title, chartX, chartY);

    const barY = chartY + 20;
    const maxValue = Math.max(...data.map(d => d.count), 1);
    const gap = 15;
    const barWidth = (chartWidth - gap * (data.length - 1)) / data.length;

    // Dibujar barras
    data.forEach((item, i) => {
      const x = chartX + i * (barWidth + gap);
      const barHeight = (item.count / maxValue) * barAreaHeight;
      const barStartY = barY + barAreaHeight - barHeight;

      // Barra
      this.doc.setFillColor(...hexToRgb(item.color));
      this.doc.roundedRect(x, barStartY, barWidth, barHeight, 4, 4, 'F');

      // Valor encima de la barra
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textSecondary));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.count.toString(), x + barWidth / 2, barStartY - 5, { align: 'center' });

      // Etiqueta debajo
      this.doc.setFontSize(8);
      this.doc.setFont('helvetica', 'normal');
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.text(item.range, x + barWidth / 2, barY + barAreaHeight + 15, { align: 'center' });
    });

    // Línea base
    this.doc.setDrawColor(...hexToRgb(this.colors.neutral200));
    this.doc.setLineWidth(0.5);
    this.doc.line(chartX, barY + barAreaHeight, chartX + chartWidth, barY + barAreaHeight);

    this.cursorY = barY + barAreaHeight + 35;
  }

  // Dibujar gráfico circular (pie) nativo
  private drawNativePieChart(data: StatsPDFData['movementState'], title: string) {
    // Verificar si necesitamos nueva página
    if (this.cursorY > this.pageHeight - 180) {
      this.addPageWithBackground();
      this.cursorY = 40;
    }

    const chartX = this.marginX;
    const chartY = this.cursorY;

    // Título
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
    this.doc.text(title, chartX, chartY);

    const centerX = this.marginX + 100;
    const centerY = chartY + 80;
    const radius = 50;
    const total = data.reduce((sum, d) => sum + d.value, 0);

    if (total === 0) {
      this.cursorY = chartY + 150;
      return;
    }

    // Dibujar sectores del pie
    let startAngle = -90; // Empezar desde arriba
    data.forEach(item => {
      const sweepAngle = (item.value / total) * 360;
      const endAngle = startAngle + sweepAngle;

      // Convertir a radianes
      const startRad = (startAngle * Math.PI) / 180;
      const endRad = (endAngle * Math.PI) / 180;
      const midRad = ((startAngle + sweepAngle / 2) * Math.PI) / 180;

      // Dibujar sector como un polígono
      this.doc.setFillColor(...hexToRgb(item.color));
      const points: [number, number][] = [[centerX, centerY]];

      // Crear arco con múltiples puntos
      const steps = Math.max(Math.ceil(sweepAngle / 5), 2);
      for (let i = 0; i <= steps; i++) {
        const angle = startRad + (endRad - startRad) * (i / steps);
        points.push([
          centerX + Math.cos(angle) * radius,
          centerY + Math.sin(angle) * radius,
        ]);
      }

      // Dibujar polígono
      if (points.length > 2) {
        this.doc.setFillColor(...hexToRgb(item.color));
        const pathData = points.map((p, idx) => (idx === 0 ? `M ${p[0]} ${p[1]}` : `L ${p[0]} ${p[1]}`)).join(' ') + ' Z';
        // Usar triangle/polygon approach
        for (let i = 1; i < points.length - 1; i++) {
          this.doc.triangle(
            points[0][0], points[0][1],
            points[i][0], points[i][1],
            points[i + 1][0], points[i + 1][1],
            'F'
          );
        }
      }

      startAngle = endAngle;
    });

    // Leyenda a la derecha
    const legendX = centerX + radius + 40;
    let legendY = chartY + 40;

    data.forEach(item => {
      // Cuadro de color
      this.doc.setFillColor(...hexToRgb(item.color));
      this.doc.rect(legendX, legendY - 8, 12, 12, 'F');

      // Texto
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textSecondary));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${item.label}: ${item.value} (${item.percent.toFixed(1)}%)`, legendX + 18, legendY);

      legendY += 20;
    });

    this.cursorY = chartY + 150;
  }

  // Dibujar gráfico de línea nativo (Velocidad en el tiempo)
  private drawNativeLineChart(data: StatsPDFData['speedTimeline'], title: string) {
    // Verificar si necesitamos nueva página
    if (this.cursorY > this.pageHeight - 180) {
      this.addPageWithBackground();
      this.cursorY = 40;
    }

    if (data.length === 0) return;

    const chartX = this.marginX + 30;
    const chartY = this.cursorY;
    const chartWidth = this.pageWidth - this.marginX * 2 - 40;
    const chartHeight = 120;

    // Título
    this.doc.setFontSize(11);
    this.doc.setFont('helvetica', 'bold');
    this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
    this.doc.text(title, this.marginX, chartY);

    const plotY = chartY + 20;
    const maxSpeed = Math.max(...data.map(d => d.speed), 1);

    // Dibujar grid de fondo
    this.doc.setDrawColor(...hexToRgb(this.colors.neutral200));
    this.doc.setLineWidth(0.3);
    for (let i = 0; i <= 4; i++) {
      const y = plotY + (chartHeight / 4) * i;
      this.doc.line(chartX, y, chartX + chartWidth, y);
      // Etiquetas del eje Y
      const speedLabel = Math.round(maxSpeed - (maxSpeed / 4) * i);
      this.doc.setFontSize(7);
      this.doc.setTextColor(...hexToRgb(this.colors.textLight));
      this.doc.text(speedLabel.toString(), chartX - 5, y + 3, { align: 'right' });
    }

    // Dibujar línea de datos
    this.doc.setDrawColor(...hexToRgb(this.colors.info));
    this.doc.setLineWidth(1.5);

    const stepX = chartWidth / (data.length - 1 || 1);
    let prevX = chartX;
    let prevY = plotY + chartHeight - (data[0].speed / maxSpeed) * chartHeight;

    for (let i = 1; i < data.length; i++) {
      const x = chartX + i * stepX;
      const y = plotY + chartHeight - (data[i].speed / maxSpeed) * chartHeight;
      this.doc.line(prevX, prevY, x, y);
      prevX = x;
      prevY = y;
    }

    // Etiquetas del eje X (solo algunas)
    this.doc.setFontSize(7);
    this.doc.setTextColor(...hexToRgb(this.colors.textLight));
    const labelStep = Math.max(1, Math.floor(data.length / 6));
    for (let i = 0; i < data.length; i += labelStep) {
      const x = chartX + i * stepX;
      this.doc.text(data[i].time, x, plotY + chartHeight + 12, { align: 'center' });
    }

    // Etiqueta del eje
    this.doc.setFontSize(8);
    this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
    this.doc.text('km/h', this.marginX, plotY + chartHeight / 2, { angle: 90 });

    this.cursorY = plotY + chartHeight + 30;
  }

  // Dibujar cards de análisis detallado
  private drawAnalysisCards(analysis: StatsPDFData['analysis']) {
    // Verificar si necesitamos nueva página
    if (this.cursorY > this.pageHeight - 120) {
      this.addPageWithBackground();
      this.cursorY = 40;
    }

    const cardW = (this.pageWidth - this.marginX * 2 - 36) / 4;
    const cardH = 60;
    const gap = 12;

    const analysisData = [
      { label: 'En movimiento', value: analysis.movingPoints.toString(), percent: analysis.movingPercent, color: this.colors.ok },
      { label: 'Exceso velocidad (>60)', value: analysis.speedExcessPoints.toString(), percent: analysis.speedExcessPercent, color: this.colors.warn },
      { label: 'Alta velocidad (>80)', value: analysis.highSpeedPoints.toString(), percent: analysis.highSpeedPercent, color: this.colors.crit },
      { label: 'Detenido', value: analysis.stoppedPoints.toString(), percent: analysis.stoppedPercent, color: this.colors.textMuted },
    ];

    analysisData.forEach((stat, i) => {
      const x = this.marginX + i * (cardW + gap);
      const y = this.cursorY;

      // Fondo
      this.doc.setFillColor(...hexToRgb(this.colors.neutral50));
      this.doc.roundedRect(x, y, cardW, cardH, 6, 6, 'F');

      // Etiqueta
      this.doc.setFontSize(8);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(stat.label, x + cardW / 2, y + 14, { align: 'center' });

      // Valor grande
      this.doc.setFontSize(16);
      this.doc.setTextColor(...hexToRgb(stat.color));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(stat.value, x + cardW / 2, y + 35, { align: 'center' });

      // Porcentaje
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textLight));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`${stat.percent.toFixed(1)}%`, x + cardW / 2, y + 50, { align: 'center' });
    });

    this.cursorY += cardH + 20;
  }

  // Dibujar información del período
  private drawPeriodInfo(period: StatsPDFData['period']) {
    const cardW = (this.pageWidth - this.marginX * 2 - 12) / 2;
    const cardH = 50;

    const periodData = [
      { label: 'Primer registro', value: period.firstRecord },
      { label: 'Último registro', value: period.lastRecord },
    ];

    periodData.forEach((item, i) => {
      const x = this.marginX + i * (cardW + 12);
      const y = this.cursorY;

      // Fondo
      this.doc.setFillColor(...hexToRgb(this.colors.neutral50));
      this.doc.roundedRect(x, y, cardW, cardH, 6, 6, 'F');

      // Etiqueta
      this.doc.setFontSize(8);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(item.label, x + 12, y + 18);

      // Valor
      this.doc.setFontSize(11);
      this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(item.value, x + 12, y + 36);
    });

    this.cursorY += cardH + 20;
  }

  // Dibujar ranking de conductores
  private drawRankingInfo(ranking: NonNullable<StatsPDFData['ranking']>) {
    const startY = this.cursorY;
    const cardW = this.pageWidth - this.marginX * 2;

    // Conductor asignado
    if (ranking.currentDriver) {
      const cardH = 55;

      // Fondo verde (adaptado a dark mode)
      this.doc.setFillColor(...hexToRgb(this.colors.okLight));
      this.doc.setDrawColor(...hexToRgb(this.colors.ok));
      this.doc.roundedRect(this.marginX, this.cursorY, cardW, cardH, 6, 6, 'FD');

      // Badge "Asignado"
      this.doc.setFillColor(...hexToRgb(this.colors.ok));
      this.doc.roundedRect(this.marginX + 12, this.cursorY + 8, 55, 16, 4, 4, 'F');
      this.doc.setFontSize(8);
      this.doc.setTextColor(255, 255, 255);
      this.doc.setFont('helvetica', 'bold');
      this.doc.text('Asignado', this.marginX + 40, this.cursorY + 18, { align: 'center' });

      // Nombre (usar color que contraste con el fondo)
      this.doc.setFontSize(12);
      this.doc.setTextColor(...hexToRgb(this.darkMode ? '#34d399' : '#166534'));
      this.doc.setFont('helvetica', 'bold');
      this.doc.text(ranking.currentDriver.name, this.marginX + 75, this.cursorY + 18);

      // Info
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.darkMode ? '#6ee7b7' : '#15803d'));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(`Tel: ${ranking.currentDriver.phone}  |  Lic: ${ranking.currentDriver.licenseNumber}`, this.marginX + 12, this.cursorY + 40);

      this.cursorY += cardH + 10;
    }

    // Otros conductores
    if (ranking.otherDrivers.length > 0) {
      this.doc.setFontSize(9);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.setFont('helvetica', 'normal');
      this.doc.text(ranking.currentDriver ? 'Otros conductores disponibles:' : 'Conductores disponibles:', this.marginX, this.cursorY + 10);
      this.cursorY += 20;

      const driverCardW = (cardW - 12) / 2;
      const driverCardH = 40;

      ranking.otherDrivers.forEach((driver, i) => {
        const col = i % 2;
        const row = Math.floor(i / 2);
        const x = this.marginX + col * (driverCardW + 12);
        const y = this.cursorY + row * (driverCardH + 8);

        // Fondo
        this.doc.setFillColor(...hexToRgb(this.colors.neutral50));
        this.doc.roundedRect(x, y, driverCardW, driverCardH, 4, 4, 'F');

        // Nombre
        this.doc.setFontSize(10);
        this.doc.setTextColor(...hexToRgb(this.colors.textPrimary));
        this.doc.setFont('helvetica', 'bold');
        this.doc.text(driver.name, x + 10, y + 16);

        // Estado
        this.doc.setFontSize(8);
        this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
        this.doc.setFont('helvetica', 'normal');
        this.doc.text(driver.status, x + 10, y + 30);
      });

      const rows = Math.ceil(ranking.otherDrivers.length / 2);
      this.cursorY += rows * (driverCardH + 8) + 10;
    }

    if (!ranking.currentDriver && ranking.otherDrivers.length === 0) {
      this.doc.setFontSize(10);
      this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
      this.doc.text('No hay conductores registrados para este cliente', this.marginX, this.cursorY + 15);
      this.cursorY += 30;
    }

    this.cursorY += 10;
  }

  private async addImage(imageData: string, height: number = 200) {
    const imgWidth = this.pageWidth - this.marginX * 2;

    // Verificar si necesitamos nueva página
    if (this.cursorY + height > this.pageHeight - 50) {
      this.addPageWithBackground();
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
        textColor: hexToRgb(this.colors.textPrimary),
        cellPadding: 8,
        lineColor: hexToRgb(this.colors.cardBorder),
        lineWidth: 0.5,
      },
      headStyles: {
        fillColor: hexToRgb(this.colors.primary),
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: {
        fillColor: hexToRgb(this.colors.cardBg),
      },
      alternateRowStyles: {
        fillColor: hexToRgb(this.colors.neutral100),
      },
      theme: 'grid',
      willDrawPage: (data) => {
        if (this.darkMode && data.pageNumber > 1) {
          this.doc.setFillColor(...hexToRgb(this.colors.background));
          this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
        }
      },
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
    this.doc.setTextColor(...hexToRgb(this.colors.textMuted));
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
      this.addPageWithBackground();
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
        this.addPageWithBackground();
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
          textColor: hexToRgb(this.colors.textPrimary),
          cellPadding: 8,
          lineColor: hexToRgb(this.colors.cardBorder),
          lineWidth: 0.5,
        },
        headStyles: {
          fillColor: hexToRgb(this.colors.primary),
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        bodyStyles: {
          fillColor: hexToRgb(this.colors.cardBg),
        },
        alternateRowStyles: {
          fillColor: hexToRgb(this.colors.neutral100),
        },
        theme: 'grid',
        willDrawPage: (data) => {
          if (this.darkMode && data.pageNumber > 1) {
            this.doc.setFillColor(...hexToRgb(this.colors.background));
            this.doc.rect(0, 0, this.pageWidth, this.pageHeight, 'F');
          }
        },
      });
    }

    this.drawFooter();
    this.doc.save(`${equipment.brand}_${equipment.model}_historial_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }

  // Método para generar PDF de estadísticas (NATIVO)
  async generateStatsReport(options: PDFGeneratorOptions): Promise<void> {
    const { equipment, dateRange, statsData, selectedSections } = options;

    this.drawHeader('Reporte de Estadisticas', `${equipment.brand} ${equipment.model}`, equipment.status);
    this.drawEquipmentCard(equipment);

    this.sectionTitle('Parametros del reporte');
    this.drawFilters(dateRange);

    // Si hay datos nativos, usarlos
    if (statsData) {
      const sections = selectedSections && selectedSections.length > 0 ? selectedSections : ['resumen', 'rutas', 'velocidad', 'distribucion', 'movimiento', 'analisis', 'periodo', 'ranking'];

      // Resumen de estadísticas
      if (sections.includes('resumen')) {
        this.sectionTitle('Resumen de estadisticas');
        this.drawStatsSummaryNative(statsData.summary);
      }

      // Tabla de rutas
      if (sections.includes('rutas') && statsData.rutas.length > 0) {
        this.sectionTitle('Detalle de rutas');
        this.drawRoutesTableNative(statsData.rutas);
      }

      // Gráfico de velocidad en tiempo
      if (sections.includes('velocidad') && statsData.speedTimeline.length > 0) {
        this.sectionTitle('Velocidad en el tiempo');
        this.drawNativeLineChart(statsData.speedTimeline, '');
      }

      // Distribución de velocidad
      if (sections.includes('distribucion') && statsData.speedDistribution.length > 0) {
        this.sectionTitle('Distribucion de velocidad');
        this.drawNativeBarChart(statsData.speedDistribution, '');
      }

      // Estado de movimiento
      if (sections.includes('movimiento') && statsData.movementState.length > 0) {
        this.sectionTitle('Estado de movimiento');
        this.drawNativePieChart(statsData.movementState, '');
      }

      // Análisis detallado
      if (sections.includes('analisis')) {
        this.sectionTitle('Analisis detallado');
        this.drawAnalysisCards(statsData.analysis);
      }

      // Información del período
      if (sections.includes('periodo')) {
        this.sectionTitle('Informacion del periodo');
        this.drawPeriodInfo(statsData.period);
      }

      // Ranking de conductores
      if (sections.includes('ranking') && statsData.ranking) {
        this.sectionTitle('Ranking de conductores');
        this.drawRankingInfo(statsData.ranking);
      }
    }

    this.drawFooter();
    this.doc.save(`${equipment.brand}_${equipment.model}_estadisticas_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
  }
}

// Funciones exportables
export async function generateFullPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator(options.darkMode ?? false);
  await generator.generateFullReport(options);
}

export async function generateHistoryPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator(options.darkMode ?? false);
  await generator.generateHistoryReport(options);
}

export async function generateStatsPDF(options: PDFGeneratorOptions): Promise<void> {
  const generator = new PDFGenerator(options.darkMode ?? false);
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

  // Usar colores light por defecto para listas
  const colors = COLORS_LIGHT;

  const doc = new jsPDF('p', 'pt', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const marginX = 40;
  let cursorY = 40;

  // Header azul
  const headerHeight = 70;
  doc.setFillColor(...hexToRgb(colors.primary));
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
    doc.setTextColor(...hexToRgb(colors.textMuted));
    doc.setFont('helvetica', 'normal');
    doc.text(subtitle, marginX, cursorY);
    cursorY += 20;
  }

  // Filtros aplicados
  if (filters && filters.length > 0) {
    doc.setFillColor(...hexToRgb(colors.neutral100));
    const filtersH = 40;
    doc.roundedRect(marginX, cursorY, pageWidth - marginX * 2, filtersH, 8, 8, 'F');

    doc.setFontSize(8);
    const filterWidth = (pageWidth - marginX * 2 - 20) / filters.length;

    filters.forEach((f, i) => {
      const x = marginX + 10 + i * filterWidth;
      doc.setTextColor(...hexToRgb(colors.textMuted));
      doc.text(f.label.toUpperCase(), x, cursorY + 14);
      doc.setFontSize(9);
      doc.setTextColor(...hexToRgb(colors.textPrimary));
      doc.text(f.value, x, cursorY + 28);
      doc.setFontSize(8);
    });

    cursorY += filtersH + 15;
  }

  // Info de registros
  doc.setFontSize(10);
  doc.setTextColor(...hexToRgb(colors.textSecondary));
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
      textColor: hexToRgb(colors.textPrimary),
      cellPadding: 6,
      lineColor: hexToRgb(colors.cardBorder),
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: hexToRgb(colors.primary),
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
    },
    bodyStyles: {
      fillColor: hexToRgb(colors.cardBg),
    },
    alternateRowStyles: {
      fillColor: hexToRgb(colors.neutral100),
    },
    theme: 'grid',
  });

  // Footer
  const footerY = pageHeight - 30;
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(...hexToRgb(colors.textMuted));
    doc.text('Reporte generado desde ReportNow', marginX, footerY);
    doc.text(`Pagina ${i} de ${pageCount}`, pageWidth - marginX - 60, footerY);
  }

  doc.save(`${filename}_${format(new Date(), 'yyyy-MM-dd_HH-mm')}.pdf`);
}

export type { PDFGeneratorOptions, EquipmentInfo, RouteStats, StatusSegment, ListPDFOptions, StatsPDFData, RouteStatsItemPDF };
