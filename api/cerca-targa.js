import { createClient } from '@supabase/supabase-js';

// Inizializza il database Supabase usando le variabili d'ambiente di Vercel
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Usa la Service Role Key per scrivere nel DB in sicurezza dal backend
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    // 1. Recupera la targa inviata dal frontend
    const { targa } = req.query;

    if (!targa) {
        return res.status(400).json({ errore: "Targa mancante" });
    }

    const targaPulita = targa.toUpperCase().trim();
    const apiKey = process.env.RAPIDAPI_KEY; 

    try {
        // 2. Interroga l'API di RapidAPI con l'endpoint corretto e il parametro della targa
        const apiResponse = await fetch(`https://rapidapi.com{targaPulita}&type=A`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'visura-targa-ita.p.rapidapi.com'
            }
        });

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ errore: "Veicolo non trovato o errore API delle targhe" });
        }

        const data = await apiResponse.json();

        // 3. Estrai i dettagli utili dall'API adattandoli ai campi restituiti da visura-targa-ita
        const datiAuto = {
            targa: targaPulita,
            marca: data.brand || data.marca || "Sconosciuta",
            modello: data.model || data.modello || "Sconosciuto",
            anno: data.registrationYear || data.anno_immatricolazione || null,
            creato_il: new Date().toISOString()
        };

        // 4. Salva automaticamente i dati nel database Supabase
        const { error: dbError } = await supabase
            .from('collezione_auto')
            .upsert(datiAuto, { onConflict: 'targa' });

        if (dbError) {
            console.error("Errore salvataggio Database:", dbError);
        }

        // 5. Rispondi al frontend con i dati puliti
        return res.status(200).json(datiAuto);

    } catch (error) {
        console.error("Errore serverless:", error);
        return res.status(500).json({ errore: "Errore interno del server" });
    }
}
