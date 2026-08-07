const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const assetsDir = path.join(__dirname, '..', 'assets', 'charts');

if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(assetsDir)) fs.mkdirSync(assetsDir, { recursive: true });

const sucursalesInfo = [
    { nombre: 'Santo Domingo (Piantini)', capacidadMensual: 4500, peso: 0.28 },
    { nombre: 'Santiago (Los Jardines)', capacidadMensual: 4000, peso: 0.24 },
    { nombre: 'Punta Cana (Bávaro)', capacidadMensual: 3200, peso: 0.18 },
    { nombre: 'Santo Domingo Este (Zona Oriental)', capacidadMensual: 3800, peso: 0.18 },
    { nombre: 'Puerto Plata Club', capacidadMensual: 2500, peso: 0.12 }
];

const planesMembresia = {
    'Básica': { precio: 1690, cacPromedio: 1250 },
    'Premium': { precio: 2690, cacPromedio: 1650 },
    'VIP': { precio: 4890, cacPromedio: 2450 }
};

const nombresMasculinos = ['Juan', 'José', 'Carlos', 'Luis', 'Rafael', 'Miguel', 'Pedro', 'Manuel', 'Ramón', 'Francisco', 'Alejandro', 'Gabriel', 'Emmanuel', 'Kelvin', 'Joan'];
const nombresFemeninos = ['María', 'Ana', 'Carmen', 'Rosa', 'Luisa', 'Patricia', 'Yamilka', 'Altagracia', 'Johanny', 'Nicole', 'Laura', 'Stephanie', 'Genesis', 'Yudelka', 'Carolina'];
const apellidosDominicanos = ['Rodríguez', 'Pérez', 'Martínez', 'García', 'Reyes', 'Sánchez', 'Díaz', 'Peña', 'Rosario', 'Jiménez', 'Gómez', 'Vásquez', 'Cruz', 'Morales', 'Castillo', 'Marte', 'Paulino', 'Santana', 'Ventura', 'Guzmán'];

function generarNombreDominicano() {
    const esHombre = Math.random() < 0.5;
    const listaNombres = esHombre ? nombresMasculinos : nombresFemeninos;
    const primerNombre = listaNombres[Math.floor(Math.random() * listaNombres.length)];
    const primerApellido = apellidosDominicanos[Math.floor(Math.random() * apellidosDominicanos.length)];
    const segundoApellido = apellidosDominicanos[Math.floor(Math.random() * apellidosDominicanos.length)];
    return `${primerNombre} ${primerApellido} ${segundoApellido}`;
}

function generarCedulaDominicanaAleatoria() {
    const prefijos = ['001', '402', '031', '011', '097', '002', '037'];
    const prefijo = prefijos[Math.floor(Math.random() * prefijos.length)];
    
    let cuerpo = '';
    for (let i = 0; i < 7; i++) {
        cuerpo += Math.floor(Math.random() * 10);
    }
    
    const diezDigitos = prefijo + cuerpo;
    const multiplicadores = [1, 2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;
    
    for (let i = 0; i < 10; i++) {
        let prod = parseInt(diezDigitos[i], 10) * multiplicadores[i];
        if (prod >= 10) {
            prod = Math.floor(prod / 10) + (prod % 10);
        }
        suma += prod;
    }
    
    const digitoVerificador = (10 - (suma % 10)) % 10;
    return `${prefijo}-${cuerpo}-${digitoVerificador}`;
}

function randomNormal(mean, stdDev) {
    let u = 0, v = 0;
    while (u === 0) u = Math.random();
    while (v === 0) v = Math.random();
    let num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
    return mean + num * stdDev;
}

const numSociosUnicos = 500;
const socios = [];
const cedulasUsadas = new Set();

for (let i = 1; i <= numSociosUnicos; i++) {
    let idSocio = generarCedulaDominicanaAleatoria();
    while (cedulasUsadas.has(idSocio)) {
        idSocio = generarCedulaDominicanaAleatoria();
    }
    cedulasUsadas.add(idSocio);

    const nombreCliente = generarNombreDominicano();

    let randSuc = Math.random();
    let sucursalNombre = sucursalesInfo[0].nombre;
    let acumulado = 0;
    for (const s of sucursalesInfo) {
        acumulado += s.peso;
        if (randSuc <= acumulado) {
            sucursalNombre = s.nombre;
            break;
        }
    }

    let planTipo = 'Básica';
    let randPlan = Math.random();
    if (sucursalNombre.includes('Piantini')) {
        if (randPlan < 0.35) planTipo = 'Básica';
        else if (randPlan < 0.70) planTipo = 'Premium';
        else planTipo = 'VIP';
    } else if (sucursalNombre.includes('Oriental')) {
        if (randPlan < 0.70) planTipo = 'Básica';
        else if (randPlan < 0.92) planTipo = 'Premium';
        else planTipo = 'VIP';
    } else {
        if (randPlan < 0.50) planTipo = 'Básica';
        else if (randPlan < 0.85) planTipo = 'Premium';
        else planTipo = 'VIP';
    }

    const planData = planesMembresia[planTipo];
    const cac = Math.round(planData.cacPromedio + randomNormal(0, 150));
    
    const duracionMeses = Math.max(1, Math.round(randomNormal(10, 3)));
    const mesAltaIndex = Math.floor(Math.random() * 10);
    
    socios.push({
        idSocio,
        nombreCliente,
        sucursal: sucursalNombre,
        tipoMembresia: planTipo,
        cuotaMensual: planData.precio,
        cac,
        duracionMeses,
        mesAltaIndex,
        mesBajaIndex: mesAltaIndex + duracionMeses
    });
}

const records = [];
let recordId = 5001;

for (let m = 0; m < 12; m++) {
    const monthNumber = m + 1;
    const monthStr = String(monthNumber).padStart(2, '0');
    
    socios.forEach(socio => {
        if (m >= socio.mesAltaIndex && m <= socio.mesBajaIndex) {
            const esMesCancelacion = (m === socio.mesBajaIndex && m < 11);
            const estadoSocio = esMesCancelacion ? 'Cancelado' : 'Activo';
            
            const day = Math.floor(Math.random() * 28) + 1;
            const fecha = `2025-${monthStr}-${String(day).padStart(2, '0')}`;
            const asistencias = Math.max(0, Math.round(randomNormal(11, 3)));
            const nps = Math.min(10, Math.max(1, Math.round(randomNormal(8, 1))));

            records.push({
                id_transaccion: `TRX-RD-${recordId++}`,
                fecha,
                id_socio: socio.idSocio,
                nombre_cliente: socio.nombreCliente,
                sucursal: socio.sucursal,
                categoria_servicio: 'Membresías',
                tipo_membresia: socio.tipoMembresia,
                monto_ingreso: socio.cuotaMensual,
                costo_adquisicion_cac: socio.cac,
                duracion_meses_socio: socio.duracionMeses,
                estado_socio: estadoSocio,
                asistencias_mes: asistencias,
                nps_satisfaccion: nps
            });

            if (Math.random() < 0.22) {
                const dayPT = Math.floor(Math.random() * 28) + 1;
                const fechaPT = `2025-${monthStr}-${String(dayPT).padStart(2, '0')}`;
                const montoPT = Math.round(randomNormal(1500, 200));
                records.push({
                    id_transaccion: `TRX-RD-${recordId++}`,
                    fecha: fechaPT,
                    id_socio: socio.idSocio,
                    nombre_cliente: socio.nombreCliente,
                    sucursal: socio.sucursal,
                    categoria_servicio: 'Personal Trainer',
                    tipo_membresia: socio.tipoMembresia,
                    monto_ingreso: montoPT,
                    costo_adquisicion_cac: socio.cac,
                    duracion_meses_socio: socio.duracionMeses,
                    estado_socio: estadoSocio,
                    asistencias_mes: asistencias,
                    nps_satisfaccion: nps
                });
            }

            if (Math.random() < 0.18) {
                const dayClase = Math.floor(Math.random() * 28) + 1;
                const fechaClase = `2025-${monthStr}-${String(dayClase).padStart(2, '0')}`;
                const montoClase = Math.round(randomNormal(950, 150));
                records.push({
                    id_transaccion: `TRX-RD-${recordId++}`,
                    fecha: fechaClase,
                    id_socio: socio.idSocio,
                    nombre_cliente: socio.nombreCliente,
                    sucursal: socio.sucursal,
                    categoria_servicio: 'Clases Guiadas',
                    tipo_membresia: socio.tipoMembresia,
                    monto_ingreso: montoClase,
                    costo_adquisicion_cac: socio.cac,
                    duracion_meses_socio: socio.duracionMeses,
                    estado_socio: estadoSocio,
                    asistencias_mes: asistencias,
                    nps_satisfaccion: nps
                });
            }

            if (Math.random() < 0.16) {
                const dayTienda = Math.floor(Math.random() * 28) + 1;
                const fechaTienda = `2025-${monthStr}-${String(dayTienda).padStart(2, '0')}`;
                const montoTienda = Math.round(randomNormal(1650, 350));
                records.push({
                    id_transaccion: `TRX-RD-${recordId++}`,
                    fecha: fechaTienda,
                    id_socio: socio.idSocio,
                    nombre_cliente: socio.nombreCliente,
                    sucursal: socio.sucursal,
                    categoria_servicio: 'Tienda Deportiva',
                    tipo_membresia: socio.tipoMembresia,
                    monto_ingreso: montoTienda,
                    costo_adquisicion_cac: socio.cac,
                    duracion_meses_socio: socio.duracionMeses,
                    estado_socio: estadoSocio,
                    asistencias_mes: asistencias,
                    nps_satisfaccion: nps
                });
            }
        }
    });
}

records.sort((a, b) => a.fecha.localeCompare(b.fecha));

const headers = ['id_transaccion','fecha','id_socio','nombre_cliente','sucursal','categoria_servicio','tipo_membresia','monto_ingreso','costo_adquisicion_cac','duracion_meses_socio','estado_socio','asistencias_mes','nps_satisfaccion'];
const csvLines = [headers.join(',')];

records.forEach(r => {
    csvLines.push([
        r.id_transaccion,
        r.fecha,
        r.id_socio,
        `"${r.nombre_cliente}"`,
        `"${r.sucursal}"`,
        `"${r.categoria_servicio}"`,
        `"${r.tipo_membresia}"`,
        r.monto_ingreso.toFixed(2),
        r.costo_adquisicion_cac.toFixed(2),
        r.duracion_meses_socio,
        r.estado_socio,
        r.asistencias_mes,
        r.nps_satisfaccion
    ].join(','));
});

fs.writeFileSync(path.join(dataDir, 'fitpulse_sports_dataset.csv'), csvLines.join('\n'), 'utf8');

const monthlySummary = {};
const sucursalSummary = {};

sucursalesInfo.forEach(s => {
    sucursalSummary[s.nombre] = { 
        totalIngresos: 0, 
        totalCAC: 0, 
        sociosUnicos: new Set(), 
        asistenciasTotal: 0, 
        count: 0, 
        npsSum: 0,
        cancelacionesCount: 0,
        capacidadMensual: s.capacidadMensual
    };
});

records.forEach(r => {
    const ym = r.fecha.substring(0, 7);
    if (!monthlySummary[ym]) {
        monthlySummary[ym] = {
            mrr: 0,
            ingresoTotal: 0,
            cacTotal: 0,
            sociosActivosSet: new Set(),
            sociosCanceladosSet: new Set(),
            totalAsistencias: 0,
            npsSum: 0,
            count: 0
        };
    }

    monthlySummary[ym].ingresoTotal += r.monto_ingreso;
    monthlySummary[ym].cacTotal += r.costo_adquisicion_cac;
    monthlySummary[ym].totalAsistencias += r.asistencias_mes;
    monthlySummary[ym].npsSum += r.nps_satisfaccion;
    monthlySummary[ym].count += 1;

    if (r.categoria_servicio === 'Membresías') {
        monthlySummary[ym].mrr += r.monto_ingreso;
    }
    if (r.estado_socio === 'Activo') {
        monthlySummary[ym].sociosActivosSet.add(r.id_socio);
    } else if (r.estado_socio === 'Cancelado') {
        monthlySummary[ym].sociosCanceladosSet.add(r.id_socio);
    }

    const sObj = sucursalSummary[r.sucursal];
    if (sObj) {
        sObj.totalIngresos += r.monto_ingreso;
        sObj.totalCAC += r.costo_adquisicion_cac;
        sObj.sociosUnicos.add(r.id_socio);
        sObj.asistenciasTotal += r.asistencias_mes;
        sObj.npsSum += r.nps_satisfaccion;
        sObj.count += 1;
        if (r.estado_socio === 'Cancelado' && r.categoria_servicio === 'Membresías') {
            sObj.cancelacionesCount += 1;
        }
    }
});

const monthlyKPIs = Object.keys(monthlySummary).sort().map(ym => {
    const item = monthlySummary[ym];
    const numActivos = item.sociosActivosSet.size || 1;
    const numCancelados = item.sociosCanceladosSet.size;
    const arpu = item.ingresoTotal / numActivos;
    const churnRate = (numCancelados / (numActivos + numCancelados)) * 100;
    const avgNps = item.npsSum / item.count;

    return {
        mes: ym,
        mrr: Math.round(item.mrr * 100) / 100,
        ingresoTotal: Math.round(item.ingresoTotal * 100) / 100,
        sociosActivos: numActivos,
        sociosCancelados: numCancelados,
        churnRate: Math.round(churnRate * 10) / 10,
        arpu: Math.round(arpu * 100) / 100,
        avgAsistencias: Math.round(item.totalAsistencias / item.count),
        avgNps: Math.round(avgNps * 10) / 10
    };
});

const sucursalKPIs = Object.keys(sucursalSummary).map(sName => {
    const s = sucursalSummary[sName];
    const numSocios = s.sociosUnicos.size || 1;
    const avgCAC = Math.round(s.totalCAC / (s.count || 1));
    
    const arpuMensualCliente = (s.totalIngresos / 12) / numSocios;
    const ltvPorCliente = Math.round(arpuMensualCliente * 10 * 0.72);
    const ltvCacRatio = avgCAC > 0 ? Math.round((ltvPorCliente / avgCAC) * 10) / 10 : 0;
    
    const asistenciasPromedioMes = s.asistenciasTotal / 12;
    const ocupacionPct = Math.min(94, Math.round((asistenciasPromedioMes / s.capacidadMensual) * 1000) / 10);
    const avgNps = s.npsSum / (s.count || 1);

    return {
        sucursal: sName,
        totalIngresos: Math.round(s.totalIngresos * 100) / 100,
        totalSocios: numSocios,
        avgCAC,
        avgARPU: Math.round(arpuMensualCliente * 100) / 100,
        ltv: ltvPorCliente,
        ltvCacRatio,
        ocupacionPct,
        avgNps: Math.round(avgNps * 10) / 10
    };
});

const catSummary = {};
records.forEach(r => {
    catSummary[r.categoria_servicio] = (catSummary[r.categoria_servicio] || 0) + r.monto_ingreso;
});

const totalIngresosGlobal = records.reduce((sum, r) => sum + r.monto_ingreso, 0);

const categoryKPIs = Object.keys(catSummary).map(c => ({
    categoria: c,
    ingresos: Math.round(catSummary[c] * 100) / 100,
    porcentaje: Math.round((catSummary[c] / totalIngresosGlobal) * 1000) / 10
}));

const outputSummary = {
    periodoAno: 2025,
    totalRecords: records.length,
    totalIngresosGlobal: Math.round(totalIngresosGlobal * 100) / 100,
    monthlyKPIs,
    sucursalKPIs,
    categoryKPIs
};

fs.writeFileSync(path.join(dataDir, 'fitpulse_kpi_summary.json'), JSON.stringify(outputSummary, null, 2), 'utf8');
