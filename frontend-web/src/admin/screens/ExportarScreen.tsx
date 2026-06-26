import { useState } from 'react';
const API_URL = import.meta.env.VITE_API_URL || '';

const COLUMNAS = ['Código', 'Título', 'Categoría', 'Estado', 'Prioridad', 'Dirección', 'Comuna', 'Ciudadano', 'Fecha'];

export default function ExportarScreen() {
    const [exportando, setExportando] = useState(false);
    const [descargado, setDescargado] = useState(false);
    const [error,      setError]      = useState('');

    const exportar = async () => {
        setExportando(true);
        setDescargado(false);
        setError('');
        try {
            const token = localStorage.getItem('cleanmap_token') || '';
            const res = await fetch(`${API_URL}/api/reports/export-csv`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                setError((data as Record<string, string>).message || 'Error al exportar.');
                return;
            }
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '640px' }}>

            {/* Vista previa columnas */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '20px 24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <p style={{ fontSize: '14px', fontWeight: '700', color: '#1E293B', margin: '0 0 14px' }}>Columnas del archivo exportado</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {COLUMNAS.map(col => (
                        <span key={col} style={{
                            padding: '5px 14px', borderRadius: '20px', fontSize: '13px', fontWeight: '600',
                            backgroundColor: '#F0FDF4', color: '#059669', border: '1px solid #A7F3D0',
                        }}>{col}</span>
                    ))}
                </div>
            </div>

            {/* Botón de descarga */}
            <div style={{ backgroundColor: '#fff', borderRadius: '14px', padding: '24px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
                <button
                    onClick={exportar}
                    disabled={exportando}
                    style={{
                        width: '100%', padding: '16px', borderRadius: '12px', border: 'none',
                        cursor: exportando ? 'not-allowed' : 'pointer',
                        backgroundColor: exportando ? '#6EE7B7' : '#059669',
                        color: '#fff', fontWeight: '700', fontSize: '16px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    }}
                >
                    <span style={{ fontSize: '22px' }}>{exportando ? '⏳' : '⬇️'}</span>
                    {exportando ? 'Generando CSV…' : 'Descargar todos los reportes'}
                </button>

                {error && (
                    <p style={{ fontSize: '13px', color: '#EF4444', margin: '12px 0 0', textAlign: 'center' }}>{error}</p>
                )}

                {descargado && (
                    <div style={{ marginTop: '16px', backgroundColor: '#F0FDF4', border: '1px solid #A7F3D0', borderRadius: '10px', padding: '14px', textAlign: 'center' }}>
                        <p style={{ fontSize: '15px', fontWeight: '700', color: '#059669', margin: '0 0 4px' }}>✅ Archivo descargado</p>
                        <p style={{ fontSize: '13px', color: '#047857', margin: 0 }}>
                            El CSV se guardó en tu carpeta de descargas. Ábrelo con Excel o Google Sheets.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
}
