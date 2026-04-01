const https = require("https");

module.exports = async (req, res) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) return res.status(500).json({ error: "Token no configurado" });

  const { items, payer, order_id } = req.body;

  const preference = {
    items: items.map(i => ({
      id:          String(i.id),
      title:       i.name,
      description: i.sub || "",
      quantity:    i.qty,
      unit_price:  Number(i.price),
      currency_id: "CLP",
    })),
    payer: {
      name:  payer?.name  || "",
      email: payer?.email || "",
      phone: { number: payer?.phone || "" },
    },
    back_urls: {
      success: "https://luxetoy.vercel.app?pago=exitoso",
      failure: "https://luxetoy.vercel.app?pago=fallido",
      pending: "https://luxetoy.vercel.app?pago=pendiente",
    },
    auto_return:          "approved",
    external_reference:   order_id || "LT-" + Date.now(),
    statement_descriptor: "LUXETOY",
  };

  return new Promise((resolve) => {
    const data = JSON.stringify(preference);
    const options = {
      hostname: "api.mercadopago.com",
      path:     "/checkout/preferences",
      method:   "POST",
      headers:  {
        "Content-Type":   "application/json",
        "Authorization":  `Bearer ${ACCESS_TOKEN}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const request = https.request(options, (response) => {
      let body = "";
      response.on("data", chunk => body += chunk);
      response.on("end", () => {
        try {
          const parsed = JSON.parse(body);
          if (response.statusCode === 201) {
            res.status(200).json({
              id:         parsed.id,
              init_point: parsed.init_point,
            });
          } else {
            res.status(response.statusCode).json({ error: parsed.message || "Error MP" });
          }
        } catch {
          res.status(500).json({ error: "Error procesando respuesta" });
        }
        resolve();
      });
    });

    request.on("error", (e) => { res.status(500).json({ error: e.message }); resolve(); });
    request.write(data);
    request.end();
  });
};
