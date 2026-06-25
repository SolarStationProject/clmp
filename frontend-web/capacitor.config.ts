import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId:   'cl.cleanmap.app',
    appName: 'CleanMap',
    webDir:  'dist',
    server: {
        androidScheme: 'https',
    },
    plugins: {
        Geolocation: {
            permissions: ['coarseLocation', 'fineLocation'],
        },
    },
};

export default config;
