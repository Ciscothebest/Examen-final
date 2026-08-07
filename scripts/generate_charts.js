const fs = require('fs');
const path = require('path');

const summaryPath = path.join(__dirname, '..', 'data', 'fitpulse_kpi_summary.json');
const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

const assetsDir = path.join(__dirname, '..', 'assets', 'charts');
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

function getShortLabel(s) {
    if (s.includes('Piantini')) return 'Piantini';
    if (s.includes('Jardines')) return 'Los Jardines';
    if (s.includes('Bávaro') || s.includes('Punta')) return 'Bávaro';
    if (s.includes('Oriental') || s.includes('Este')) return 'Zona Oriental';
    if (s.includes('Puerto')) return 'Puerto Plata';
    return s.split(' ')[0];
}

function formatMonthLabel(ym) {
    if (!ym) return '';
    const parts = ym.split('-');
    if (parts.length < 2) return ym;
    const monthNames = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const mIdx = parseInt(parts[1], 10) - 1;
    const yearShort = parts[0].substring(2);
    return `${monthNames[mIdx]} ${yearShort}`;
}

function createMRRvsChurnSVG() {
    const width = 800;
    const height = 400;
    const padding = 60;
    const data = summary.monthlyKPIs;

    const maxMRR = Math.max(...data.map(d => d.mrr)) * 1.15;
    const maxChurn = Math.max(...data.map(d => d.churnRate)) * 1.35 || 12;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background-color: #0f172a; font-family: system-ui, sans-serif; border-radius: 12px;">
        <text x="${width/2}" y="32" fill="#f8fafc" font-size="17" font-weight="bold" text-anchor="middle">Evolución Mensual (Año 2025): Ingresos Recurrentes (RD$) y Cancelación (%)</text>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1.5"/>
        <line x1="${padding}" y1="${padding}" x2="${padding}" y2="${height - padding}" stroke="#334155" stroke-width="1.5"/>
        <line x1="${width - padding}" y1="${padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1.5"/>
    `;

    const chartW = width - 2 * padding;
    const chartH = height - 2 * padding;
    const stepX = chartW / data.length;

    data.forEach((d, i) => {
        const groupX = padding + i * stepX + stepX / 6;

        const mrrH = (d.mrr / maxMRR) * chartH;
        const mrrY = height - padding - mrrH;
        svg += `<rect x="${groupX}" y="${mrrY}" width="16" height="${mrrH}" fill="#38bdf8" rx="2">
            <title>${d.mes}: RD$ ${Math.round(d.mrr).toLocaleString()}</title>
        </rect>`;

        const churnH = (d.churnRate / maxChurn) * chartH;
        const churnY = height - padding - churnH;
        svg += `<rect x="${groupX + 18}" y="${churnY}" width="16" height="${churnH}" fill="#f43f5e" rx="2">
            <title>${d.mes}: Cancelación ${d.churnRate}%</title>
        </rect>`;

        const shortM = formatMonthLabel(d.mes);
        svg += `<text x="${groupX + 17}" y="${height - padding + 20}" fill="#94a3b8" font-size="11" text-anchor="middle">${shortM}</text>`;
    });

    svg += `
        <rect x="${width/2 - 180}" y="${height - 25}" width="14" height="14" fill="#38bdf8" rx="2"/>
        <text x="${width/2 - 160}" y="${height - 13}" fill="#cbd5e1" font-size="12">Ingresos Recurrentes (RD$)</text>
        <rect x="${width/2 + 30}" y="${height - 25}" width="14" height="14" fill="#f43f5e" rx="2"/>
        <text x="${width/2 + 50}" y="${height - 13}" fill="#cbd5e1" font-size="12">Cancelación de Clientes (%)</text>
    </svg>`;

    fs.writeFileSync(path.join(assetsDir, 'kpi_1_mrr_churn.svg'), svg, 'utf8');
}

function createLTVvsCACSVG() {
    const width = 800;
    const height = 400;
    const padding = 60;
    const data = summary.sucursalKPIs;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background-color: #0f172a; font-family: system-ui, sans-serif; border-radius: 12px;">
        <text x="${width/2}" y="32" fill="#f8fafc" font-size="17" font-weight="bold" text-anchor="middle">Valor del Cliente en 10 Meses (LTV) vs Costo Captación (CAC) - Año 2025</text>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1.5"/>
    `;

    const maxVal = Math.max(...data.map(d => d.ltv)) * 1.25;
    const chartW = width - 2 * padding;
    const chartH = height - 2 * padding;
    const groupW = chartW / data.length;

    data.forEach((d, i) => {
        const groupX = padding + i * groupW + groupW / 6;

        const cacH = (d.avgCAC / maxVal) * chartH;
        const cacY = height - padding - cacH;
        svg += `<rect x="${groupX}" y="${cacY}" width="26" height="${cacH}" fill="#fbbf24" rx="4"/>`;
        svg += `<text x="${groupX + 13}" y="${cacY - 6}" fill="#fbbf24" font-size="10" font-weight="bold" text-anchor="middle">RD$${Math.round(d.avgCAC)}</text>`;

        const ltvH = (d.ltv / maxVal) * chartH;
        const ltvY = height - padding - ltvH;
        svg += `<rect x="${groupX + 30}" y="${ltvY}" width="26" height="${ltvH}" fill="#10b981" rx="4"/>`;
        svg += `<text x="${groupX + 43}" y="${ltvY - 6}" fill="#10b981" font-size="10" font-weight="bold" text-anchor="middle">RD$${Math.round(d.ltv/1000)}k</text>`;

        const shortName = getShortLabel(d.sucursal);
        svg += `<text x="${groupX + 28}" y="${height - padding + 20}" fill="#e2e8f0" font-size="11" font-weight="600" text-anchor="middle">${shortName}</text>`;
        svg += `<text x="${groupX + 28}" y="${height - padding + 36}" fill="#38bdf8" font-size="10" text-anchor="middle">Retorno: ${d.ltvCacRatio.toFixed(1)}x</text>`;
    });

    svg += `
        <rect x="${width/2 - 170}" y="${height - 18}" width="14" height="14" fill="#fbbf24" rx="2"/>
        <text x="${width/2 - 150}" y="${height - 6}" fill="#cbd5e1" font-size="12">Costo Captación (CAC)</text>
        <rect x="${width/2 + 40}" y="${height - 18}" width="14" height="14" fill="#10b981" rx="2"/>
        <text x="${width/2 + 60}" y="${height - 6}" fill="#cbd5e1" font-size="12">Valor del Cliente (LTV)</text>
    </svg>`;

    fs.writeFileSync(path.join(assetsDir, 'kpi_2_ltv_cac.svg'), svg, 'utf8');
}

function createRevenueCategorySVG() {
    const width = 600;
    const height = 380;
    const cx = 200, cy = 190, r = 110, innerR = 65;
    const data = summary.categoryKPIs;
    const total = data.reduce((s, d) => s + d.ingresos, 0);

    const colors = ['#38bdf8', '#818cf8', '#34d399', '#f43f5e'];

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background-color: #0f172a; font-family: system-ui, sans-serif; border-radius: 12px;">
        <text x="${width/2}" y="32" fill="#f8fafc" font-size="17" font-weight="bold" text-anchor="middle">Distribución de Ingresos por Servicio (Año 2025)</text>
    `;

    let startAngle = 0;
    data.forEach((d, i) => {
        const sliceAngle = (d.ingresos / total) * 2 * Math.PI;
        const endAngle = startAngle + sliceAngle;

        const x1 = cx + r * Math.sin(startAngle);
        const y1 = cy - r * Math.cos(startAngle);
        const x2 = cx + r * Math.sin(endAngle);
        const y2 = cy - r * Math.cos(endAngle);

        const ix1 = cx + innerR * Math.sin(endAngle);
        const iy1 = cy - innerR * Math.cos(endAngle);
        const ix2 = cx + innerR * Math.sin(startAngle);
        const iy2 = cy - innerR * Math.cos(startAngle);

        const largeArc = sliceAngle > Math.PI ? 1 : 0;

        const pathData = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;

        svg += `<path d="${pathData}" fill="${colors[i % colors.length]}">
            <title>${d.categoria}: RD$ ${Math.round(d.ingresos).toLocaleString()} (${Math.round(d.ingresos/total*100)}%)</title>
        </path>`;

        const ly = 100 + i * 45;
        const pct = ((d.ingresos / total) * 100).toFixed(1);
        svg += `
            <rect x="360" y="${ly}" width="16" height="16" fill="${colors[i % colors.length]}" rx="3"/>
            <text x="385" y="${ly + 13}" fill="#f8fafc" font-size="13" font-weight="600">${d.categoria}</text>
            <text x="385" y="${ly + 30}" fill="#94a3b8" font-size="12">RD$ ${Math.round(d.ingresos).toLocaleString()} (${pct}%)</text>
        `;

        startAngle = endAngle;
    });

    svg += `<text x="${cx}" y="${cy - 5}" fill="#f8fafc" font-size="15" font-weight="bold" text-anchor="middle">Total RD$</text>`;
    svg += `<text x="${cx}" y="${cy + 15}" fill="#38bdf8" font-size="12" text-anchor="middle">RD$ ${(Math.round(total/1000000*10)/10).toFixed(1)}M</text>`;
    svg += `</svg>`;

    fs.writeFileSync(path.join(assetsDir, 'kpi_3_ingresos_categoria.svg'), svg, 'utf8');
}

function createOccupationSVG() {
    const width = 800;
    const height = 380;
    const padding = 60;
    const data = summary.sucursalKPIs;

    let svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" style="background-color: #0f172a; font-family: system-ui, sans-serif; border-radius: 12px;">
        <text x="${width/2}" y="32" fill="#f8fafc" font-size="17" font-weight="bold" text-anchor="middle">Porcentaje de Ocupación de Instalaciones por Sucursal (Año 2025)</text>
        <line x1="${padding}" y1="${height - padding}" x2="${width - padding}" y2="${height - padding}" stroke="#334155" stroke-width="1.5"/>
    `;

    const chartW = width - 2 * padding;
    const barW = chartW / data.length - 40;

    data.forEach((d, i) => {
        const x = padding + i * (barW + 40) + 20;
        const barH = (d.ocupacionPct / 100) * (height - 2 * padding);
        const y = height - padding - barH;

        let color = '#38bdf8';
        if (d.ocupacionPct < 70) color = '#fbbf24';

        const shortLabel = getShortLabel(d.sucursal);

        svg += `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" fill="${color}" rx="6"/>`;
        svg += `<text x="${x + barW/2}" y="${y - 8}" fill="${color}" font-size="13" font-weight="bold" text-anchor="middle">${d.ocupacionPct}%</text>`;
        svg += `<text x="${x + barW/2}" y="${height - padding + 20}" fill="#e2e8f0" font-size="11" text-anchor="middle">${shortLabel}</text>`;
    });

    svg += `</svg>`;
    fs.writeFileSync(path.join(assetsDir, 'kpi_4_ocupacion_sucursales.svg'), svg, 'utf8');
}

createMRRvsChurnSVG();
createLTVvsCACSVG();
createRevenueCategorySVG();
createOccupationSVG();
