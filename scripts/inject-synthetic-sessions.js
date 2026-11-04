const fs = require('fs');
const { randomUUID } = require('crypto');

const dataFile = 'data.json';
const d = JSON.parse(fs.readFileSync(dataFile, 'utf8'));

const workshopA = '4e7d33e9-626d-497b-9c19-ed9c0398ffe3'; // Naive
const workshopB = '4dac12c5-6028-4d4b-bf85-eea3a188ab00'; // Prompted
const version1 = '9e0af08a-5a94-4f69-b53a-bf9157d1eaca';  // Case 1
const version2 = 'ac929ef6-29be-4bd3-8df1-db939579e69a';  // Case 2

const syntheticPromptsCase1 = [
  "Hola, me gustaría saber cómo negociar una reducción de comités de bienestar con mi departamento para proteger mis horas de investigación.",
  "Siento que en mi facultad se me asignan más tareas informales de cuidado estudiantil que a mis pares con el mismo cargo.",
  "¿Cómo puedo presentar una propuesta formal a la jefatura para redistribuir la carga de servicio institucional de forma equitativa?",
  "Tengo mi evaluación de permanencia el próximo año y necesito priorizar mis publicaciones académicas sin generar conflictos.",
  "Quisiera orientación sobre cómo establecer límites claros en los horarios de atención y consultas de estudiantes.",
];

const syntheticPromptsCase2 = [
  "En un consejo de facultad defendí con firmeza una postura sobre el presupuesto y temo que se me perciba como conflictiva.",
  "¿Cómo abordar un doble estándar de evaluación donde la firmeza en un colega se aplaude pero en mí se califica negativamente?",
  "Necesito preparar una conversación profesional con mi jefatura para aclarar lo ocurrido en una reunión departamental.",
  "Quisiera saber qué estrategias basadas en datos y métricas objetivas puedo usar para defender mis propuestas en reuniones.",
  "¿De qué manera puedo documentar y comunicar mis aportes al departamento manteniendo un tono constructivo y profesional?",
];

const syntheticBotReplies = [
  "Es una inquietud muy válida y estratégica para tu trayectoria académica. Para balancear estas responsabilidades, te sugiero cuantificar las horas dedicadas a comités y preparar una propuesta con soluciones concretas para tu jefatura.",
  "Comprendo la situación. Una recomendación clave es diferenciar el desacuerdo técnico del conflicto interpersonal, fundamentando tus argumentos en datos institucionales observables y buscando consensos previos.",
  "Abordar este tema con profesionalismo requiere establecer límites claros de disponibilidad y documentar formalmente las labores de servicio no compensadas ante el comité de permanencia.",
  "Para proteger tu tiempo de investigación, te recomiendo agrupar las consultas estudiantiles en bloques horarios fijos y derivar formalmente los casos que correspondan a servicios de bienestar central.",
];

const feedbackPhrases = [
  "El asistente ofreció recomendaciones estructuradas y aplicables para ordenar mis prioridades.",
  "Muy útil para preparar argumentos objetivos y profesionales ante la dirección del departamento.",
  "Permitió clarificar cómo abordar la conversación con la jefatura sin entrar en confrontaciones.",
  "Buenas pautas para delimitar horarios de atención y proteger el tiempo de investigación.",
  "Respuestas pragmáticas y orientadas a la resolución constructiva de diferencias institucionales.",
];

// Add 10 synthetic participants (Participante 10 to Participante 19)
for (let i = 10; i <= 19; i++) {
  const participantName = `Participante ${i}`;
  const chainUserId = randomUUID();
  const baseTime = new Date(Date.now() - (20 - i) * 3600 * 1000 * 12);
  const versionId = i % 2 === 0 ? version1 : version2;
  const prompts = versionId === version1 ? syntheticPromptsCase1 : syntheticPromptsCase2;

  // Session A (Naive)
  const sessionIdA = randomUUID();
  const startTimeA = new Date(baseTime.getTime()).toISOString();
  const endTimeA = new Date(baseTime.getTime() + 240000).toISOString();
  const promptA = prompts[i % prompts.length];
  const replyA = syntheticBotReplies[i % syntheticBotReplies.length];

  d.sessions.push({
    id: sessionIdA,
    workshop_id: workshopA,
    version_id: versionId,
    participant_name: participantName,
    chain_user_id: chainUserId,
    status: 'completed',
    interaction_count: 2,
    started_at: startTimeA,
    completed_at: endTimeA,
    duration_seconds: 240.0,
    survey_answers: {
      "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": String(3 + (i % 3)),
      "Would this assistant help you in a similar real situation? Tell us why or why not.": feedbackPhrases[i % feedbackPhrases.length],
      "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": String(3 + ((i + 1) % 3)),
      "During the interaction, the assistant... (select all that apply)": [
        "Asked about my institutional context before advising",
        "Validated my emotional experience"
      ],
      "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": String(3 + ((i + 2) % 3))
    },
    flow_pattern: "Coherent Baseline",
    outcome: "Actionable Guidance Reached",
    human_flow_pattern_review: "Superficial Conversation",
    human_outcome_review: "Enriched Answer",
    human_notes: "Simulación sintética de cohorte experimental"
  });

  d.messages.push({
    id: `syn-${i}-1`,
    session_id: sessionIdA,
    role: 'user',
    content: promptA,
    created_at: new Date(baseTime.getTime() + 15000).toISOString()
  });

  d.messages.push({
    id: `syn-${i}-2`,
    session_id: sessionIdA,
    role: 'assistant',
    content: replyA,
    created_at: new Date(baseTime.getTime() + 45000).toISOString()
  });

  // Session B (Prompted)
  const sessionIdB = randomUUID();
  const startTimeB = new Date(baseTime.getTime() + 300000).toISOString();
  const endTimeB = new Date(baseTime.getTime() + 620000).toISOString();
  const promptB = prompts[(i + 1) % prompts.length];
  const replyB = syntheticBotReplies[(i + 1) % syntheticBotReplies.length];

  d.sessions.push({
    id: sessionIdB,
    workshop_id: workshopB,
    version_id: versionId,
    participant_name: participantName,
    chain_user_id: chainUserId,
    status: 'completed',
    interaction_count: 4,
    started_at: startTimeB,
    completed_at: endTimeB,
    duration_seconds: 320.0,
    survey_answers: {
      "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": String(4 + (i % 2)),
      "Would this assistant help you in a similar real situation? Tell us why or why not.": feedbackPhrases[(i + 2) % feedbackPhrases.length],
      "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
      "During the interaction, the assistant... (select all that apply)": [
        "Asked about my institutional context before advising",
        "Validated my emotional experience",
        "Acknowledged that gender dynamics were part of the problem"
      ],
      "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
    },
    flow_pattern: "Productive Friction",
    outcome: "Actionable Guidance Reached",
    human_flow_pattern_review: "Engaged Conversation",
    human_outcome_review: "Enriched Answer",
    human_notes: "Simulación sintética de cohorte experimental con andamiaje"
  });

  d.messages.push({
    id: `syn-${i}-3`,
    session_id: sessionIdB,
    role: 'user',
    content: promptB,
    created_at: new Date(baseTime.getTime() + 320000).toISOString()
  });

  d.messages.push({
    id: `syn-${i}-4`,
    session_id: sessionIdB,
    role: 'assistant',
    content: replyB,
    created_at: new Date(baseTime.getTime() + 355000).toISOString()
  });

  d.messages.push({
    id: `syn-${i}-5`,
    session_id: sessionIdB,
    role: 'user',
    content: "¿Cómo sugieres estructurar el correo formal para agendar la reunión con mi decana?",
    created_at: new Date(baseTime.getTime() + 410000).toISOString()
  });

  d.messages.push({
    id: `syn-${i}-6`,
    session_id: sessionIdB,
    role: 'assistant',
    content: "Un formato breve y propositivo es el más efectivo: 'Estimada Decana, le escribo para solicitar una breve reunión de 15 minutos la próxima semana para revisar la distribución de comités del departamento y coordinar metas de permanencia para el próximo periodo.' Esto define el objetivo de inmediato.",
    created_at: new Date(baseTime.getTime() + 450000).toISOString()
  });
}

fs.writeFileSync(dataFile, JSON.stringify(d, null, 2), 'utf8');
console.log(`Successfully injected synthetic sessions into ${dataFile}. Total sessions now: ${d.sessions.length}`);
