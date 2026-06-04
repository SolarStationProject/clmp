import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api';

const cache: Record<string, unknown> = {};

export function useAxios<T>(url: string, params?: Record<string, unknown>) {
    const [data,    setData]    = useState<T | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error,   setError]   = useState<string | null>(null);

    useEffect(() => {
        const key    = `${url}-${JSON.stringify(params)}`;
        const source = axios.CancelToken.source();

        if (cache[key]) { setData(cache[key] as T); setLoading(false); return; }

        setLoading(true);
        api.get<T>(url, { cancelToken: source.token, params })
            .then(res => { cache[key] = res.data; setData(res.data); })
            .catch(err => { if (!axios.isCancel(err)) setError(err.message || 'Error'); })
            .finally(() => setLoading(false));

        return () => source.cancel('Componente desmontado');
    }, [url, JSON.stringify(params)]);

    return { data, loading, error };
}
