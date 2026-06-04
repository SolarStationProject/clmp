import { Geolocation } from '@capacitor/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';

export const HardwareService = {
    async obtenerUbicacionActual(): Promise<{ latitud: number; longitud: number; precision: number }> {
        const estado = await Geolocation.checkPermissions();
        if (estado.location !== 'granted') {
            const sol = await Geolocation.requestPermissions({ permissions: ['location'] });
            if (sol.location !== 'granted') throw new Error('Se denegaron los permisos de ubicación.');
        }
        const pos = await Geolocation.getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
        return {
            latitud:  pos.coords.latitude,
            longitud: pos.coords.longitude,
            precision: pos.coords.accuracy,
        };
    },

    async tomarFotoEvidencia(): Promise<string> {
        const estado = await Camera.checkPermissions();
        if (estado.camera !== 'granted') {
            const sol = await Camera.requestPermissions({ permissions: ['camera'] });
            if (sol.camera !== 'granted') throw new Error('Se denegaron los permisos de cámara.');
        }
        const foto = await Camera.getPhoto({
            quality:      80,
            allowEditing: false,
            resultType:   CameraResultType.Base64,
            source:       CameraSource.Camera,
            saveToGallery: false,
        });
        if (!foto.base64String) throw new Error('No se obtuvieron datos de la foto.');
        return `data:image/jpeg;base64,${foto.base64String}`;
    },
};
