import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AuthGuard from '../../demo/AuthGuard';

// Públicas (sin auth)
const HU001 = lazy(() => import('../../demo/HU001_Registro'));
const HU002 = lazy(() => import('../../demo/HU002_Login'));
const HU003 = lazy(() => import('../../demo/HU003_Recuperar'));
const HU007 = lazy(() => import('../../demo/HU007_ControlAcceso'));

// Ciudadano
const HU004 = lazy(() => import('../../demo/HU004_CrearReporte'));
const HU009 = lazy(() => import('../../demo/HU009_GPS'));
const HU010 = lazy(() => import('../../demo/HU010_EstadoReportes'));
const HU012 = lazy(() => import('../../demo/HU012_LimiteComuna'));
const HU019 = lazy(() => import('../../demo/HU019_EditarReporte'));
const HU020 = lazy(() => import('../../demo/HU020_EliminarReporte'));
const HU022 = lazy(() => import('../../demo/HU022_DeteccionDuplicados'));
const HU023 = lazy(() => import('../../demo/HU023_HistorialReportes'));

// Administrador
const HU006 = lazy(() => import('../../demo/HU006_CambiarEstado'));
const HU016 = lazy(() => import('../../demo/HU016_Notificaciones'));
const HU018 = lazy(() => import('../../demo/HU018_MapaCalor'));

// Cualquier rol autenticado
const HU005 = lazy(() => import('../../demo/HU005_MapaInteractivo'));
const HU021 = lazy(() => import('../../demo/HU021_DetalleReporte'));

// App real
const MapPage      = lazy(() => import('../../pages/main/MapPage'));
const ReportDetail = lazy(() => import('../../pages/main/ReportDetail'));
const HeatMapPage  = lazy(() => import('../../pages/main/HeatMapPage'));

const Loader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: '#005c2e', fontSize: '16px' }}>
        Cargando…
    </div>
);

export default function AppRoutes() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                <Route path="/"           element={<Navigate to="/demo/hu002" replace />} />
                <Route path="/demo"       element={<Navigate to="/demo/hu002" replace />} />

                {/* Públicas */}
                <Route path="/demo/hu001" element={<HU001 />} />
                <Route path="/demo/hu002" element={<HU002 />} />
                <Route path="/demo/hu003" element={<HU003 />} />
                <Route path="/demo/hu007" element={<HU007 />} />

                {/* Ciudadano */}
                <Route path="/demo/hu004" element={<AuthGuard rolRequerido="Ciudadano"><HU004 /></AuthGuard>} />
                <Route path="/demo/hu009" element={<AuthGuard rolRequerido="Ciudadano"><HU009 /></AuthGuard>} />
                <Route path="/demo/hu010" element={<AuthGuard rolRequerido="Ciudadano"><HU010 /></AuthGuard>} />
                <Route path="/demo/hu012" element={<AuthGuard rolRequerido="Ciudadano"><HU012 /></AuthGuard>} />
                <Route path="/demo/hu019" element={<AuthGuard rolRequerido="Ciudadano"><HU019 /></AuthGuard>} />
                <Route path="/demo/hu020" element={<AuthGuard rolRequerido="Ciudadano"><HU020 /></AuthGuard>} />
                <Route path="/demo/hu022" element={<AuthGuard rolRequerido="Ciudadano"><HU022 /></AuthGuard>} />
                <Route path="/demo/hu023" element={<AuthGuard rolRequerido="Ciudadano"><HU023 /></AuthGuard>} />

                {/* Administrador */}
                <Route path="/demo/hu006" element={<AuthGuard rolRequerido="Administrador"><HU006 /></AuthGuard>} />
                <Route path="/demo/hu016" element={<AuthGuard rolRequerido="Administrador"><HU016 /></AuthGuard>} />
                <Route path="/demo/hu018" element={<AuthGuard rolRequerido="Administrador"><HU018 /></AuthGuard>} />

                {/* Cualquier rol */}
                <Route path="/demo/hu005" element={<AuthGuard rolRequerido="cualquiera"><HU005 /></AuthGuard>} />
                <Route path="/demo/hu021" element={<AuthGuard rolRequerido="cualquiera"><HU021 /></AuthGuard>} />

                {/* App real */}
                <Route path="/map"           element={<MapPage />} />
                <Route path="/report-detail" element={<ReportDetail />} />
                <Route path="/heatmap"       element={<HeatMapPage />} />

                <Route path="*" element={<Navigate to="/demo/hu002" replace />} />
            </Routes>
        </Suspense>
    );
}
