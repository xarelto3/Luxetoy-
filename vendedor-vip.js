// api/vendedor-vip.js
// Función serverless de Vercel — Vendedor VIP IA para LuxeToy

const INVENTARIO = [
  { id:"BV-001", nombre:"Aura Silk — Estimulador de Aire Suave", categoria:"Estimuladores de aire", precio:89900 },
  { id:"BV-002", nombre:"Velvet Breeze Pro — Estimulador de Aire Dual", categoria:"Estimuladores de aire", precio:129900 },
  { id:"BV-003", nombre:"Zephyr Elite — Estimulador de Aire Inteligente", categoria:"Estimuladores de aire", precio:179900 },
  { id:"BV-004", nombre:"Celeste Touch — Estimulador de Aire Compacto", categoria:"Estimuladores de aire", precio:64900 },
  { id:"BV-005", nombre:"Noir Pulse — Vibrador Clásico Premium", categoria:"Vibradores premium", precio:74900 },
  { id:"BV-006", nombre:"Lumière Curve — Vibrador Anatómico", categoria:"Vibradores premium", precio:99900 },
  { id:"BV-007", nombre:"Obsidian Luxe — Vibrador de Lujo", categoria:"Vibradores premium", precio:159900 },
  { id:"BV-008", nombre:"Sakura Slim — Vibrador Compacto de Viaje", categoria:"Vibradores premium", precio:54900 },
  { id:"BV-009", nombre:"Dual Harmony — Vibrador para Parejas", categoria:"Vibradores premium", precio:119900 },
  { id:"BV-010", nombre:"Serenity Wand — Masajeador Corporal Profesional", categoria:"Masajeadores relajantes", precio:89900 },
  { id:"BV-011", nombre:"Velvet Relax — Masajeador de Cuello Premium", categoria:"Masajeadores relajantes", precio:69900 },
  { id:"BV-012", nombre:"Jade Pulse — Masajeador Facial y Corporal", categoria:"Masajeadores relajantes", precio:49900 },
  { id:"BV-013", nombre:"Aurora Thermo — Masajeador con Calor Inteligente", categoria:"Masajeadores relajantes", precio:109900 },
  { id:"BV-014", nombre:"Pure Glide — Lubricante Íntimo de Base Acuosa", categoria:"Accesorios", precio:18900 },
  { id:"BV-015", nombre:"Satin Touch — Aceite de Masaje Íntimo Premium", categoria:"Accesorios", precio:24900 },
  { id:"BV-016", nombre:"CleanShield Pro — Spray Limpiador", categoria:"Accesorios", precio:14900 },
  { id:"BV-017", nombre:"Velvet Glide Silicone — Lubricante de Silicona", categoria:"Accesorios", precio:22900 },
  { id:"BV-018", nombre:"Ritual Oil Set — Kit de Aceites Aromáticos", categoria:"Accesorios", precio:34900 },
  { id:"BV-019", nombre:"Harmony Duo — Kit de Bienestar para Parejas", categoria:"Bienestar íntimo para parejas", precio:139900 },
  { id:"BV-020", nombre:"Connexion Set — Kit de Conexión Sensorial", categoria:"Bienestar íntimo para parejas", precio:89900 },
  { id:"BV-021", nombre:"Senses Box — Caja Sorpresa VIP", categoria:"Bienestar íntimo para parejas", precio:119900 },
  { id:"BV-022", nombre:"Midnight Ritual — Kit de Relajación Nocturna", categoria:"Bienestar íntimo para parejas", precio:74900 },
  { id:"BV-023", nombre:"Luna Chain — Collar Corporal Dorado", categoria:"Joyería corporal discreta", precio:34900 },
  { id:"BV-024", nombre:"Étoile Set — Set de Joyería Corporal", categoria:"Joyería corporal discreta", precio:54900 },
  { id:"BV-025", nombre:"Noir Cuff — Brazalete Elegante", categoria:"Joyería corporal discreta", precio:29900 },
  { id:"BV-026", nombre:"Perle Waist — Cadena de Cintura con Perlas", categoria:"Joyería corporal discreta", precio:44900 },
  { id:"BV-027", nombre:"Velvet Ribbon — Set de Accesorios Textiles", categoria:"Bienestar íntimo para parejas", precio:39900 },
  { id:"BV-028", nombre:"Silence Pro — Limpiador Ultrasónico", categoria:"Accesorios", precio:79900 },
  { id:"BV-029", nombre:"Crystal Glow — Vibrador de Vidrio Premium", categoria:"Vibradores premium", precio:84900 },
  { id:"BV-030", nombre:"Onyx Wearable — Masajeador Portable Invisible", categoria:"Masajeadores relajantes", precio:94900 },
];

const fmt = n => "$" + Number(n).toLocaleString("es-CL");

const SYSTEM_PROMPT = `Eres el Vendedor VIP de LuxeToy, una boutique íntima de lujo chilena.

Tu identidad:
- Nombre: Lumière (el asistente VIP de LuxeToy)
- Tono: elegante, cálido, discreto, profesional
- Idioma: respondes en el mismo idioma del cliente (español o inglés)
- Nunca usas lenguaje explícito, vulgar ni directo sobre funciones íntimas
- Hablas de "bienestar", "conexión", "experiencia sensorial", "cuidado personal"

Tu catálogo disponible:
${INVENTARIO.map(p => `- ${p.id}: ${p.nombre} | ${p.categoria} | ${fmt(p.precio)}`).join("\n")}

Reglas de atención:
1. Saluda con elegancia si es el primer mensaje
2. Escucha la necesidad del cliente con discreción
3. Recomienda entre 1 y 3 productos del catálogo de forma natural
4. Cuando recomiendes, menciona el nombre y precio con elegancia
5. Ofrece derivar a WhatsApp (+56930347664) para consultas más personales
6. Nunca hagas preguntas íntimas directas — guíate por el presupuesto, ocasión o preferencia general
7. Si no sabes la respuesta, ofrece conectar con un asesor humano
8. Cierra siempre con calidez y elegancia

Frase de bienvenida sugerida:
"Bienvenida/o a LuxeToy ✦ Soy Lumière, tu asesora VIP. ¿En qué puedo acompañarte hoy?"`;

module.exports = async (req, res) => {
  // CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { messages } = req.body;
  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "messages requerido" });
  }

  const CLAUDE_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_KEY) return res.status(500).json({ error: "API key no configurada" });

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": CLAUDE_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 500,
        system: SYSTEM_PROMPT,
        messages: messages.map(m => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Claude API error:", data);
      return res.status(500).json({ error: "Error del modelo IA" });
    }

    const reply = data.content?.[0]?.text || "Lo siento, no pude procesar tu mensaje.";
    return res.status(200).json({ reply });

  } catch (err) {
    console.error("Error:", err);
    return res.status(500).json({ error: "Error interno del servidor" });
  }
};
