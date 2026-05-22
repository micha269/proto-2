// ============================================================
//  ASISTENTE IA - Cooperativa Tulcán
//  <script type="module" src="./asistente-ia.js"></script> antes de </body>
// ============================================================

const GROQ_API_KEY = import.meta.env?.VITE_GROQ_API_KEY || "";

(function () {
  const GROQ_MODEL = "llama-3.3-70b-versatile";

  const style = document.createElement("style");
  style.textContent = `
    #ct-ai-btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #f39237;
      color: #fff;
      border: none;
      border-radius: 999px;
      padding: 6px 14px 6px 8px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      font-family: inherit;
      box-shadow: 0 2px 8px rgba(243,146,55,0.35);
      transition: background 0.2s;
    }
    #ct-ai-btn:hover { background: #d97b20; }
    #ct-ai-btn .ct-avatar {
      width: 28px; height: 28px;
      background: #fff;
      color: #f39237;
      border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700;
    }

    #ct-ai-overlay {
      display: none;
      position: fixed;
      inset: 0;
      z-index: 9998;
    }
    #ct-ai-overlay.open { display: block; }

    #ct-ai-panel {
      position: fixed;
      top: 60px;
      right: 24px;
      width: 360px;
      max-height: 560px;
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.18);
      display: flex;
      flex-direction: column;
      overflow: hidden;
      z-index: 9999;
      font-family: inherit;
    }

    #ct-ai-header {
      background: #1f6b3d;
      color: #fff;
      padding: 14px 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    #ct-ai-header .ct-title {
      display: flex; align-items: center; gap: 10px;
      font-weight: 700; font-size: 15px;
    }
    #ct-ai-header .ct-dot {
      width: 8px; height: 8px;
      background: #7dff7d;
      border-radius: 50%;
    }
    #ct-ai-close {
      background: none; border: none; color: #fff;
      font-size: 20px; cursor: pointer; line-height: 1;
      padding: 0 4px;
    }

    #ct-ai-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      background: #f7faf7;
    }

    .ct-msg {
      max-width: 85%;
      padding: 10px 14px;
      border-radius: 12px;
      font-size: 13.5px;
      line-height: 1.5;
      white-space: pre-wrap;
    }
    .ct-msg.bot {
      background: #fff;
      border: 1px solid #e0ead0;
      align-self: flex-start;
      color: #222;
    }
    .ct-msg.user {
      background: #f39237;
      color: #fff;
      align-self: flex-end;
    }
    .ct-msg.typing {
      background: #fff;
      border: 1px solid #e0ead0;
      align-self: flex-start;
      color: #999;
      font-style: italic;
    }

    #ct-ai-footer {
      padding: 12px;
      border-top: 1px solid #e8f0e8;
      display: flex;
      gap: 8px;
      background: #fff;
    }
    #ct-ai-input {
      flex: 1;
      border: 1px solid #cde0cd;
      border-radius: 8px;
      padding: 9px 12px;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      resize: none;
      height: 38px;
      transition: border 0.2s;
    }
    #ct-ai-input:focus { border-color: #1f6b3d; }
    #ct-ai-send {
      background: #1f6b3d;
      color: #fff;
      border: none;
      border-radius: 8px;
      padding: 0 14px;
      font-size: 18px;
      cursor: pointer;
      transition: background 0.2s;
    }
    #ct-ai-send:hover { background: #155a32; }
    #ct-ai-send:disabled { background: #aaa; cursor: not-allowed; }

    .ct-sugerencias {
      display: flex; flex-wrap: wrap; gap: 6px; margin-top: 4px;
    }
    .ct-sugerencia {
      background: #eaf4ea;
      border: 1px solid #c5dfc5;
      border-radius: 999px;
      padding: 4px 12px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
      color: #1f6b3d;
    }
    .ct-sugerencia:hover { background: #d2ecd2; }
  `;
  document.head.appendChild(style);

  function inyectarBoton() {
    // El botón lo maneja React en PageHeader.jsx
  }

  function agregarMensaje(texto, tipo) {
    const msgs = document.getElementById("ct-ai-messages");
    const div = document.createElement("div");
    div.className = `ct-msg ${tipo}`;
    div.textContent = texto;
    msgs.appendChild(div);
    msgs.scrollTop = msgs.scrollHeight;
    return div;
  }

  async function obtenerContexto(pregunta) {
    const matchId = pregunta.match(/\b[A-F0-9]{8,}\b|\b\d{4,}\b/i);

    if (matchId) {
      const idSocio = matchId[0];
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/socio/${idSocio}`);
        if (res.ok) {
          const data = await res.json();
          return `Datos del socio consultado en la base de datos:\n${JSON.stringify(data, null, 2)}`;
        }
        if (res.status === 404) {
          const err = await res.json();
          return `Consulta al backend para socio ${idSocio}:\n${JSON.stringify(err, null, 2)}`;
        }
      } catch (e) {
        console.warn("No se pudo consultar el socio al backend:", e);
      }
    }

    const texto = document.body.innerText.substring(0, 2000);
    return `Contexto del dashboard actual:\n${texto}`;
  }

  async function llamarGroq(pregunta, contexto) {
    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        max_tokens: 512,
        messages: [
          {
            role: "system",
            content: `Eres un asistente experto en análisis de riesgo financiero para la Cooperativa de Ahorro y Crédito Tulcán.
Ayudas a los analistas a interpretar datos de socios, scores de riesgo, morosidad y alertas tempranas.
Responde de forma clara, concisa y profesional. Usa los datos del dashboard cuando estén disponibles.
${contexto}`,
          },
          { role: "user", content: pregunta },
        ],
      }),
    });

    if (!res.ok) throw new Error(`Groq error: ${res.status}`);
    const data = await res.json();
    return data.choices[0].message.content;
  }

  async function ctEnviarMensaje() {
    const input = document.getElementById("ct-ai-input");
    const texto = input.value.trim();
    if (!texto) return;

    if (!GROQ_API_KEY) {
      agregarMensaje(
        "⚠️ Falta la API key de Groq. Agregue VITE_GROQ_API_KEY en el archivo .env y reinicie el frontend.",
        "bot"
      );
      return;
    }

    agregarMensaje(texto, "user");
    input.value = "";
    input.disabled = true;
    document.getElementById("ct-ai-send").disabled = true;

    const typing = agregarMensaje("Analizando...", "typing");

    try {
      const contexto = await obtenerContexto(texto);
      const respuesta = await llamarGroq(texto, contexto);
      typing.remove();
      agregarMensaje(respuesta, "bot");
    } catch (err) {
      typing.remove();
      agregarMensaje("⚠️ Error al conectar con la IA. Verifica tu API key de Groq.", "bot");
      console.error(err);
    }

    input.disabled = false;
    document.getElementById("ct-ai-send").disabled = false;
    input.focus();
  }

  function ctEnviarSugerencia(el) {
    document.getElementById("ct-ai-input").value = el.textContent;
    ctEnviarMensaje();
  }

  function abrirChat() {
    document.getElementById("ct-ai-overlay").classList.add("open");
    setTimeout(() => document.getElementById("ct-ai-input").focus(), 100);
  }

  function cerrarChat() {
    document.getElementById("ct-ai-overlay").classList.remove("open");
  }

  const overlay = document.createElement("div");
  overlay.id = "ct-ai-overlay";
  overlay.onclick = (e) => {
    if (e.target === overlay) cerrarChat();
  };

  overlay.innerHTML = `
    <div id="ct-ai-panel">
      <div id="ct-ai-header">
        <div class="ct-title">
          <span class="ct-dot"></span>
          Asistente IA · Cooperativa Tulcán
        </div>
        <button id="ct-ai-close" type="button" onclick="window.ctCerrarChat && window.ctCerrarChat()">✕</button>
      </div>
      <div id="ct-ai-messages">
        <div class="ct-msg bot">
          👋 Hola, soy tu asistente de análisis. Puedo ayudarte a interpretar datos de socios, riesgos y transacciones.
          <div class="ct-sugerencias">
            <span class="ct-sugerencia" onclick="window.ctEnviarSugerencia(this)">¿Cuántos socios en riesgo crítico?</span>
            <span class="ct-sugerencia" onclick="window.ctEnviarSugerencia(this)">Explica la tasa de morosidad</span>
            <span class="ct-sugerencia" onclick="window.ctEnviarSugerencia(this)">¿Qué significa Score 47?</span>
          </div>
        </div>
      </div>
      <div id="ct-ai-footer">
        <input id="ct-ai-input" type="text" placeholder="Escribe tu pregunta..." />
        <button id="ct-ai-send" type="button" onclick="window.ctEnviarMensaje()">➤</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("ct-ai-input").addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      window.ctEnviarMensaje();
    }
  });

  // ── Iniciar ──────────────────────────────────────────────
  window.ctEnviarMensaje = ctEnviarMensaje;
  window.ctEnviarSugerencia = ctEnviarSugerencia;
  window.ctAbrirChat = abrirChat;
  window.ctCerrarChat = cerrarChat;

  inyectarBoton();
})();
