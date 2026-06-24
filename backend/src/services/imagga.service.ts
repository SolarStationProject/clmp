import { Buffer } from 'buffer';

const KEY    = process.env.IMAGGA_API_KEY    || 'acc_e831dd3c14a1c26';
const SECRET = process.env.IMAGGA_API_SECRET || 'e11a1a00e64506574ba26bcede2fced4';
const AUTH   = 'Basic ' + Buffer.from(`${KEY}:${SECRET}`).toString('base64');

const TAGS_BASURA  = ['trash', 'garbage', 'debris', 'waste', 'litter', 'junk', 'rubbish', 'refuse', 'pollution', 'dump'];
const MOOD_BASURA  = ['trashy', 'dirty', 'filthy', 'messy', 'polluted'];
const SCENE_BASURA = ['landfill', 'dump', 'junkyard', 'slum'];

export async function verificarFotoBasura(fotoBase64: string): Promise<{
    esBasura: boolean;
    etiquetas: string[];
    caption?: string;
}> {
    const base64 = fotoBase64.replace(/^data:image\/\w+;base64,/, '');

    const body = new URLSearchParams();
    body.set('image_base64', base64);
    body.set('model', 'pro');
    body.set('include_caption', 'true');

    const res = await fetch('https://api.imagga.com/v3/tags', {
        method:  'POST',
        headers: { Authorization: AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
        body:    body.toString(),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Imagga ${res.status}: ${txt}`);
    }

    const data = await res.json() as any;

    // Imagga v3 /tags devuelve result.tags como array de { confidence, tag: { en } }
    const rawTags: Array<{ confidence: number; tag: { en: string } }> =
        data?.result?.tags || [];

    const etiquetas = rawTags
        .filter(t => t.confidence >= 25)
        .map(t => t.tag.en.toLowerCase());

    const esBasura = etiquetas.some(t =>
        TAGS_BASURA.includes(t) || MOOD_BASURA.includes(t) || SCENE_BASURA.includes(t)
    );

    return {
        esBasura,
        etiquetas,
        caption: data?.result?.caption?.text,
    };
}
