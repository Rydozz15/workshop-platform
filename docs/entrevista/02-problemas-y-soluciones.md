# 02 - Problemas Técnicos y Soluciones (Casos de Estudio STAR)

Este documento detalla 6 problemas técnicos reales resueltos durante el desarrollo del sistema. Cada caso está estructurado en formato **STAR** (Situación, Tarea, Acción, Resultado) para servir como respuestas directas y fundamentadas en entrevistas técnicas.

---

## Caso 1: Error 400 por Incompatibilidad de Slugs de Modelos al Conmutar Proveedores (OpenRouter vs. Groq)

* **Situación (Situation):** Al permitir alternar entre los proveedores OpenRouter y Groq en tiempo de ejecución, las solicitudes de chat y analítica fallaban con un error HTTP 400 (`llama-3.3-70b-versatile is not a valid model ID` en OpenRouter). Esto ocurría porque los identificadores de modelos de Groq se enviaban inadvertidamente a la API de OpenRouter cuando se modificaban las variables de entorno o la configuración de la campaña.
* **Tarea (Task):** Desacoplar la selección del identificador de modelo según el proveedor activo y crear una fuente centralizada de configuración en la base de datos que actuara como *fallback* confiable.
* **Acción (Action):**
  1. Diseñé e implementé la tabla `settings` en la base de datos (con soporte en Supabase y motor en memoria) y expuse los endpoints `/api/admin/settings`.
  2. Implementé la cascada de resolución de modelo en las rutas de API: `Request Body` > `Settings DB` > `Env Vars` > `Hardcoded Defaults`.
  3. Establecí mapeos condicionales en `lib/openrouter.js` y en los endpoints de analítica, forzando `llama-3.3-70b-versatile` cuando el proveedor es Groq y mapeando modelos de OpenRouter dinámicamente.
* **Resultado (Result):** Se eliminaron al 100% los errores 400 por descalce de modelo, permitiendo cambiar de proveedor y modelo globalmente desde la UI de administración en tiempo real sin necesidad de reiniciar la aplicación o modificar variables de despliegue.

---

## Caso 2: Fuga de Bloques de Razonamiento (`<think>`) en Modelos de IA durante Streaming SSE

* **Situación (Situation):** Al integrar modelos de razonamiento avanzado como Qwen 3 y DeepSeek-R1, estos emitían bloques de "pensamiento previo" dentro de etiquetas `<think>...</think>`. Durante la transmisión por Server-Sent Events (SSE), el participante veía en pantalla texto técnico desestructurado e interno del modelo antes de recibir la respuesta adecuada al escenario.
* **Tarea (Task):** Interceptar el flujo continuo de tokens en el servidor para filtrar y eliminar las etiquetas `<think>` y su contenido en tiempo real sin romper la experiencia de transmisión fluida ni la persistencia en base de datos.
* **Acción (Action):**
  1. Desarrollé la función de expresión regular `stripThinkingTags(text)` capaz de procesar bloques multilínea completos e incompletos (etiquetas de apertura sin cerrar al final del chunk).
  2. Implementé un `TransformStream` en la Serverless Route de Next.js (`/api/session/[sessionId]/chat/route.js`). El stream acumula el texto bruto, calcula el diferencial de texto limpio y emite únicamente los nuevos deltas limpios formateados como chunks SSE.
  3. Agregué una sanitización final al cerrar el stream (*flush*) antes de persistir el mensaje limpio del asistente en la base de datos.
* **Resultado (Result):** Transmisión de chat perfectamente limpia e inmersiva para los usuarios finales, reduciendo el ruido de la interfaz y evitando guardar megabytes de datos innecesarios de razonamiento en la base de datos.

---

## Caso 3: Respuestas Inesperadas en Chino por Modelos DeepSeek/Qwen en Ausencia de System Prompt

* **Situación (Situation):** En campañas creadas sin un prompt de sistema personalizado, los modelos como DeepSeek y Qwen respondían por defecto en chino simplificado ante saludos o mensajes genéricos en español o inglés (ejemplo: la entrada `"hello"` producía `"你好！我是DeepSeek..."`).
* **Tarea (Task):** Garantizar que el modelo responda de manera consistente en el mismo idioma en que escribe el participante sin introducir sesgos de personalidad que alteren los resultados del estudio académico.
* **Acción (Action):**
  1. Identifiqué que la ausencia total del rol `system` en la matriz de mensajes enviada a la API activaba el comportamiento por defecto del entrenamiento base del LLM.
  2. Modifiqué la lógica en `chat/route.js` para inyectar un prompt de sistema fallback estrictamente neutro: `"Always respond in the same language the user writes in."`.
  3. Refactoricé el prompt eliminando frases convencionales como `"You are a helpful assistant"`, identificadas como inductoras de sesgo de complacencia en entornos de investigación.
* **Resultado (Result):** Se corrigió el problema de respuestas descontextualizadas en chino en el 100% de los casos de prueba, manteniendo una neutralidad investigativa óptima.

---

## Caso 4: Pérdida de Metadata y Sugerencias Contextuales en Reanudación de Sesión (*Resume Session*)

* **Situación (Situation):** Cuando un participante refrescaba la pestaña del navegador o volvía más tarde a un taller activo, la aplicación cargaba la sesión existente desde `localStorage` invocando el endpoint `GET /api/session/[sessionId]`. Sin embargo, este endpoint no calculaba ni retornaba el parámetro `previous_first_message`, provocando que el banner de sugerencias (*Suggestion Chip*) desapareciera para sesiones reanudadas.
* **Tarea (Task):** Lograr paridad de estado completa entre el flujo de creación inicial (`POST /api/session/join`) y el flujo de reanudación (`GET /api/session/[sessionId]`).
* **Acción (Action):**
  1. Inspeccioné el manejador GET en `app/api/session/[sessionId]/route.js`.
  2. Implementé la verificación condicional: si la sesión pertenece a un paso de cadena $N > 1$ y no tiene mensajes registrados aún (`messages.length === 0`), se ejecuta una consulta para buscar la última sesión completada del `chain_user_id` y extraer su primer mensaje de usuario.
  3. Actualicé el estado del cliente en `app/session/[code]/page.js` para procesar la propiedad `previous_first_message` dentro del flujo de inicialización por reanudación.
* **Resultado (Result):** Se garantizó la presencia persistente del chip de sugerencias metodológicas sin importar si la sesión era recién creada o reanudada tras un refresco de pantalla.

---

## Caso 5: Imposibilidad de Comparación Longitudinal de Encuestas por Divergencia de UUIDs de Pregunta

* **Situación (Situation):** Al construir talleres encadenados de múltiples pasos, cada paso generaba identificadores aleatorios (UUID) independientes para sus preguntas de encuesta post-sesión, imposibilitando agrupar y comparar cuantitativa o cualitativamente las respuestas a la misma pregunta formulada en diferentes etapas.
* **Tarea (Task):** Permitir la trazabilidad longitudinal de preguntas de encuestas a lo largo de todos los pasos de una campaña encadenada.
* **Acción (Action):**
  1. Diseñé e implementé la función de interfaz "Copy from Step 1" en el constructor de campañas (`app/admin/campaigns/page.js`), duplicando las preguntas del paso base y manteniendo idénticos sus atributos `id`.
  2. Creé el endpoint `/api/admin/analytics/evolution` que agrupa las respuestas de los participantes por coincidencia de `question_id` a través de los pasos del taller.
  3. Formateé un prompt especializado para LLM que toma las respuestas agrupadas cronológicamente e identifica giros de paradigma y tendencias cualitativas.
* **Resultado (Result):** Posibilidad de generar tableros de analítica con gráficos de línea de tendencia temporal (Chart.js) y reportes cualitativos de evolución temporal generados automáticamente por IA.

---

## Caso 6: Fallo en el Pipeline de Despliegue Continuo (CI/CD) de Vercel por Configuración Schema Error

* **Situación (Situation):** Tras cambios en el repositorio, la tubería de despliegue automático en Vercel comenzó a rechazar las compilaciones con el error: `The vercel.json schema validation failed with message: should NOT have additional property protectionBypass`.
* **Tarea (Task):** Restaurar la integración continua eliminando el bloqueo en el build de producción.
* **Acción (Action):**
  1. Evalué el archivo `vercel.json` y descubrí que contenía propiedades deprecadas / no soportadas en el schema actual de Vercel CLI.
  2. Eliminé el archivo `vercel.json` de la raíz del proyecto, confiando en las convenciones de configuración por defecto de Next.js App Router, las cuales Vercel detecta automáticamente.
  3. Realicé el commit y push correspondiente a `main`.
* **Resultado (Result):** Despliegue exitoso e inmediato en la infraestructura de Vercel en menos de 45 segundos, manteniendo la estabilidad de los despliegues subsecuentes.
