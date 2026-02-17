import { type PatternResult } from './PatternDetector';
import { type NewsItem } from './types';
import { type Entity } from './EntityDatabase';

export async function generateReport(patterns: PatternResult[], entities: Entity[], news: NewsItem[], bounds: [[number, number], [number, number]] | null, markers: any[] = [], leyLines: any[] = [], diagnosis: string = "", dateRange?: { from: string; to: string }, fullStats?: any, social: any[] = [], images?: { mapImage?: string, chartsImage?: string }) {
    const jsPDFModule = await import('jspdf');
    const jsPDF = jsPDFModule.default;
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // ===== PORTADA =====
    // Header background
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Logo/Title
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.setFont("helvetica", 'bold');
    doc.text('INFORME DE ANÁLISIS ESPIRITUAL', pageWidth / 2, 25, { align: 'center' });

    doc.setFontSize(12);
    doc.setFont("helvetica", 'normal');
    doc.text('Mapeo y Detección de Influencias Territoriales', pageWidth / 2, 35, { align: 'center' });

    // Subtitle bar
    doc.setFillColor(197, 107, 255);
    doc.rect(0, 60, pageWidth, 3, 'F');

    // Metadata section
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    let y = 75;

    doc.setFont("helvetica", 'bold');
    doc.text('INFORMACIÓN DEL ANÁLISIS', 20, y);
    y += 8;

    doc.setFont("helvetica", 'normal');
    doc.setFontSize(10);
    const today = new Date();
    doc.text(`Fecha de generación: ${today.toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}`, 20, y);
    y += 6;
    doc.text(`Hora: ${today.toLocaleTimeString('es-ES')}`, 20, y);
    y += 6;

    if (dateRange && dateRange.from) {
        doc.setFont("helvetica", 'bold');
        doc.text(`Periodo Analizado:`, 20, y);
        doc.setFont("helvetica", 'normal');
        doc.text(` ${new Date(dateRange.from).toLocaleDateString()} - ${new Date(dateRange.to).toLocaleDateString()}`, 52, y);
        y += 8;
    }

    if (bounds) {
        doc.text(`Coordenadas del área analizada:`, 20, y);
        y += 6;
        doc.text(`  • Punto 1: ${bounds[0][0].toFixed(6)}°, ${bounds[0][1].toFixed(6)}°`, 25, y);
        y += 6;
        doc.text(`  • Punto 2: ${bounds[1][0].toFixed(6)}°, ${bounds[1][1].toFixed(6)}°`, 25, y);
        y += 6;

        // Calculate area size
        const latDiff = Math.abs(bounds[1][0] - bounds[0][0]);
        const lngDiff = Math.abs(bounds[1][1] - bounds[0][1]);
        const approxArea = (latDiff * 111) * (lngDiff * 111); // rough km²
        doc.text(`  • Área aproximada: ${approxArea.toFixed(2)} km²`, 25, y);
    }

    y += 15;

    // ===== RESUMEN EJECUTIVO =====
    doc.setFillColor(240, 240, 245);
    doc.rect(15, y, pageWidth - 30, 50, 'F');

    doc.setFontSize(12);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('📊 RESUMEN EJECUTIVO', 20, y + 8);

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');
    y += 16;

    const totalPatterns = patterns.length;
    const totalEntities = entities.length;
    const intersections = patterns.filter(p => p.type === 'Intersección').length;
    const formations = patterns.filter(p => p.type === 'Formación Geométrica').length;

    doc.text(`• Patrones geométricos detectados: ${totalPatterns}`, 20, y);
    y += 6;
    doc.text(`• Intersecciones de poder identificadas: ${intersections}`, 20, y);
    y += 6;
    doc.text(`• Formaciones geométricas: ${formations}`, 20, y);
    y += 6;
    doc.text(`• Entidades espirituales detectadas: ${totalEntities}`, 20, y);
    y += 6;

    // Risk level
    const riskLevel = totalEntities > 2 ? 'ALTO' : totalEntities > 0 ? 'MEDIO' : 'BAJO';
    const riskColor = totalEntities > 2 ? [255, 107, 107] : totalEntities > 0 ? [255, 180, 0] : [0, 193, 118];
    doc.setTextColor(riskColor[0], riskColor[1], riskColor[2]);
    doc.setFont("helvetica", 'bold');
    doc.text(`• Nivel de riesgo espiritual: ${riskLevel}`, 20, y);

    y += 10;

    if (images?.mapImage) {
        doc.setTextColor(197, 107, 255);
        doc.setFont("helvetica", 'bold');
        doc.setFontSize(11);
        doc.text('📍 VISTA GEOESPACIAL DEL ÁREA', 20, y);
        y += 5;
        doc.addImage(images.mapImage, 'PNG', 15, y, pageWidth - 30, 80);
        y += 85;
    }

    // ===== NUEVA PÁGINA: ANÁLISIS DETALLADO =====
    doc.addPage();
    y = 20;

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ANÁLISIS DETALLADO DE PATRONES', pageWidth / 2, 10, { align: 'center' });

    y = 25;
    doc.setTextColor(0, 0, 0);

    // Patterns section
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('🔍 PATRONES GEOMÉTRICOS DETECTADOS', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');

    if (patterns.length === 0) {
        doc.setTextColor(100, 100, 100);
        doc.text('No se detectaron patrones significativos en el área analizada.', 20, y);
        y += 10;
    } else {
        patterns.forEach((p, index) => {
            // Pattern box
            doc.setFillColor(250, 250, 255);
            doc.rect(15, y - 5, pageWidth - 30, 22, 'F');
            doc.setDrawColor(197, 107, 255);
            doc.rect(15, y - 5, pageWidth - 30, 22, 'S');

            doc.setFont("helvetica", 'bold');
            doc.setFontSize(11);
            doc.text(`${index + 1}. ${p.type}`, 20, y + 2);

            doc.setFont("helvetica", 'normal');
            doc.setFontSize(9);
            const descLines = doc.splitTextToSize(p.description, pageWidth - 40);
            doc.text(descLines, 20, y + 8);

            y += 28;

            if (y > pageHeight - 30) {
                doc.addPage();
                y = 20;
            }
        });
    }

    y += 10;

    // Statistics chart (text-based)
    if (patterns.length > 0) {
        doc.setFontSize(12);
        doc.setFont("helvetica", 'bold');
        doc.setTextColor(197, 107, 255);
        doc.text('📈 DISTRIBUCIÓN DE PATRONES', 20, y);
        y += 10;

        doc.setFontSize(10);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", 'normal');

        const patternTypes = patterns.reduce((acc, p) => {
            acc[p.type] = (acc[p.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        Object.entries(patternTypes).forEach(([type, count]) => {
            const percentage = ((count / patterns.length) * 100).toFixed(1);
            const barWidth = (count / patterns.length) * 150;

            doc.text(`${type}:`, 20, y);
            doc.setFillColor(197, 107, 255);
            doc.rect(70, y - 4, barWidth, 6, 'F');
            doc.text(`${count} (${percentage}%)`, 75 + barWidth, y);
            y += 10;
        });
    }

    if (images?.chartsImage) {
        doc.addPage();
        y = 20;
        // Header for charts page
        doc.setFillColor(26, 26, 46);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('ANALÍTICAS VISUALES Y TENDENCIAS', pageWidth / 2, 10, { align: 'center' });

        doc.addImage(images.chartsImage, 'PNG', 15, 25, pageWidth - 30, 180);
        y = 210;
    }

    // ===== NEW PAGE: INTELIGENCIA AMBIENTAL =====
    doc.addPage();
    y = 20;

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ANÁLISIS DE INTELIGENCIA AMBIENTAL', pageWidth / 2, 10, { align: 'center' });

    y = 30;
    doc.setTextColor(197, 107, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text('🌍 ACTIVIDAD SÍSMICA Y PLANETARIA', 20, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');

    const planetary = fullStats?.stats?.planetary;
    if (planetary) {
        doc.text(`• Estado Schumann: ${planetary.schumannState || 'Estable'}`, 25, y);
        y += 6;
        doc.text(`• Eventos sísmicos recientes detectados: ${planetary.seismicActivity?.count || 0}`, 25, y);
        y += 6;
        doc.text(`• Magnitud máxima registrada: ${planetary.seismicActivity?.maxMagnitude || 0} ML`, 25, y);
        y += 10;

        if (planetary.seismicActivity?.details && planetary.seismicActivity.details.length > 0) {
            doc.setFont("helvetica", 'bold');
            doc.text('Detalle de Sismicidad Local:', 20, y);
            doc.setFont("helvetica", 'normal');
            y += 8;

            planetary.seismicActivity.details.forEach((q: any) => {
                const qLine = `  - ${new Date(q.time).toLocaleString()}: ${q.mag} Mag @ ${q.place}`;
                const qLines = doc.splitTextToSize(qLine, pageWidth - 40);
                doc.text(qLines, 20, y);
                y += qLines.length * 5 + 2;
                if (y > pageHeight - 30) { doc.addPage(); y = 20; }
            });
        }
    } else {
        doc.text('No hay datos planetarios disponibles para este periodo.', 25, y);
        y += 10;
    }

    y += 10;
    doc.setTextColor(197, 107, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text('🌙 CICLOS ASTRALES Y CLIMA', 20, y);
    y += 10;

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    doc.setFont("helvetica", 'normal');

    const astral = fullStats?.stats?.astral;
    if (astral) {
        doc.text(`• Fase Lunar: ${astral.moonPhase}`, 25, y);
        y += 6;
        doc.text(`• Iluminación: ${astral.moonIllumination.toFixed(1)}%`, 25, y);
        y += 6;
        doc.text(`• Influencia: ${astral.moonSentiment}`, 25, y);
        y += 10;
    }

    // ===== NEW PAGE: NOTA METODOLÓGICA =====
    doc.addPage();
    y = 20;
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('MARCO METODOLÓGICO Y FUENTES', pageWidth / 2, 10, { align: 'center' });

    y = 30;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.setFont("helvetica", 'bold');
    doc.text('Origen de la Inteligencia:', 20, y);
    y += 8;
    doc.setFont("helvetica", 'normal');
    doc.setFontSize(10);
    const methodLines = doc.splitTextToSize(
        "Este informe combina dos capas analíticas independientes: " +
        "1. Análisis Geoespacial: Detección de patrones geométricos y entidades mediante algoritmos de red ley y base de datos histórica. Esta capa es INDEPENDIENTE de los sucesos actuales. " +
        "2. Inteligencia de Campo (OSINT): Monitoreo en tiempo real de noticias, redes sociales y sensores ambientales (clima/sismicidad). " +
        "La ausencia de noticias actuales no invalida la presencia de patrones o entidades detectadas geoespacialmente.",
        pageWidth - 40
    );
    doc.text(methodLines, 20, y);
    y += methodLines.length * 5 + 10;

    // ===== NEW PAGE: CAMPO COLECTIVO =====
    doc.addPage();
    y = 20;

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('RESonancia del campo Colectivo', pageWidth / 2, 10, { align: 'center' });

    y = 30;
    doc.setTextColor(197, 107, 255);
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.text('👥 CLIMA SOCIAL Y MALESTAR COLECTIVO', 20, y);
    y += 10;

    const collective = fullStats?.collective_field;
    if (collective && collective.total_analyzed > 0) {
        doc.setTextColor(255, 107, 107);
        doc.setFont("helvetica", 'bold');
        doc.text(`Índice de Densidad (Presión Social): ${collective.density_index}%`, 20, y);
        y += 8;

        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", 'normal');
        doc.text(`Arquetipo Dominante detectado: ${collective.dominant.toUpperCase()}`, 20, y);
        y += 12;

        doc.setFont("helvetica", 'bold');
        doc.text('Desglose de Sentimiento Social:', 20, y);
        y += 8;

        doc.setFont("helvetica", 'normal');
        Object.entries(collective.scores).forEach(([name, score]) => {
            if (Number(score) >= 0) {
                const barWidth = (Number(score) / 100) * 120;
                doc.text(`${name}:`, 25, y);
                doc.setFillColor(150, 150, 255);
                doc.rect(60, y - 4, Math.max(1, barWidth), 6, 'F');
                doc.text(`${score}%`, 65 + barWidth, y);
                y += 8;
            }
        });
    } else {
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", 'italic');
        doc.text('Estado del Campo: EQUILIBRADO / NEUTRAL', 20, y);
        y += 8;
        doc.setFont("helvetica", 'normal');
        doc.text('No se detectó tensión social significativa o noticias procesables en este periodo.', 20, y);
        y += 10;

        // Show empty scores for clarity
        doc.setFont("helvetica", 'bold');
        doc.text('Indicadores de Base:', 20, y);
        y += 8;
        doc.setFont("helvetica", 'normal');
        ['miedo', 'ira', 'esperanza', 'confusion'].forEach(arch => {
            doc.text(`${arch}:`, 25, y);
            doc.setFillColor(240, 240, 240);
            doc.rect(60, y - 4, 120, 6, 'F');
            doc.text('0%', 185, y);
            y += 8;
        });
    }

    // ===== NEW PAGE: SIGNALS AND TOPOLOGY =====
    doc.addPage();
    y = 20;

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('INVENTARIO DE SEÑALES Y TOPOLOGÍA', pageWidth / 2, 10, { align: 'center' });

    y = 25;
    doc.setTextColor(0, 0, 0);

    // Markers Section
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('📍 MARCADORES REGISTRADOS', 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');

    if (markers.length === 0) {
        doc.text('No hay marcadores individuales en esta zona.', 20, y);
        y += 10;
    } else {
        markers.slice(0, 20).forEach((m, i) => { // Cap at 20 for PDF space
            doc.text(`• ${m.name || `Marcador ${i + 1}`}: ${m.lat.toFixed(6)}, ${m.lng.toFixed(6)}`, 20, y);
            y += 6;
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        });
    }

    y += 10;

    // Ley Lines Section
    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('⚡ LÍNEAS DE FLUJO (LEY LINES)', 20, y);
    y += 10;

    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');

    if (leyLines.length === 0) {
        doc.text('No se han detectado líneas de flujo trazadas.', 20, y);
        y += 10;
    } else {
        leyLines.forEach((l) => {
            doc.setFont("helvetica", 'bold');
            doc.text(`${l.name}:`, 20, y);
            doc.setFont("helvetica", 'normal');
            doc.text(` ${l.markers.length} nodos conectados. Color ID: ${l.color}`, 40, y);
            y += 8;
            if (y > pageHeight - 40) { doc.addPage(); y = 20; }
        });
    }

    // ===== NUEVA PÁGINA: ENTIDADES =====
    doc.addPage();
    y = 20;

    // Header
    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('ENTIDADES E INFLUENCIAS ESPIRITUALES', pageWidth / 2, 10, { align: 'center' });

    y = 25;
    doc.setTextColor(0, 0, 0);

    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('👹 ENTIDADES DETECTADAS', 20, y);
    y += 10;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');

    if (entities.length === 0) {
        doc.setTextColor(100, 100, 100);
        doc.text('No se detectaron entidades espirituales en la base de datos para esta área.', 20, y);
        y += 10;
    } else {
        entities.forEach((e, index) => {
            // Entity card
            doc.setFillColor(255, 250, 245);
            doc.rect(15, y - 5, pageWidth - 30, 35, 'F');
            doc.setDrawColor(255, 107, 107);
            doc.setLineWidth(0.5);
            doc.rect(15, y - 5, pageWidth - 30, 35, 'S');

            doc.setFont("helvetica", 'bold');
            doc.setFontSize(12);
            doc.setTextColor(139, 0, 0);
            doc.text(`${index + 1}. ${e.name}`, 20, y + 2);

            doc.setFont("helvetica", 'normal');
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);
            doc.text(`Tipo: ${e.type}`, 20, y + 9);
            doc.text(`Influencia: ${e.influence}`, 20, y + 15);
            doc.text(`Descripción: ${e.description}`, 20, y + 21);

            if (e.biblicalReference) {
                doc.setFont("helvetica", 'italic');
                doc.setTextColor(70, 70, 150);
                doc.text(`Referencia Bíblica: ${e.biblicalReference}`, 20, y + 27);
            }

            y += 40;

            if (y > pageHeight - 50) {
                doc.addPage();
                y = 20;
            }
        });
    }

    // ===== REFERENCIAS Y NOTICIAS =====
    // Always show news section if we have news, regardless of entities
    if (news.length > 0) {
        y += 10;

        if (y > pageHeight - 80) {
            doc.addPage();
            y = 20;
        }

        doc.setFontSize(12);
        doc.setFont("helvetica", 'bold');
        doc.setTextColor(197, 107, 255);
        doc.text('📰 NOTICIAS Y EVENTOS DEL ÁREA', 20, y);
        y += 8;

        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.setFont("helvetica", 'italic');
        doc.text('(Fuentes: GNews, Prensa Local y Búsqueda Web)', 20, y);
        y += 10;

        doc.setFont("helvetica", 'normal');
        doc.setTextColor(0, 0, 0);

        news.forEach((item) => {
            // Draw box for news item
            doc.setFillColor(245, 245, 250);

            const titleLines = doc.splitTextToSize(`• ${item.title}`, pageWidth - 40);
            const descLines = item.description ? doc.splitTextToSize(item.description, pageWidth - 50) : [];
            const height = (titleLines.length * 5) + (descLines.length * 4) + 12;

            if (y + height > pageHeight - 15) {
                doc.addPage();
                y = 20;
            }

            doc.rect(15, y - 3, pageWidth - 30, height, 'F');

            doc.setFont("helvetica", 'bold');
            doc.text(titleLines, 20, y + 2);
            y += (titleLines.length * 5) + 2;

            if (descLines.length > 0) {
                doc.setFont("helvetica", 'normal');
                doc.setFontSize(8);
                doc.setTextColor(50, 50, 50);
                doc.text(descLines, 25, y + 2);
                y += (descLines.length * 4) + 4;
            }

            // Source and Date
            doc.setFontSize(7);
            doc.setTextColor(100, 100, 100);
            doc.text(`${item.source} - ${item.date}`, 20, y);

            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);

            y += 8;
        });
    }

    // ===== NEW PAGE: ALERTAS Y EVENTOS SOCIALES/AMBIENTALES =====
    if (social.length > 0) {
        doc.addPage();
        y = 30;
        doc.setFillColor(26, 26, 46);
        doc.rect(0, 0, pageWidth, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(10);
        doc.text('BITÁCORA DE EVENTOS Y ALERTAS AMBIENTALES', pageWidth / 2, 10, { align: 'center' });

        y = 30;
        doc.setTextColor(197, 107, 255);
        doc.setFontSize(14);
        doc.setFont("helvetica", 'bold');
        doc.text('🔔 ALERTAS DEL SISTEMA', 20, y);
        y += 10;

        doc.setFontSize(9);
        doc.setTextColor(0, 0, 0);
        doc.setFont("helvetica", 'normal');

        social.forEach((item) => {
            doc.setFillColor(255, 245, 245);
            if (item.sentiment === 'negative') doc.setDrawColor(255, 100, 100);
            else doc.setDrawColor(200, 200, 200);

            doc.rect(15, y - 4, pageWidth - 30, 15, 'F');
            doc.rect(15, y - 4, pageWidth - 30, 15, 'S');

            doc.setFont("helvetica", 'bold');
            doc.text(`[${item.user}]`, 20, y + 2);
            doc.setFont("helvetica", 'normal');
            doc.text(item.content, 50, y + 2);

            doc.setFontSize(7);
            doc.setTextColor(150, 150, 150);
            doc.text(new Date(item.timestamp).toLocaleString(), 20, y + 8);
            doc.setFontSize(9);
            doc.setTextColor(0, 0, 0);

            y += 18;
            if (y > pageHeight - 30) { doc.addPage(); y = 20; }
        });
    }

    // ===== RECOMENDACIONES =====
    doc.addPage();
    y = 20;

    doc.setFillColor(26, 26, 46);
    doc.rect(0, 0, pageWidth, 15, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    doc.text('RECOMENDACIONES Y CONCLUSIONES', pageWidth / 2, 10, { align: 'center' });

    y = 25;

    doc.setFontSize(14);
    doc.setFont("helvetica", 'bold');
    doc.setTextColor(197, 107, 255);
    doc.text('💡 RECOMENDACIONES', 20, y);
    y += 12;

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", 'normal');

    const recommendations = [
        'Realizar intercesión enfocada en las áreas de intersección identificadas',
        'Establecer vigilancia espiritual continua en la zona analizada',
        'Considerar mapeo de oración sistemático del territorio',
        'Documentar cambios y manifestaciones observadas en el área',
        'Coordinar con líderes espirituales locales para estrategias de cobertura'
    ];

    recommendations.forEach((rec, index) => {
        doc.setFillColor(240, 255, 240);
        doc.rect(15, y - 3, pageWidth - 30, 10, 'F');
        doc.text(`${index + 1}. ${rec}`, 20, y + 3);
        y += 12;
    });

    if (diagnosis) {
        y += 5;
        doc.setFontSize(12);
        doc.setFont("helvetica", 'bold');
        doc.setTextColor(0, 193, 118);
        doc.text('🔮 DIAGNÓSTICO ESPIRITUAL', 20, y);
        y += 8;

        doc.setFontSize(10);
        doc.setFont("helvetica", 'normal');
        doc.setTextColor(0, 0, 0);
        const diagLines = doc.splitTextToSize(diagnosis, pageWidth - 40);
        doc.text(diagLines, 20, y);
    }

    // Footer
    y = pageHeight - 30;
    doc.setFillColor(197, 107, 255);
    doc.rect(0, y, pageWidth, 1, 'F');

    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont("helvetica", 'italic');
    doc.text('Generado por Ley Lines Explorer PWA - Sistema de Mapeo Espiritual', pageWidth / 2, y + 8, { align: 'center' });
    doc.text(`Documento confidencial - Uso exclusivo para análisis espiritual`, pageWidth / 2, y + 13, { align: 'center' });

    // Save
    const filename = `Informe_Analisis_Espiritual_${today.toISOString().split('T')[0]}.pdf`;
    doc.save(filename);
}
