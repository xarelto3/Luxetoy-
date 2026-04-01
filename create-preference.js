const https = require("https");

exports.handler = async (event) => {
  // Solo aceptar POST
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  const ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;
  if (!ACCESS_TOKEN) {
    return { statusCode: 500, body: JSON.stringify({ error: "Token no configurado" }) };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: "Body inválido" }) };
  }

  const { items, payer, order_id } = body;

  // Construir preferencia de pago MP
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
      success: "https://www.luxetoy.cl?pago=exitoso",
      failure: "https://www.luxetoy.cl?pago=fallido",
      pending: "https://www.luxetoy.cl?pago=pendiente",
    },
    auto_return:          "approved",
    external_reference:   order_id || "LT-" + Date.now(),
    statement_descriptor: "LUXETOY",
    metadata: { source: "luxetoy_app" },
  };

  // Llamar a la API de MercadoPago
  return new Promise((resolve) => {
    const data = JSON.stringify(preference);
    const options = {
      hostname: "api.mercadopago.com",
      path:     "/checkout/preferences",
      method:   "POST",
      headers:  {
        "Content-Type":  "application/json",
        "Authorization": `Bearer ${ACCESS_TOKEN}`,
        "Content-Length": Buffer.byteLength(data),
      },
    };

    const req = https.request(options, (res) => {
      let responseData = "";
      res.on("data", chunk => responseData += chunk);
      res.on("end", () => {
        try {
          const parsed = JSON.parse(responseData);
          if (res.statusCode === 201) {
            resolve({
              statusCode: 200,
              headers: { "Access-Control-Allow-Origin": "*" },
              body: JSON.stringify({
                id:          parsed.id,
                init_point:  parsed.init_point,   // producción
                sandbox_url: parsed.sandbox_init_point, // pruebas
              }),
            });
          } else {
            resolve({
              statusCode: res.statusCode,
              headers: { "Access-Control-Allow-Origin": "*" },
              body: JSON.stringify({ error: parsed.message || "Error MP" }),
            });
          }
        } catch {
          resolve({ statusCode: 500, body: JSON.stringify({ error: "Parse error" }) });
        }
      });
    });

    req.on("error", (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });

    req.write(data);
    req.end();
  });
};
