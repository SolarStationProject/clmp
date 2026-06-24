const API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyB7iFkHlWsiHNVd-JxBvC9QdWE6r3rBIJs';

const PROMPT =
    'Answer only "yes" or "no". Does this photo show an illegal dumping site — ' +
    'accumulated garbage, waste, or debris abandoned in a public space such as a street, empty lot, or park?';

export async function verificarFotoBasura(fotoBase64: string): Promise<{
    esBasura: boolean;
    etiquetas: string[];
    caption?: string;
}> {
    const mimeMatch = fotoBase64.match(/^data:(image\/\w+);base64,/);
    const mimeType  = mimeMatch?.[1] || 'image/jpeg';
    const base64    = fotoBase64.replace(/^data:image\/\w+;base64,/, '');

    const res = await fetch('https://generativelanguage.googleapis.com/v1beta/interactions', {
        method:  'POST',
        headers: { 'x-goog-api-key': API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: 'gemini-3.5-flash',
            input: [
                { type: 'text',  text: PROMPT },
                { type: 'image', data: base64, mime_type: mimeType },
            ],
        }),
    });

    if (!res.ok) {
        const txt = await res.text().catch(() => '');
        throw new Error(`Gemini ${res.status}: ${txt}`);
    }

    const data = await res.json() as any;

    // Extraer texto de la respuesta (el debug JSON en HU004 mostrará el formato real)
    let texto = '';
    if (Array.isArray(data.output)) {
        texto = data.output.find((p: any) => p.type === 'text')?.text ?? '';
    } else if (Array.isArray(data.candidates)) {
        texto = data.candidates[0]?.content?.parts?.[0]?.text ?? '';
    }

    const esBasura = texto.trim().toLowerCase().startsWith('yes');

    return { esBasura, etiquetas: [], caption: texto.trim() };
}
