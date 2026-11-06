# Protocolo de prueba de usabilidad con docentes

Estado: **preparado, aún no ejecutado.** Este documento sirve para realizar la prueba con 3 a 5 docentes o investigadores reales por cada momento de uso y comparar el resultado con la evaluación heurística de Nielsen hecha sobre el prototipo anterior.

## Objetivo

Comprobar que alguien que dirige un taller puede, sin ayuda, (1) preparar una campaña, (2) monitorearla en vivo y resolver un problema, y (3) obtener y entender los resultados.

## Participantes

- 3 a 5 personas por momento (idealmente las mismas personas hacen los tres, en una sesión de ~45 min).
- Perfil: docentes o investigadores que dirijan talleres; al menos una persona sin experiencia previa con la plataforma ni con estadística avanzada.
- Consentimiento informado por escrito para grabar pantalla y voz. Datos anonimizados (P1, P2…).

## Preparación

- Instancia local desechable: `DB_PROVIDER=memory DB_MEMORY_PATH=scratch/usabilidad.json npm run dev`, con el asistente simulado (sin claves reales).
- Activar el **modo demo** (Ajustes) para el Momento 3, o cargar sesiones de ejemplo.
- Una persona facilita y otra observa. Quien facilita **no ayuda**; solo repite la consigna. Pedir pensar en voz alta.

## Tareas

### Momento 1 — Preparar
| # | Consigna (sin nombres de botones) | Éxito |
| --- | --- | --- |
| 1.1 | "Vas a hacer un taller donde se comparan tres estilos de asistente. Deja lista la actividad." | Campaña guardada con 3 condiciones |
| 1.2 | "Quieres que los participantes acepten un consentimiento antes de empezar." | Consentimiento activado con enlace |
| 1.3 | "Agrega dos preguntas para el final; una debe ser obligatoria." | Preguntas creadas, una obligatoria |
| 1.4 | "Comprueba cómo la verá un participante." | Abre la vista de participante |
| 1.5 | "Cambia el nombre de la segunda condición." | Edición guardada |

### Momento 2 — En vivo (con 4 sesiones simuladas, una sin mensajes)
| # | Consigna | Éxito |
| --- | --- | --- |
| 2.1 | "El taller está en curso. ¿Cuántas personas hay y cuántas terminaron?" | Respuesta correcta en < 20 s |
| 2.2 | "Alguien llega tarde y no tiene el código. Muéstraselo a la sala." | Proyecta el QR |
| 2.3 | "¿Hay algo que deba preocuparte ahora?" | Identifica la alerta y la causa |
| 2.4 | "No sabes qué hacer ante esa alerta. Busca ayuda." | Usa el asistente o la acción sugerida |

### Momento 3 — Resultados (modo demo)
| # | Consigna | Éxito |
| --- | --- | --- |
| 3.1 | "Descarga los datos para analizarlos en tu programa." | Archivo CSV descargado |
| 3.2 | "¿Hubo diferencias entre las condiciones en la pregunta de utilidad?" | Responde con sus palabras y coincide con la lectura |
| 3.3 | "No entiendes qué es el valor p. Averígualo." | Usa el tooltip o el glosario |
| 3.4 | "Cierra el modo demo." | Sale del modo demo |

## Qué medir

- **Éxito** por tarea (sí / con ayuda / no), **tiempo** y **errores** (clics equivocados, retrocesos).
- **SUS** (System Usability Scale, 10 ítems) al final.
- Pregunta abierta: "¿Qué fue lo más confuso? ¿Qué esperabas encontrar y no estaba?"
- Observar: dudas ante textos, términos que no entienden, elementos que ignoran.

## Criterios de aceptación sugeridos

- ≥ 80 % de las tareas completadas sin ayuda.
- Ninguna tarea del Momento 2 con tiempo > 60 s.
- SUS ≥ 68 (promedio de la escala).
- Todo término que dos o más personas no entiendan debe tener explicación en el lugar donde aparece.

## Hoja de observación (copiar por participante)

```
Participante: P_   Fecha:   Observador:
Momento / tarea | resultado (sí/ayuda/no) | tiempo | errores | citas textuales
SUS (1-5 por ítem): 1__ 2__ 3__ 4__ 5__ 6__ 7__ 8__ 9__ 10__
Lo más confuso:
Lo que faltó:
```

## Informe

Resumir por tarea: tasa de éxito, tiempo mediano, problemas observados con severidad (0–4 de Nielsen), cambios propuestos y cuáles se aplicaron. Comparar con las críticas del documento de revisión del prototipo anterior.

## Kit para ejecutarla

```bash
node scripts/usability-kit.js prepare     # crea la instancia desechable con el escenario del Momento 2
node scripts/usability-kit.js analyze obs.csv sus.csv
```

- `obs.csv`: `participant,task,result,seconds,errors` (`result` = `si`, `ayuda` o `no`; `task` = 1.1, 2.3, …).
- `sus.csv`: `participant,a1,…,a10` con las respuestas 1 a 5.
- La salida entrega tasa de éxito sin ayuda, tiempo mediano por tarea, SUS promedio y si se cumplen los criterios de aceptación.
