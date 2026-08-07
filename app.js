document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    let rawDataset = [];
    let filteredData = [];
    let currentPage = 1;
    const pageSize = 10;

    let chartMRRChurnInstance = null;
    let chartCategoryInstance = null;
    let chartLTVCACInstance = null;
    let chartOccupationInstance = null;

    const dataStatusEl = document.getElementById('data-status');
    const filterSucursal = document.getElementById('filter-sucursal');
    const filterCategoria = document.getElementById('filter-categoria');
    const filterMembresia = document.getElementById('filter-membresia');
    const filterPeriodo = document.getElementById('filter-periodo');
    const btnResetFilters = document.getElementById('btn-reset-filters');
    const btnExportCSV = document.getElementById('btn-export-csv');
    const tableSearch = document.getElementById('table-search');
    const tableBody = document.getElementById('table-body');
    const tableRecordCount = document.getElementById('table-record-count');
    const paginationInfo = document.getElementById('pagination-info');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');

    const reportModal = document.getElementById('report-modal');
    const btnOpenReport = document.getElementById('btn-open-report');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const modalReportBody = document.getElementById('modal-report-body');

    const themeToggleBtn = document.getElementById('theme-toggle');

    const capacidadSucursales = {
        'Santo Domingo (Piantini)': 4500,
        'Santiago (Los Jardines)': 4000,
        'Punta Cana (Bávaro)': 3200,
        'Santo Domingo Este (Zona Oriental)': 3800,
        'Puerto Plata Club': 2500
    };

    fetchData();

    function fetchData() {
        Papa.parse('data/fitpulse_sports_dataset.csv', {
            download: true,
            header: true,
            dynamicTyping: true,
            complete: (results) => {
                rawDataset = results.data.filter(row => row.id_transaccion);
                filteredData = [...rawDataset];
                dataStatusEl.textContent = `${rawDataset.length} Transacciones Verificadas`;
                initDashboard();
            },
            error: (err) => {
                console.error('Error al cargar datos:', err);
                dataStatusEl.textContent = 'Error al cargar datos';
            }
        });
    }

    function initDashboard() {
        setupEventListeners();
        updateDashboard();
    }

    function setupEventListeners() {
        [filterSucursal, filterCategoria, filterMembresia, filterPeriodo].forEach(select => {
            select.addEventListener('change', () => {
                currentPage = 1;
                applyFilters();
            });
        });

        btnResetFilters.addEventListener('click', () => {
            filterSucursal.value = 'ALL';
            filterCategoria.value = 'ALL';
            filterMembresia.value = 'ALL';
            filterPeriodo.value = '2025';
            tableSearch.value = '';
            currentPage = 1;
            applyFilters();
        });

        tableSearch.addEventListener('input', () => {
            currentPage = 1;
            renderTable();
        });

        btnPrevPage.addEventListener('click', () => {
            if (currentPage > 1) {
                currentPage--;
                renderTable();
            }
        });

        btnNextPage.addEventListener('click', () => {
            const maxPage = Math.ceil(getSearchedData().length / pageSize) || 1;
            if (currentPage < maxPage) {
                currentPage++;
                renderTable();
            }
        });

        if (btnExportCSV) btnExportCSV.addEventListener('click', exportToCSV);
    }

    function applyFilters() {
        const suc = filterSucursal.value;
        const cat = filterCategoria.value;
        const mem = filterMembresia.value;
        const per = filterPeriodo.value;

        const periodBadge = document.getElementById('period-badge');
        if (periodBadge) {
            if (per === 'Q1-2025') periodBadge.textContent = 'Q1 2025 (Ene - Mar)';
            else if (per === 'Q2-2025') periodBadge.textContent = 'Q2 2025 (Abr - Jun)';
            else if (per === 'Q3-2025') periodBadge.textContent = 'Q3 2025 (Jul - Sep)';
            else if (per === 'Q4-2025') periodBadge.textContent = 'Q4 2025 (Oct - Dic)';
            else periodBadge.textContent = 'Año 2025';
        }

        filteredData = rawDataset.filter(r => {
            if (suc !== 'ALL' && r.sucursal !== suc) return false;
            if (cat !== 'ALL' && r.categoria_servicio !== cat) return false;
            if (mem !== 'ALL' && r.tipo_membresia !== mem) return false;
            
            if (per === 'Q1-2025') {
                if (!(r.fecha >= '2025-01-01' && r.fecha <= '2025-03-31')) return false;
            } else if (per === 'Q2-2025') {
                if (!(r.fecha >= '2025-04-01' && r.fecha <= '2025-06-30')) return false;
            } else if (per === 'Q3-2025') {
                if (!(r.fecha >= '2025-07-01' && r.fecha <= '2025-09-30')) return false;
            } else if (per === 'Q4-2025') {
                if (!(r.fecha >= '2025-10-01' && r.fecha <= '2025-12-31')) return false;
            }
            return true;
        });

        updateDashboard();
    }

    function updateDashboard() {
        calculateKPIs();
        updateCharts();
        renderTable();
    }

    function calculateKPIs() {
        const totalIngresos = filteredData.reduce((sum, r) => sum + (r.monto_ingreso || 0), 0);
        
        const mrrIngresos = filteredData
            .filter(r => r.categoria_servicio === 'Membresías')
            .reduce((sum, r) => sum + (r.monto_ingreso || 0), 0);
        
        const numMonths = getUniqueMonthsCount(filteredData) || 1;
        const avgMRR = Math.round(mrrIngresos / numMonths);

        const sociosActivosSet = new Set(filteredData.filter(r => r.estado_socio === 'Activo').map(r => r.id_socio));
        const numSociosActivos = sociosActivosSet.size || 1;

        const arpuMensual = Math.round((totalIngresos / numMonths) / numSociosActivos);

        const canceladosSet = new Set(filteredData.filter(r => r.estado_socio === 'Cancelado').map(r => r.id_socio));
        const numCancelados = canceladosSet.size;
        const churnRate = Math.round((numCancelados / (numSociosActivos + numCancelados)) * 100);

        const avgCAC = Math.round(filteredData.reduce((sum, r) => sum + (r.costo_adquisicion_cac || 0), 0) / (filteredData.length || 1));
        const ltv = Math.round(arpuMensual * 10 * 0.72);
        const ltvCacRatio = avgCAC > 0 ? Math.round(ltv / avgCAC) : 0;

        const totalAsistencias = filteredData.reduce((sum, r) => sum + (r.asistencias_mes || 0), 0);
        const asistenciasPromedioMes = totalAsistencias / numMonths;
        const capacidadBase = filterSucursal.value !== 'ALL' ? (capacidadSucursales[filterSucursal.value] || 3600) : 18000;
        const ocupacionPct = Math.min(94, Math.round((asistenciasPromedioMes / capacidadBase) * 100));

        const avgNPS = Math.round(filteredData.reduce((sum, r) => sum + (r.nps_satisfaccion || 0), 0) / (filteredData.length || 1));

        document.getElementById('kpi-mrr').textContent = `RD$ ${avgMRR.toLocaleString()}`;
        document.getElementById('mrr-progress').style.width = `${Math.min(100, (avgMRR / 6800000) * 100)}%`;

        document.getElementById('kpi-arpu').textContent = `RD$ ${arpuMensual.toLocaleString()}`;
        document.getElementById('arpu-progress').style.width = `${Math.min(100, (arpuMensual / 3500) * 100)}%`;

        document.getElementById('kpi-churn').textContent = `${churnRate}%`;
        const churnProgress = Math.min(100, (churnRate / 8) * 100);
        document.getElementById('churn-progress').style.width = `${churnProgress}%`;

        document.getElementById('kpi-ltvcac').textContent = `${ltvCacRatio}x`;
        document.getElementById('ltv-progress').style.width = `${Math.min(100, (ltvCacRatio / 4) * 100)}%`;

        document.getElementById('kpi-ocupacion').textContent = `${ocupacionPct}%`;
        document.getElementById('ocupacion-progress').style.width = `${ocupacionPct}%`;

        document.getElementById('kpi-nps').textContent = `${avgNPS} / 10`;
        document.getElementById('nps-progress').style.width = `${(avgNPS / 10) * 100}%`;
    }

    function getUniqueMonthsCount(data) {
        const months = new Set(data.map(r => r.fecha ? r.fecha.substring(0, 7) : ''));
        return months.size;
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

    function updateCharts() {
        const isDark = !document.body.classList.contains('light-theme');
        const textColor = isDark ? '#cbd5e1' : '#334155';
        const gridColor = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

        const monthlyData = getMonthlyAggregates(filteredData);
        const rawMonths = Object.keys(monthlyData).sort();
        const formattedMonthLabels = rawMonths.map(m => formatMonthLabel(m));
        const mrrValues = rawMonths.map(m => Math.round(monthlyData[m].mrr));
        const churnValues = rawMonths.map(m => Math.round(monthlyData[m].churnRate));

        if (chartMRRChurnInstance) chartMRRChurnInstance.destroy();
        chartMRRChurnInstance = new Chart(document.getElementById('chart-mrr-churn'), {
            type: 'bar',
            data: {
                labels: formattedMonthLabels,
                datasets: [
                    {
                        label: 'Ingresos Recurrentes (RD$)',
                        data: mrrValues,
                        backgroundColor: '#38bdf8',
                        borderRadius: 4,
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        yAxisID: 'y'
                    },
                    {
                        label: 'Cancelación de Clientes (%)',
                        data: churnValues,
                        type: 'bar',
                        backgroundColor: '#f43f5e',
                        borderRadius: 4,
                        categoryPercentage: 0.7,
                        barPercentage: 0.8,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { mode: 'index', intersect: false },
                scales: {
                    x: {
                        ticks: { color: textColor, font: { size: 11, weight: '500' }, maxRotation: 0 },
                        grid: { color: gridColor }
                    },
                    y: { 
                        position: 'left',
                        ticks: { color: textColor, font: { size: 11 }, callback: v => `RD$ ${Math.round(v/1000)}k` },
                        grid: { color: gridColor }
                    },
                    y1: {
                        position: 'right',
                        min: 0,
                        max: Math.max(...churnValues, 12) * 1.2,
                        ticks: { color: '#f43f5e', font: { size: 11, weight: '600' }, callback: v => `${Math.round(v)}%` },
                        grid: { drawOnChartArea: false }
                    }
                },
                plugins: {
                    legend: { position: 'top', labels: { color: textColor, font: { size: 12, weight: '600' }, usePointStyle: true } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                if (ctx.datasetIndex === 0) return ` Ingresos Recurrentes: RD$ ${Math.round(ctx.raw).toLocaleString()}`;
                                return ` Cancelación de Clientes: ${Math.round(ctx.raw)}%`;
                            }
                        }
                    }
                }
            }
        });

        const catData = getCategoryAggregates(filteredData);
        const totalCatRev = Object.values(catData).reduce((a, b) => a + b, 0) || 1;
        const catLabelsWithPct = Object.keys(catData).map(c => {
            const val = catData[c];
            const pct = Math.round((val / totalCatRev) * 100);
            return `${c}: ${pct}% (RD$ ${Math.round(val/1000)}k)`;
        });

        if (chartCategoryInstance) chartCategoryInstance.destroy();
        chartCategoryInstance = new Chart(document.getElementById('chart-category'), {
            type: 'doughnut',
            data: {
                labels: catLabelsWithPct,
                datasets: [{
                    data: Object.values(catData),
                    backgroundColor: ['#38bdf8', '#818cf8', '#34d399', '#f43f5e'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom', labels: { color: textColor, font: { size: 11 } } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                const val = ctx.raw;
                                const pct = Math.round((val / totalCatRev) * 100);
                                return ` RD$ ${Math.round(val).toLocaleString()} (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });

        const sucursalData = getSucursalAggregates(filteredData);
        const sucursalesList = Object.keys(sucursalData);
        const cacList = sucursalesList.map(s => sucursalData[s].avgCAC);
        const ltvList = sucursalesList.map(s => sucursalData[s].ltv);

        if (chartLTVCACInstance) chartLTVCACInstance.destroy();
        chartLTVCACInstance = new Chart(document.getElementById('chart-ltv-cac'), {
            type: 'bar',
            data: {
                labels: sucursalesList.map(s => getShortLabel(s)),
                datasets: [
                    { label: 'Costo Captación en Publicidad', data: cacList, backgroundColor: '#fbbf24', borderRadius: 4 },
                    { label: 'Ganancia por Socio en 10 Meses', data: ltvList, backgroundColor: '#10b981', borderRadius: 4 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor, callback: v => `RD$ ${Math.round(v/1000)}k` }, grid: { color: gridColor } }
                },
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` ${ctx.dataset.label}: RD$ ${Math.round(ctx.raw).toLocaleString()}`;
                            }
                        }
                    }
                }
            }
        });

        const ocupacionList = sucursalesList.map(s => sucursalData[s].ocupacionPct);

        if (chartOccupationInstance) chartOccupationInstance.destroy();
        chartOccupationInstance = new Chart(document.getElementById('chart-occupation'), {
            type: 'bar',
            data: {
                labels: sucursalesList.map(s => getShortLabel(s)),
                datasets: [
                    { label: 'Porcentaje de Ocupación', data: ocupacionList, backgroundColor: '#38bdf8', borderRadius: 6 }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: { ticks: { color: textColor }, grid: { color: gridColor } },
                    y: { ticks: { color: textColor, callback: v => `${Math.round(v)}%` }, grid: { color: gridColor }, max: 100 }
                },
                plugins: {
                    legend: { labels: { color: textColor } },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                return ` Ocupación: ${Math.round(ctx.raw)}% de la capacidad`;
                            }
                        }
                    }
                }
            }
        });
    }

    function getShortLabel(s) {
        if (s.includes('Piantini')) return 'Piantini';
        if (s.includes('Jardines')) return 'Los Jardines';
        if (s.includes('Bávaro') || s.includes('Punta')) return 'Bávaro';
        if (s.includes('Oriental') || s.includes('Este')) return 'Zona Oriental';
        if (s.includes('Puerto')) return 'Puerto Plata';
        return s.split(' ')[0];
    }

    function getMonthlyAggregates(data) {
        const res = {};
        data.forEach(r => {
            if (!r.fecha) return;
            const ym = r.fecha.substring(0, 7);
            if (!res[ym]) res[ym] = { mrr: 0, canceladosSet: new Set(), activosSet: new Set() };
            if (r.categoria_servicio === 'Membresías') res[ym].mrr += r.monto_ingreso || 0;
            if (r.estado_socio === 'Activo') res[ym].activosSet.add(r.id_socio);
            if (r.estado_socio === 'Cancelado') res[ym].canceladosSet.add(r.id_socio);
        });

        Object.keys(res).forEach(ym => {
            const activos = res[ym].activosSet.size || 1;
            const cancelados = res[ym].canceladosSet.size;
            res[ym].churnRate = Math.round((cancelados / (activos + cancelados)) * 100);
        });
        return res;
    }

    function getCategoryAggregates(data) {
        const res = {};
        data.forEach(r => {
            const cat = r.categoria_servicio || 'Otros';
            res[cat] = (res[cat] || 0) + (r.monto_ingreso || 0);
        });
        return res;
    }

    function getSucursalAggregates(data) {
        const res = {};
        const numMonths = getUniqueMonthsCount(data) || 1;
        data.forEach(r => {
            const s = r.sucursal || 'General';
            if (!res[s]) res[s] = { totalIngresos: 0, totalCAC: 0, totalAsistencias: 0, npsSum: 0, count: 0, socios: new Set() };
            res[s].totalIngresos += r.monto_ingreso || 0;
            res[s].totalCAC += r.costo_adquisicion_cac || 0;
            res[s].totalAsistencias += r.asistencias_mes || 0;
            res[s].npsSum += r.nps_satisfaccion || 0;
            res[s].count += 1;
            if (r.id_socio) res[s].socios.add(r.id_socio);
        });

        Object.keys(res).forEach(s => {
            const count = res[s].count || 1;
            const sociosCount = res[s].socios.size || 1;
            const avgCAC = Math.round(res[s].totalCAC / count);
            const arpuMensualCliente = Math.round((res[s].totalIngresos / numMonths) / sociosCount);
            const ltvPorCliente = Math.round(arpuMensualCliente * 10 * 0.72);
            const asistenciasPromedioMes = res[s].totalAsistencias / numMonths;
            const capBase = capacidadSucursales[s] || 3600;
            
            res[s].avgCAC = avgCAC;
            res[s].ltv = ltvPorCliente;
            res[s].ltvCacRatio = avgCAC > 0 ? Math.round(ltvPorCliente / avgCAC) : 0;
            res[s].ocupacionPct = Math.min(94, Math.round((asistenciasPromedioMes / capBase) * 100));
            res[s].avgNPS = Math.round(res[s].npsSum / count);
        });
        return res;
    }

    function getSearchedData() {
        const query = tableSearch.value.toLowerCase().trim();
        if (!query) return filteredData;
        return filteredData.filter(r => 
            (r.nombre_cliente && r.nombre_cliente.toLowerCase().includes(query)) ||
            (r.id_socio && r.id_socio.toLowerCase().includes(query)) ||
            (r.sucursal && r.sucursal.toLowerCase().includes(query)) ||
            (r.categoria_servicio && r.categoria_servicio.toLowerCase().includes(query)) ||
            (r.tipo_membresia && r.tipo_membresia.toLowerCase().includes(query))
        );
    }

    function renderTable() {
        const searched = getSearchedData();
        tableRecordCount.textContent = searched.length.toLocaleString();

        const totalPages = Math.ceil(searched.length / pageSize) || 1;
        if (currentPage > totalPages) currentPage = totalPages;

        paginationInfo.textContent = `Página ${currentPage} de ${totalPages}`;

        const startIdx = (currentPage - 1) * pageSize;
        const pageData = searched.slice(startIdx, startIdx + pageSize);

        tableBody.innerHTML = '';
        pageData.forEach(r => {
            const tr = document.createElement('tr');
            let estadoBadgeClass = r.estado_socio === 'Activo' ? 'positive' : 'negative';

            tr.innerHTML = `
                <td><strong>${r.id_transaccion}</strong></td>
                <td>${r.fecha}</td>
                <td><strong>${r.nombre_cliente || 'Cliente General'}</strong></td>
                <td>${r.id_socio}</td>
                <td>${r.sucursal}</td>
                <td>${r.categoria_servicio}</td>
                <td><span class="badge outline-badge">${r.tipo_membresia}</span></td>
                <td><strong>RD$ ${r.monto_ingreso ? Math.round(r.monto_ingreso).toLocaleString() : '0'}</strong></td>
                <td>RD$ ${r.costo_adquisicion_cac ? Math.round(r.costo_adquisicion_cac).toLocaleString() : '0'}</td>
                <td><span class="kpi-trend ${estadoBadgeClass}">${r.estado_socio}</span></td>
                <td>${Math.round(r.asistencias_mes)} visitas</td>
                <td><strong>${Math.round(r.nps_satisfaccion)}/10</strong></td>
            `;
            tableBody.appendChild(tr);
        });
    }

    function exportToCSV() {
        const searched = getSearchedData();
        const csvContent = Papa.unparse(searched);
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fitpulse_rd_datos_${new Date().toISOString().slice(0, 10)}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }

    function loadAndShowReport() {
        fetch('informe_analisis.md')
            .then(res => res.text())
            .then(text => {
                modalReportBody.innerHTML = parseMarkdownToHTML(text);
                reportModal.classList.add('active');
            })
            .catch(err => {
                modalReportBody.innerHTML = '<p>Error al cargar el informe de análisis.</p>';
                reportModal.classList.add('active');
            });
    }

    function parseMarkdownToHTML(md) {
        let html = md
            .replace(/^# (.*$)/gim, '<h1>$1</h1>')
            .replace(/^## (.*$)/gim, '<h2>$1</h2>')
            .replace(/^### (.*$)/gim, '<h3>$1</h3>')
            .replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/gim, '<em>$1</em>')
            .replace(/^> (.*$)/gim, '<blockquote style="border-left: 3px solid var(--accent-cyan); padding-left: 1rem; color: var(--text-secondary); margin: 1rem 0;">$1</blockquote>')
            .replace(/\n\n/g, '<br><br>');
        return html;
    }
});
