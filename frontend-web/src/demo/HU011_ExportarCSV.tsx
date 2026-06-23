// HU011 — Exportar reportes a CSV (solo Administrador)
import { useState } from 'react';
import DemoShell, { Card } from './DemoShell';
import { getSession, API_BASE } from './useSession';

export default function HU011_ExportarCSV() {
    const sesion = getSession();
    const [exportando, setExportando] = useState(false);
    const [descargado, setDescargado] = useState(false);
    const [error,      setError]      = useState('');

    const exportar = async () => {
        if (!sesion) return;
        setExportando(true);
        setDescargado(false);
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/reports/export-csv`, {
                headers: { Authorization: `Bearer ${sesion.token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError(data.message || 'Error al exportar.');
                return;
            }
            // Crear enlace de descarga desde el blob
            const blob = await res.blob();
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `cleanmap_reportes_${new Date().toISOString().slice(0, 10)}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            setDescargado(true);
        } catch {
            setError('Error de conexión.');
        } finally {
            setExportando(false);
        }
    };

    return (
        <DemoShell huId="HU011" titulo="Exportar Reportes CSV" integrante="Martín" color="#059669">

            {/* Descripción */}
            <div style={{ backgroundColor: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: '12px', padding: '14px 16px' }}>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#065F46', margin: '0 0 6px' }}>
                    📊 ¿Qué incluye el CSV?
                </p>
                <p style={{ fontSize: '12px', color: '#047857', margin: 0, lineHeight: '1.6' }}>
                    Exporta todos los reportes activos del sistema con las columnas: Código, Título, Categoría, Estado, Prioridad, Dirección, Comuna, Ciudadano y Fecha. El archivo incluye BOM UTF-8 para compatibilidad con Excel en español.
                </p>
            </div>

            {/* Vista previa de columnas */}
            <Card>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#1E293B', margin: '0 0 12px' }}>
                    Columnas del archivo exportado
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {['Código', 'Título', 'Categoría', 'Estado', 'Prioridad', 'Dirección', 'Comuna', 'Ciudadano', 'Fecha'].map(col => (
                        <span key={col} style={{
                            padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                            backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0',
                        }}>{col}</span>
                    ))}
                </div>
            </Card>

            {/* Botón de exportación */}
            <Card>
                <button onClick={exportar} disabled={exportando} style={{
                    width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                    cursor: exportando ? 'not-allowed' : 'pointer',
                    backgroundColor: exportando ? '#6EE7B7' : '#059669',
                    color: '#fff', fontWeight: '700', fontSize: '15px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                }}>
                    <span style={{ fontSize: '20px' }}>{exportando ? '⏳' : '⬇️'}</span>
                    {exportando ? 'Generando CSV…' : 'Descargar todos los reportes'}
                </button>

                {error && (
                    <p style={{ fontSize: '13px', color: '#EF4444', margin: '12px 0 0', textAlign: 'center' }}>{error}</p>
                )}

                {descargado && (
                    <div style={{ marginTop: '14px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '12px', textAlign: 'center' }}>
                        <p style={{ fontSize: '14px', fontWeight: '700', color: '#059669', margin: '0 0 4px' }}>
                            ✅ Archivo descargado
                        </p>
                        <p style={{ fontSize: '12px', color: '#047857', margin: 0 }}>
                            El CSV se guardó en tu carpeta de descargas. Ábrelo con Excel o Google Sheets.
                        </p>
                    </div>
                )}
            </Card>

            {/* Nota técnica */}
            <div style={{ backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '10px', padding: '12px 14px' }}>
                <p style={{ fontSize: '12px', color: '#92400E', margin: 0, lineHeight: '1.6' }}>
                    💡 El backend genera el CSV directamente desde PostgreSQL y lo sirve como descarga con <code>Content-Disposition: attachment</code>. El BOM <code>﻿</code> al inicio garantiza que Excel detecte el encoding UTF-8 correctamente.
                </p>
            </div>
        </DemoShell>
    );
}
