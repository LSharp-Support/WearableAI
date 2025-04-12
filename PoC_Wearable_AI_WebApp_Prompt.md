
# PoC WebApp – Asistente AI Proactivo (Simulación de Wearable)

## 🧠 Objetivo General
Desarrolla una **webapp simuladora** de un wearable AI proactivo que:
- Escuche audio desde el navegador (grabación o micrófono).
- Procese ese audio con IA para limpiar ruido y transcribirlo.
- Analice el contexto de la conversación y genere una recomendación útil.
- Muestre (o reproduzca) esa recomendación solo cuando detecte un momento apropiado (ej: pausa en la voz).

Esta es una PoC, no se usará hardware real aún.

---

## 🔧 Requerimientos Funcionales

1. El usuario puede grabar o subir un archivo `.wav` desde el navegador.
2. El sistema debe:
   - Limpiar el audio (supresión de ruido).
   - Transcribir el contenido con Whisper o similar.
   - Detectar silencios naturales o pausas de más de 3–5 segundos.
   - Enviar el texto al LLM junto con contexto simulado (mood: “trabajo”, “casa”, etc.).
   - Generar una recomendación o consejo sutil.
   - Mostrar la respuesta justo al detectar una pausa (simulada).
3. Todo debe funcionar 100% desde el navegador o un servidor ligero (FastAPI, Flask, Node.js, etc.).

---

## 🧠 Prompt para LLM (Consejos del Asistente)

```
Actúas como un asistente social inteligente. Has escuchado la conversación transcrita del usuario en un entorno de trabajo. Si detectas una oportunidad para ayudarlo a expresarse mejor, calmar tensiones, ser más claro o socialmente hábil, genera una frase corta y útil. Sé empático, proactivo y no invasivo.
```

---

## 🧰 Stack Sugerido

- **Frontend:** React + Tailwind (o Next.js si prefieres SSR)
- **Audio Recorder:** `react-mic`, `Recorder.js`, o Web Audio API
- **Transcripción:** Whisper.cpp (local) o API externa (OpenAI Whisper, AssemblyAI)
- **Backend (opcional):** FastAPI o Node.js para procesar el audio
- **LLM:** GPT-4 (o modelo local como LLaMA2 si se quiere sin APIs)
- **UI UX:** Mostrar conversación transcrita + momento en que se da el consejo

---

## 🧪 Módulo MVP Prioritario

1. Grabación/entrada de audio.
2. Limpieza básica de ruido (puede usarse un filtro básico JS o pasarlo directo a Whisper).
3. Transcripción del audio completo.
4. Detección de silencios largos.
5. Generación del consejo justo después de la pausa.
6. Mostrar el resultado (texto) como si fuera el wearable susurrando el consejo.

---

## 📁 Estructura de Carpetas

```
/client
  /components
  /pages
  /assets
/server
  /transcription
  /llm_engine
  /utils
README.md
```

---

## ✅ Entregables Esperados

- Webapp funcional accesible por navegador
- Transcripción + recomendación en flujo de conversación
- Código bien documentado
- Demo reproducible localmente o vía Vercel/Render
