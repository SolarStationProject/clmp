import { Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import AppShell from '../AppShell';

// ── App ciudadano ──────────────────────────────────────────────────────────────
const LoginScreen       = lazy(() => import('../screens/LoginScreen'));
const MapScreen         = lazy(() => import('../screens/MapScreen'));
const MisReportesScreen = lazy(() => import('../screens/MisReportesScreen'));
const PerfilScreen      = lazy(() => import('../screens/PerfilScreen'));

const RecuperarScreen      = lazy(() => import('../screens/RecuperarScreen'));
const ReporteDetalleScreen = lazy(() => import('../screens/ReporteDetalleScreen'));
const EditarReporteScreen  = lazy(() => import('../screens/EditarReporteScreen'));
const CrearReporteScreen   = lazy(() => import('../screens/CrearReporteScreen'));

// ── Demo (administrador + HUs) ─────────────────────────────────────────────────
import AuthGuard from '../../demo/AuthGuard';
const DemoIndex = lazy(() => import('../../demo/DemoIndex'));
const HU001 = lazy(() => import('../../demo/HU001_Registro'));
const HU002 = lazy(() => import('../../demo/HU002_Login'));
const HU003 = lazy(() => import('../../demo/HU003_Recuperar'));
const HU004 = lazy(() => import('../../demo/HU004_CrearReporte'));
const HU005 = lazy(() => import('../../demo/HU005_MapaInteractivo'));
const HU006 = lazy(() => import('../../demo/HU006_CambiarEstado'));
const HU007 = lazy(() => import('../../demo/HU007_ControlAcceso'));
const HU008 = lazy(() => import('../../demo/HU008_VerificarReporte'));
const HU009 = lazy(() => import('../../demo/HU009_GPS'));
const HU010 = lazy(() => import('../../demo/HU010_EstadoReportes'));
const HU011 = lazy(() => import('../../demo/HU011_ExportarCSV'));
const HU012 = lazy(() => import('../../demo/HU012_LimiteComuna'));
const HU013 = lazy(() => import('../../demo/HU013_ValidacionComunitaria'));
const HU014 = lazy(() => import('../../demo/HU014_FiltrarReportes'));
const HU015 = lazy(() => import('../../demo/HU015_AsignarPrioridad'));
const HU016 = lazy(() => import('../../demo/HU016_Notificaciones'));
const HU017 = lazy(() => import('../../demo/HU017_Dashboard'));
const HU018 = lazy(() => import('../../demo/HU018_MapaCalor'));
const HU019 = lazy(() => import('../../demo/HU019_EditarReporte'));
const HU020 = lazy(() => import('../../demo/HU020_EliminarReporte'));
const HU021 = lazy(() => import('../../demo/HU021_DetalleReporte'));
const HU022 = lazy(() => import('../../demo/HU022_DeteccionDuplicados'));
const HU023 = lazy(() => import('../../demo/HU023_HistorialReportes'));

// ── Guard ciudadano ────────────────────────────────────────────────────────────
function CiudadanoGuard({ children }: { children: React.ReactNode }) {
    const token  = localStorage.getItem('cleanmap_token');
    const rol    = localStorage.getItem('cleanmap_rol');
    if (!token) return <Navigate to="/login" replace />;
    if (rol !== 'Ciudadano') return <Navigate to="/demo" replace />;
    return <>{children}</>;
}

const Loader = () => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', color: '#005c2e', fontSize: '16px', fontFamily: 'system-ui' }}>
        Cargando…
    </div>
);

export default function AppRoutes() {
    return (
        <Suspense fallback={<Loader />}>
            <Routes>
                {/* Raíz: redirige según sesión */}
                <Route path="/" element={
                    (() => {
                        const rol = localStorage.getItem('cleanmap_rol');
                        const tok = localStorage.getItem('cleanmap_token');
                        if (!tok)                    return <Navigate to="/login"    replace />;
                        if (rol === 'Ciudadano')     return <Navigate to="/app/mapa" replace />;
                        return                              <Navigate to="/demo"      replace />;
                    })()
                } />

                {/* Login/Registro/Recuperar — rutas públicas */}
                <Route path="/login"     element={<LoginScreen />} />
                <Route path="/recuperar" element={<RecuperarScreen />} />

                {/* App ciudadano con bottom tabs */}
                <Route path="/app/mapa" element={
                    <CiudadanoGuard><AppShell><MapScreen /></AppShell></CiudadanoGuard>
                } />
                <Route path="/app/mis-reportes" element={
                    <CiudadanoGuard><AppShell><MisReportesScreen /></AppShell></CiudadanoGuard>
                } />
                <Route path="/app/perfil" element={
                    <CiudadanoGuard><AppShell><PerfilScreen /></AppShell></CiudadanoGuard>
                } />
                <Route path="/app/reporte" element={
                    <CiudadanoGuard><ReporteDetalleScreen /></CiudadanoGuard>
                } />
                <Route path="/app/editar" element={
                    <CiudadanoGuard><EditarReporteScreen /></CiudadanoGuard>
                } />
                <Route path="/app/crear" element={
                    <CiudadanoGuard><CrearReporteScreen /></CiudadanoGuard>
                } />

                {/* Demo + admin */}
                <Route path="/demo"       element={<DemoIndex />} />
                <Route path="/demo/hu001" element={<HU001 />} />
                <Route path="/demo/hu002" element={<HU002 />} />
                <Route path="/demo/hu003" element={<HU003 />} />
                <Route path="/demo/hu007" element={<HU007 />} />
                <Route path="/demo/hu004" element={<AuthGuard rolRequerido="Ciudadano"><HU004 /></AuthGuard>} />
                <Route path="/demo/hu005" element={<AuthGuard rolRequerido="cualquiera"><HU005 /></AuthGuard>} />
                <Route path="/demo/hu009" element={<AuthGuard rolRequerido="Ciudadano"><HU009 /></AuthGuard>} />
                <Route path="/demo/hu010" element={<AuthGuard rolRequerido="Ciudadano"><HU010 /></AuthGuard>} />
                <Route path="/demo/hu012" element={<AuthGuard rolRequerido="Ciudadano"><HU012 /></AuthGuard>} />
                <Route path="/demo/hu013" element={<AuthGuard rolRequerido="Ciudadano"><HU013 /></AuthGuard>} />
                <Route path="/demo/hu019" element={<AuthGuard rolRequerido="Ciudadano"><HU019 /></AuthGuard>} />
                <Route path="/demo/hu020" element={<AuthGuard rolRequerido="Ciudadano"><HU020 /></AuthGuard>} />
                <Route path="/demo/hu021" element={<AuthGuard rolRequerido="cualquiera"><HU021 /></AuthGuard>} />
                <Route path="/demo/hu022" element={<AuthGuard rolRequerido="Ciudadano"><HU022 /></AuthGuard>} />
                <Route path="/demo/hu023" element={<AuthGuard rolRequerido="Ciudadano"><HU023 /></AuthGuard>} />
                <Route path="/demo/hu006" element={<AuthGuard rolRequerido="Administrador"><HU006 /></AuthGuard>} />
                <Route path="/demo/hu008" element={<AuthGuard rolRequerido="Administrador"><HU008 /></AuthGuard>} />
                <Route path="/demo/hu011" element={<AuthGuard rolRequerido="Administrador"><HU011 /></AuthGuard>} />
                <Route path="/demo/hu014" element={<AuthGuard rolRequerido="Administrador"><HU014 /></AuthGuard>} />
                <Route path="/demo/hu015" element={<AuthGuard rolRequerido="Administrador"><HU015 /></AuthGuard>} />
                <Route path="/demo/hu016" element={<AuthGuard rolRequerido="Administrador"><HU016 /></AuthGuard>} />
                <Route path="/demo/hu017" element={<AuthGuard rolRequerido="Administrador"><HU017 /></AuthGuard>} />
                <Route path="/demo/hu018" element={<AuthGuard rolRequerido="Administrador"><HU018 /></AuthGuard>} />

                {/* Fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </Suspense>
    );
}
