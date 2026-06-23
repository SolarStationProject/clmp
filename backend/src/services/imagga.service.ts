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

    const data    = await res.json() as any;
    const tags    = data.tags || {};
    const objects  = (tags.objects  || []).map((t: string) => t.toLowerCase());
    const mood     = (tags.mood     || []).map((t: string) => t.toLowerCase());
    const extended = (tags.extended || []).map((t: string) => t.toLowerCase());
    const scene    = (tags.scene    || []).map((t: string) => t.toLowerCase());

    const esBasura =
        objects.some(t  => TAGS_BASURA.includes(t))  ||
        mood.some(t     => MOOD_BASURA.includes(t))   ||
        extended.some(t => TAGS_BASURA.includes(t))   ||
        scene.some(t    => SCENE_BASURA.includes(t));

    return {
        esBasura,
        etiquetas: [...new Set([...objects, ...mood, ...extended])],
        caption:   data.caption,
    };
}
