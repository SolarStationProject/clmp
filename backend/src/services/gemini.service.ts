const API_KEY = process.env.GEMINI_API_KEY || '';

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

    // Formato real: data.steps[] → type:"model_output" → content[0].text
    const modelOutput = (data.steps || []).find((s: any) => s.type === 'model_output');
    const texto = modelOutput?.content?.[0]?.text ?? '';

    const esBasura = texto.trim().toLowerCase().startsWith('yes');

    return { esBasura, etiquetas: [], caption: texto.trim(), _raw: data };
}
