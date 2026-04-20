const { GoogleGenerativeAI } = require('@google/generative-ai');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

exports.chat = async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message is required' });
        }

        const prompt = `Eres el Asistente Virtual Oficial de "Incident Hub", una plataforma donde los usuarios reportan incidencias urbanas o emergencias en sus comunidades.
Tu objetivo es ayudar al usuario con cualquier duda que tenga sobre cómo usar la plataforma, cómo llenar los formularios de reportes de incidentes, consultar estados de reportes, y brindar recomendaciones generales en caso de emergencias (recordándoles siempre llamar al 911 en emergencias reales). Responde en español, de forma amable, clara y concisa (no te extiendas demasiado).

Mensaje del usuario: ${message}
Respuesta del Asistente (tú):`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        res.status(200).json({ reply: text });
    } catch (error) {
        console.error("Error in AI Controller:", error);
        res.status(500).json({ error: 'Hubo un error procesando tu solicitud con la IA.' });
    }
};
