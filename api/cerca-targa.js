export default async function handler(req, res) {
    // Recupera la targa passata dalla pagina web
    const { targa } = req.query;

    if (!targa) {
        return res.status(400).json({ errore: "Targa mancante" });
    }

    // Recupera la chiave segreta salvata nelle variabili d'ambiente di Vercel
    const apiKey = process.env.RAPIDAPI_KEY; 

    try {
        // Interroghiamo l'API reale (es. Visura Targa su RapidAPI)
        const apiResponse = await fetch(`https://rapidapi.com{targa}`, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': '://rapidapi.com'
            }
        });

        if (!apiResponse.ok) {
            return res.status(apiResponse.status).json({ errore: "Veicolo non trovato o errore API" });
        }

        const data = await apiResponse.json();

        // Restituiamo al nostro sito solo i dati che ci servono puliti
        return res.status(200).json({
            marca: data.marca,
            modello: data.modello,
            anno: data.anno_immatricolazione
        });

    } catch (error) {
        return res.status(500).json({ errore: "Errore interno del serverless" });
    }
}