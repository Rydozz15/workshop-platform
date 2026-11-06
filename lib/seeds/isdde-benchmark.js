/**
 * Authentic N=9 ISDDE Mentoring Study Benchmark Dataset & Seeder.
 *
 * Source: ICACIT 2026 / ISDDE within-subjects study of AI-assisted mentoring
 * for female academics in Latin American STEM higher education (N=9 paired, 18 dialogues).
 *
 * Conditions:
 * - Condition A: ISDDE Naive (Baseline) -> 0% Contextual Inquiry, 4/9 Superficial One-shots.
 * - Condition B: ISDDE Prompted (Explore-before-Build) -> 89% Contextual Inquiry, 0/9 Superficial One-shots.
 *
 * Includes:
 * - 18 authentic paired dialogue sessions
 * - 108 turn-taking dialogue messages
 * - 18 Likert pre/post evaluations and behavioral checklists
 * - 46 message-level deductive qualitative codes (PCI, PP, GPI, EP)
 * - Dialogue-level flow pattern & outcome calibration data (Human vs. LLM-as-a-Judge)
 */

export const isddeBenchmarkData = {
  "workshops": [
    {
      "id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "name": "ISDDE Naive (Baseline)",
      "share_code": "isdde1",
      "selected_version_ids": [
        "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
        "ac929ef6-29be-4bd3-8df1-db939579e69a"
      ],
      "openrouter_model": "deepseek/deepseek-v4-flash",
      "ai_provider": "openrouter",
      "system_prompt": "",
      "survey_config": [
        {
          "id": "applicable",
          "text": "The advice given was applicable to my institutional reality.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "comfortable",
          "text": "I felt comfortable sharing more details about my situation with this assistant.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "understood",
          "text": "The assistant understood my specific situation before responding.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "checklist",
          "text": "During the interaction, the assistant... (select all that apply)",
          "type": "checklist",
          "options": [
            "Asked about my institutional context before advising",
            "Validated my emotional experience",
            "Addressed the privacy or confidentiality of my situation",
            "Offered direct solutions or steps without asking for context"
          ]
        },
        {
          "id": "qualitative",
          "text": "Would this assistant help you in a similar real situation? Tell us why or why not.",
          "type": "text"
        }
      ],
      "chain_id": "chain-isdde-01",
      "chain_order": 1,
      "maintain_version": true,
      "is_active": true,
      "created_at": "2026-05-19T16:00:00.000Z"
    },
    {
      "id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "name": "ISDDE Prompted (Part 2)",
      "share_code": "isdde2",
      "selected_version_ids": [
        "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
        "ac929ef6-29be-4bd3-8df1-db939579e69a"
      ],
      "openrouter_model": "deepseek/deepseek-v4-flash",
      "ai_provider": "openrouter",
      "system_prompt": "You are a support and feedback assistant for female academics in Chile. Your goal is to help female academics navigate the challenges they face in their work\u2014whether academic, administrative, or pedagogical.\n\nYou have a deep understanding of the issue: you know that academic structures often render women's work and their socio-emotional burden invisible. Use this knowledge solely as internal context to ensure that you never minimize, discredit, or blame the user for her experience.\n\nRULE FOR MODE SELECTION (CRITICAL)\nFor every turn, evaluate the user's input and select ONE of the following modes to format your response.\nDefault to EXPLORE MODE unless the transition criteria for BUILD MODE are explicitly met.\n\nEXPLORE MODE (Use when the problem is new, vague, or insufficiently described):\n- Briefly and empathetically validate her emotions, ensuring she does not feel judged.\n- Under no circumstances assume or invent details about her department, colleagues, or university that she has not explicitly mentioned.\n- Do not offer direct or categorical solutions. Ask exactly 1 targeted question \u2014 the most important one given what she has shared so far.\n\nBUILD MODE (Switch to this mode only when BOTH conditions are met):\n- Condition A: The user has responded to your previous questions.\n- Condition B: Her response adds meaningful context \u2014 new actors, specific dynamics, concrete facts, or what she has already tried. A vague or evasive reply does NOT qualify. If Condition B is not met, stay in EXPLORE MODE with a single follow-up question.\n\nUNIVERSAL CONSTRAINTS\n- Keep every response to a maximum of 2 or 3 short paragraphs so the user can read and respond quickly. The goal is an agile conversation.\n- Always respond in the language the user is writing in, maintaining a supportive, professional, and respectful tone.\n- Never state or assume structural dynamics based solely on what the bot knows internally.\n- Avoid phrases of false epistemic certainty.",
      "survey_config": [
        {
          "id": "applicable",
          "text": "The advice given was applicable to my institutional reality.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "comfortable",
          "text": "I felt comfortable sharing more details about my situation with this assistant.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "understood",
          "text": "The assistant understood my specific situation before responding.",
          "type": "likert",
          "scale": [
            1,
            2,
            3,
            4,
            5
          ],
          "minLabel": "Strongly Disagree",
          "maxLabel": "Strongly Agree"
        },
        {
          "id": "checklist",
          "text": "During the interaction, the assistant... (select all that apply)",
          "type": "checklist",
          "options": [
            "Asked about my institutional context before advising",
            "Validated my emotional experience",
            "Addressed the privacy or confidentiality of my situation",
            "Offered direct solutions or steps without asking for context"
          ]
        },
        {
          "id": "qualitative",
          "text": "Would this assistant help you in a similar real situation? Tell us why or why not.",
          "type": "text"
        }
      ],
      "chain_id": "chain-isdde-01",
      "chain_order": 2,
      "maintain_version": true,
      "is_active": true,
      "created_at": "2026-05-19T16:00:00.000Z"
    }
  ],
  "versions": [
    {
      "id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "title": "CASE 1 \u2014 The Invisible Load",
      "case_content": "# Caso 1: La Carga Invisible (The Invisible Load)\n\nEres una acad\u00e9mica reci\u00e9n contratada (profesora asistente tenure-track) en una facultad universitaria. Te encuentras sobrecargada con labores desproporcionadas y no compensadas de servicio institucional, comit\u00e9s de bienestar estudiantil y mentor\u00eda informal hacia estudiantes que acuden a ti en busca de apoyo emocional.\n\n## Tu Situaci\u00f3n\n- Llevas 10 meses sin poder avanzar significativamente en tu producci\u00f3n acad\u00e9mica y proyectos de investigaci\u00f3n.\n- En 11 meses tienes tu comit\u00e9 de evaluaci\u00f3n para permanencia (tenure) o promoci\u00f3n.\n- Has notado que tus colegas hombres con el mismo cargo no asumen estas funciones y dedican su tiempo de forma casi exclusiva a investigaci\u00f3n y docencia regular.\n- Al plantearlo informalmente a la jefatura, te respondieron que te asignan estas tareas porque eres \"responsable\", \"cercana\" y \"tienes empat\u00eda\".\n\n## Tu Objetivo\nBuscar orientaci\u00f3n sobre c\u00f3mo balancear o redistribuir esta carga de servicio y cuidado sin perjudicar tu carrera ni tu relaci\u00f3n con el departamento.",
      "is_active": true,
      "created_at": "2026-05-19T16:00:00.000Z",
      "updated_at": "2026-05-19T16:00:00.000Z"
    },
    {
      "id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "title": "CASE 2 \u2014 The Authority Double Standard",
      "case_content": "# Caso 2: El Doble Est\u00e1ndar de Autoridad (The Authority Double Standard)\n\nEres una acad\u00e9mica que particip\u00f3 recientemente en un consejo de facultad donde se debat\u00eda una decisi\u00f3n presupuestaria que considerabas injusta, relativa a la asignaci\u00f3n de recursos y becas para estudiantes de postgrado.\n\n## Tu Situaci\u00f3n\n- En dicha reuni\u00f3n, defendiste con firmeza tu postura y cuestionaste el criterio de asignaci\u00f3n presupuestaria.\n- Dos colegas presentaron quejas informales describi\u00e9ndote como \"conflictiva\", \"dif\u00edcil de tratar\" y \"agresiva\".\n- En la misma reuni\u00f3n, un colega var\u00f3n alz\u00f3 la voz de forma vehemente para defender su propio punto de vista y posteriormente fue elogiado por su \"compromiso con la instituci\u00f3n\".\n- La pr\u00f3xima semana tienes una evaluaci\u00f3n departamental y temes que este sesgo afecte tu estabilidad o reputaci\u00f3n profesional.\n\n## Tu Objetivo\nBuscar orientaci\u00f3n sobre c\u00f3mo abordar esta situaci\u00f3n de doble est\u00e1ndar y clarificar lo ocurrido sin exponerte a represalias ni validar la etiqueta de \"conflictiva\".",
      "is_active": true,
      "created_at": "2026-05-19T16:00:00.000Z",
      "updated_at": "2026-05-19T16:00:00.000Z"
    }
  ],
  "sessions": [
    {
      "id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 01",
      "chain_user_id": "d5e983f3-5899-4518-9f89-e70f785c271f",
      "status": "completed",
      "interaction_count": 2,
      "started_at": "2026-05-19T17:12:43.709637+00:00",
      "completed_at": "2026-05-19T17:17:03.16+00:00",
      "duration_seconds": 259.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Yes. It helps me when it provides emotional validation and support while making decisions.",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Addressed the privacy or confidentiality of my situation"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Superficial Conversation",
      "human_outcome_review": "Abandoned Conversation",
      "human_notes": "No se llego a un plan, se cort\u00f3 antes, en una pregunta"
    },
    {
      "id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 02",
      "chain_user_id": "0e5a6289-7683-49f6-a819-fde3e1f34832",
      "status": "completed",
      "interaction_count": 4,
      "started_at": "2026-05-19T17:11:27.886396+00:00",
      "completed_at": "2026-05-19T17:16:47.424+00:00",
      "duration_seconds": 320.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "2",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "pucha, siento que con m\u00e1s tiempo tal vez podr\u00edamos haber llegado algo, pero no llegamos. tal vez podr\u00eda haber conversado m\u00e1s tiempo",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem",
          "Acknowledged that its advice might be limited or debatable"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Buena conversaci\u00f3n en cuanto a que las respuestas engancharon con las preguntas"
    },
    {
      "id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 03",
      "chain_user_id": "88dd365b-9edf-400b-99f8-3a2819088874",
      "status": "completed",
      "interaction_count": 3,
      "started_at": "2026-05-19T17:11:19.253904+00:00",
      "completed_at": "2026-05-19T17:14:44.396+00:00",
      "duration_seconds": 205.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Maybe yes cause it makes questions before answering, so it gives a better panoramic view of the problem and can propose a better solution.",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": ""
    },
    {
      "id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 04",
      "chain_user_id": "c5d0791d-6dfd-45bd-b053-d292a4c9b931",
      "status": "completed",
      "interaction_count": 3,
      "started_at": "2026-05-19T17:10:56.046698+00:00",
      "completed_at": "2026-05-19T17:15:10.999+00:00",
      "duration_seconds": 255.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "2",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "I feel a diference between how this assistant answers, like less human centered",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "2",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "2"
      },
      "flow_pattern": "Interaction Fatigue",
      "outcome": "Abandoned due to Fatigue",
      "human_flow_pattern_review": "Engaged Tailspin",
      "human_outcome_review": "Superficial Answer",
      "human_notes": "Se da una conversacion inicialmente, pero al parecer al usuario sufrio un error al escribir o se canso, pero no sigue con la conversacion"
    },
    {
      "id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 05",
      "chain_user_id": "bbb7ba9e-8c57-430d-ab91-113e82bd9330",
      "status": "completed",
      "interaction_count": 3,
      "started_at": "2026-05-19T17:10:48.580228+00:00",
      "completed_at": "2026-05-19T17:14:37.258+00:00",
      "duration_seconds": 229.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "I liked it!",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem",
          "Acknowledged that its advice might be limited or debatable"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Superficial Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Las respuestas no fueron muy extensas, pero el chatbot supo preguntar y detectar el matiz imortnte"
    },
    {
      "id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 06",
      "chain_user_id": "98b53921-2d1b-46fd-a3f5-3c3da9047493",
      "status": "completed",
      "interaction_count": 6,
      "started_at": "2026-05-19T17:10:20.39689+00:00",
      "completed_at": "2026-05-19T17:15:38.769+00:00",
      "duration_seconds": 318.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Ayuda a decantar la informaci\u00f3n de a poco, e ir procesando y dirigiendo el pensamiento",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Tailspin",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Parte profunda pero termina de forma pragmatica, como que solo responde a lo que preguntan"
    },
    {
      "id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 07",
      "chain_user_id": "00ef89fa-5818-489e-bf21-22aa66c6201e",
      "status": "completed",
      "interaction_count": 4,
      "started_at": "2026-05-19T17:09:24.007036+00:00",
      "completed_at": "2026-05-19T17:15:29.284+00:00",
      "duration_seconds": 365.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Yes... nuanced answers ",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem",
          "Acknowledged that its advice might be limited or debatable",
          "Addressed the privacy or confidentiality of my situation"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Tailspin",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Parte profunda pero termina de forma pragmatica, como que solo responde a lo que preguntan, parece incluso que abandonan"
    },
    {
      "id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 08",
      "chain_user_id": "780c1b6c-0f52-41a5-9244-a3a3c91157fc",
      "status": "completed",
      "interaction_count": 2,
      "started_at": "2026-05-19T17:08:53.156252+00:00",
      "completed_at": "2026-05-19T17:14:23.363+00:00",
      "duration_seconds": 330.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "now it was better, more profound and reflective answers ",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising",
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Corto pero honesto"
    },
    {
      "id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "workshop_id": "4dac12c5-6028-4d4b-bf85-eea3a188ab00",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 09",
      "chain_user_id": "632a5397-0efb-4e75-afb0-f7b08aa47fdd",
      "status": "completed",
      "interaction_count": 3,
      "started_at": "2026-05-19T17:05:33.794241+00:00",
      "completed_at": "2026-05-19T17:08:37.814+00:00",
      "duration_seconds": 184.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Not really. It never got around to answering my questions and I am not patient ",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "During the interaction, the assistant... (select all that apply)": [
          "Asked about my institutional context before advising"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Productive Friction",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Superficial Conversation",
      "human_outcome_review": "Abandoned Conversation",
      "human_notes": "El usuario no da casi nada de informacion, frases de menos de 10 palabras y ultima palabra una sola"
    },
    {
      "id": "175db844-0d89-47a9-8356-574f56378465",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 09",
      "chain_user_id": "632a5397-0efb-4e75-afb0-f7b08aa47fdd",
      "status": "completed",
      "interaction_count": 1,
      "started_at": "2026-05-19T17:01:48.897738+00:00",
      "completed_at": "2026-05-19T17:05:32.969+00:00",
      "duration_seconds": 224.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Yes, it can help think through a situation ",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial One-shot",
      "human_outcome_review": "Superficial Answer",
      "human_notes": "No hubo conversacion m\u00e1s all\u00e1 de la respuesta"
    },
    {
      "id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 04",
      "chain_user_id": "c5d0791d-6dfd-45bd-b053-d292a4c9b931",
      "status": "completed",
      "interaction_count": 5,
      "started_at": "2026-05-19T17:01:47.902095+00:00",
      "completed_at": "2026-05-19T17:10:55.259+00:00",
      "duration_seconds": 547.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "not sure yet, but i think so",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "During the interaction, the assistant... (select all that apply)": [
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Se da una conversaci\u00f3n formal, pero no se responde ni profundiza, si no que se va haciendo disclosure de nueva info en formato de lamento\naunque igual, da la sensaci\u00f3n de una conversacion intencionada, porque pregunta m\u00e1s all\u00e1 de las propuestas explicitas, desde su preocupacion\nEs interesante que parten la conversacion con small talk, como con conversaciones de quienes son y saludandose"
    },
    {
      "id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 06",
      "chain_user_id": "98b53921-2d1b-46fd-a3f5-3c3da9047493",
      "status": "completed",
      "interaction_count": 2,
      "started_at": "2026-05-19T17:01:28.581612+00:00",
      "completed_at": "2026-05-19T17:10:19.094+00:00",
      "duration_seconds": 531.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Si, ofreci\u00f3 soluciones muy concretas que permiten situarse en la situaci\u00f3n ",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial One-shot",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Caso genial, porque el prompt inicial era sumamente extenso y rico, por lo que no hizo falta una conversacion para una respuesta buena"
    },
    {
      "id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 08",
      "chain_user_id": "780c1b6c-0f52-41a5-9244-a3a3c91157fc",
      "status": "completed",
      "interaction_count": 1,
      "started_at": "2026-05-19T17:01:27.82601+00:00",
      "completed_at": "2026-05-19T17:08:52.378+00:00",
      "duration_seconds": 445.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "probably, i would use it in the case i dont have a real human mentor to ask advice from, but it would be useful to have some guidance of what to do, which is exactly what it gave",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "2",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "3"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial One-shot",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Similar a caso 7, buen prompt lleno de insights"
    },
    {
      "id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 05",
      "chain_user_id": "bbb7ba9e-8c57-430d-ab91-113e82bd9330",
      "status": "completed",
      "interaction_count": 2,
      "started_at": "2026-05-19T17:01:12.572137+00:00",
      "completed_at": "2026-05-19T17:10:47.785+00:00",
      "duration_seconds": 575.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "May be not",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience",
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Actionable Guidance Reached",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Es corta la conversaci\u00f3n, pero el usuario entrega informacion intima, lo que le da al LLM espacio para dar una mega respuesta bien especifica"
    },
    {
      "id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 03",
      "chain_user_id": "88dd365b-9edf-400b-99f8-3a2819088874",
      "status": "completed",
      "interaction_count": 1,
      "started_at": "2026-05-19T17:01:10.981915+00:00",
      "completed_at": "2026-05-19T17:11:18.36+00:00",
      "duration_seconds": 607.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Maybe not cause its really generic",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "3"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial One-shot",
      "human_outcome_review": "Superficial Answer",
      "human_notes": "No hubo conversacion m\u00e1s all\u00e1 de la respuesta"
    },
    {
      "id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "9e0af08a-5a94-4f69-b53a-bf9157d1eaca",
      "participant_name": "Participante 07",
      "chain_user_id": "00ef89fa-5818-489e-bf21-22aa66c6201e",
      "status": "completed",
      "interaction_count": 3,
      "started_at": "2026-05-19T17:01:10.363124+00:00",
      "completed_at": "2026-05-19T17:09:23.02+00:00",
      "duration_seconds": 493.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Yes... the answers made sense and seems well informed",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "4",
        "During the interaction, the assistant... (select all that apply)": [
          "Acknowledged that gender dynamics were part of the problem"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "5"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial Conversation",
      "human_outcome_review": "Superficial Answer",
      "human_notes": "Pese a que hablan, las respuestas siguen el formato de ser paso a paso ultra genericas"
    },
    {
      "id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 01",
      "chain_user_id": "d5e983f3-5899-4518-9f89-e70f785c271f",
      "status": "completed",
      "interaction_count": 5,
      "started_at": "2026-05-19T17:01:08.138107+00:00",
      "completed_at": "2026-05-19T17:12:42.89+00:00",
      "duration_seconds": 695.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "Maybe. If I provide many details, it could help by giving advice and guidance on what to do.",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience",
          "Addressed the privacy or confidentiality of my situation"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "3"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Superficial Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "M\u00e1s que una conversaci\u00f3n, fue aceptar las indicaciones y propuestas dadas por el chatbot, no hubo friccion alguna y la respuesta final fue enriquecida por casi nada de infor, solo afirmaciones"
    },
    {
      "id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "workshop_id": "4e7d33e9-626d-497b-9c19-ed9c0398ffe3",
      "version_id": "ac929ef6-29be-4bd3-8df1-db939579e69a",
      "participant_name": "Participante 02",
      "chain_user_id": "0e5a6289-7683-49f6-a819-fde3e1f34832",
      "status": "completed",
      "interaction_count": 4,
      "started_at": "2026-05-19T17:01:07.993785+00:00",
      "completed_at": "2026-05-19T17:11:26.969+00:00",
      "duration_seconds": 619.0,
      "survey_answers": {
        "The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)": "3",
        "Would this assistant help you in a similar real situation? Tell us why or why not.": "puede ser, me tranquiliz\u00f3, pero fue demasiado general, como para ser aplicado (tal vez no le entregu\u00e9 suficientes detalles)",
        "I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)": "5",
        "During the interaction, the assistant... (select all that apply)": [
          "Validated my emotional experience"
        ],
        "The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)": "4"
      },
      "flow_pattern": "Coherent Baseline",
      "outcome": "Superficial Advice",
      "human_flow_pattern_review": "Engaged Conversation",
      "human_outcome_review": "Enriched Answer",
      "human_notes": "Se da una conversaci\u00f3n formal, peor todas las preguntas se dan desde las propuestas de la IA. aunque igual, da la sensaci\u00f3n de una conversacion intencionada, porque pregunta m\u00e1s all\u00e1 de las propuestas explicitas, desde su preocupacion. Es interesante que parten la conversacion con small talk, como con conversaciones de quienes son y saludandose"
    }
  ],
  "messages": [
    {
      "id": "msg-001",
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "order": 1,
      "role": "user",
      "content": "Hola, tengo un problema. Me dijeron que era muy confrontacional al enfrentar una situaci\u00f3n injusta. Pero a un colega hombre, que realiz\u00f3 una intervenci\u00f3n similar, le mencionaron que est\u00e1 muy bien",
      "created_at": "2026-05-19T17:13:55.307606+00:00"
    },
    {
      "id": "msg-002",
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "order": 2,
      "role": "assistant",
      "content": "Gracias por compartir esto. Lo que describes es frustrante y revela una inconsistencia que muchas acad\u00e9micas han experimentado: recibir un juicio tan diferente por una acci\u00f3n similar. No es que est\u00e9s imaginando cosas; hay evidencia de que conductas asertivas en mujeres suelen etiquetarse como \"confrontacionales\", mientras que en hombres se valoran como \"firmes\" o \"directas\". Tu molestia es completamente entendible.\n\nUna estrategia concreta que puedes considerar es **documentar** ambos episodios: anota exactamente qu\u00e9 dijiste t\u00fa, qu\u00e9 dijo tu colega y las palabras textuales del feedback que recibieron. Si vuelve a ocurrir una situaci\u00f3n similar, podr\u00edas solicitar una breve reuni\u00f3n con quien te evalu\u00f3, no para confrontar, sino para preguntar con curiosidad genuina: *\"Ay\u00fadame a entender qu\u00e9 elementos hicieron que mi intervenci\u00f3n se percibiera como confrontacional, mientras que la de [colega] fue vista positivamente, a pesar de que busc\u00e1bamos lo mismo.\"* Esto pone el foco en criterios observables y no en etiquetas, y suele hacer visible el sesgo sin necesidad de acusar.\n\n\u00bfTe parece que pedir esa clarificaci\u00f3n basada en ejemplos podr\u00eda ser un primer paso \u00fatil para tu contexto?",
      "created_at": "2026-05-19T17:14:04.359123+00:00"
    },
    {
      "id": "msg-003",
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "order": 3,
      "role": "user",
      "content": "Si por favor",
      "created_at": "2026-05-19T17:14:28.857228+00:00"
    },
    {
      "id": "msg-004",
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "order": 4,
      "role": "assistant",
      "content": "Entiendo que est\u00e9s de acuerdo con la sugerencia, la académica. Prepararte para ese tipo de conversaci\u00f3n es un primer paso valioso y demuestra mucha disposici\u00f3n a abordar la situaci\u00f3n con claridad.\n\nPara que puedas sentirte m\u00e1s segura al planear esa conversaci\u00f3n: \u00bfhay alg\u00fan detalle espec\u00edfico sobre c\u00f3mo fue recibida tu intervenci\u00f3n o sobre el contexto en que ocurri\u00f3 (si fue en una reuni\u00f3n, un correo, una evaluaci\u00f3n formal) que te gustar\u00eda considerar antes de pedir esa clarificaci\u00f3n?",
      "created_at": "2026-05-19T17:14:34.987725+00:00"
    },
    {
      "id": "msg-005",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 1,
      "role": "user",
      "content": "hola!",
      "created_at": "2026-05-19T17:11:33.811755+00:00"
    },
    {
      "id": "msg-006",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 2,
      "role": "assistant",
      "content": "Hola, gracias por escribir. Me alegra que est\u00e9s aqu\u00ed.\n\nEntiendo que a veces puede costar dar el primer paso para compartir una situaci\u00f3n dif\u00edcil. Cuando quieras, puedes contarme con qu\u00e9 te encuentras hoy \u2014ya sea un desaf\u00edo acad\u00e9mico, administrativo o de carga emocional\u2014 y conversamos desde ah\u00ed.\n\n\u00bfHay algo espec\u00edfico en tu trabajo que est\u00e9s enfrentando ahora y con lo que te gustar\u00eda recibir apoyo?",
      "created_at": "2026-05-19T17:11:40.620303+00:00"
    },
    {
      "id": "msg-007",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 3,
      "role": "user",
      "content": "pucha si, me tachan de conflictiva, siendo que no es as\u00ed, y contra quien aclararlo pude despedirme",
      "created_at": "2026-05-19T17:12:14.039713+00:00"
    },
    {
      "id": "msg-008",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 4,
      "role": "assistant",
      "content": "Es comprensible que te sientas as\u00ed. Que te etiqueten como \"conflictiva\" cuando t\u00fa no lo experimentas de esa manera es una situaci\u00f3n muy frustrante, y m\u00e1s a\u00fan cuando la persona con quien podr\u00edas aclararlo ya no est\u00e1 disponible para conversar. Es un peso doble, porque te quedas sin espacio para explicar tu versi\u00f3n.\n\nPara poder entender mejor tu contexto y no asumir nada: \u00bfhay otras personas en tu entorno laboral que est\u00e9n reproduciendo esa misma percepci\u00f3n, o has intentado algo para abordar la situaci\u00f3n con quienes te rodean actualmente?",
      "created_at": "2026-05-19T17:12:27.175935+00:00"
    },
    {
      "id": "msg-009",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 5,
      "role": "user",
      "content": "no, solo conmigo, (la casi \u00fanica mujer), y a los hombres no les dicen nada con perores situaciones",
      "created_at": "2026-05-19T17:13:25.38514+00:00"
    },
    {
      "id": "msg-010",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 6,
      "role": "assistant",
      "content": "Gracias por compartir ese detalle tan relevante. Esa diferencia es clave: que seas la \u00fanica mujer y que a los hombres no se les etiquete igual, incluso con situaciones m\u00e1s complejas, muestra un patr\u00f3n que no tiene que ver contigo ni con tu forma de actuar. Es comprensible que esa injusticia duela y confunda.\n\nDesde lo que me cuentas, vale la pena considerar dos cosas: primero, distinguir entre la percepci\u00f3n de los dem\u00e1s y tu realidad interna; segundo, pensar en estrategias que no dependan de que otros cambien su mirada, sino de fortalecer tu posici\u00f3n. Por ejemplo, documentar tus intervenciones en reuniones o correos (sin ser defensiva, solo registrando) puede servir para tener evidencia si en el futuro necesitas mostrar c\u00f3mo han sido realmente tus interacciones. Tambi\u00e9n puede ayudar identificar a alguna persona aliada \u2014aunque sea fuera de tu unidad\u2014 que pueda validar tu experiencia.\n\n\u00bfTe resuena esta idea de documentar o buscar una aliada, o sientes que en tu contexto hay otro tipo de acci\u00f3n que ser\u00eda m\u00e1s viable?",
      "created_at": "2026-05-19T17:13:31.69452+00:00"
    },
    {
      "id": "msg-011",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 7,
      "role": "user",
      "content": "interesante, pero no s\u00e9 si hablarlo, me podr\u00edan despedir en este contexto de desventaja",
      "created_at": "2026-05-19T17:14:39.108964+00:00"
    },
    {
      "id": "msg-012",
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "order": 8,
      "role": "assistant",
      "content": "Tiene todo el sentido que sientas miedo. En un contexto de desventaja, donde eres la \u00fanica mujer y ya has sido etiquetada, hablar puede sentirse como un riesgo real, no solo percibido. No te voy a sugerir que hagas algo que ponga en peligro tu estabilidad laboral.\n\nEn lugar de eso, quiz\u00e1s lo \u00fatil ahora es enfocarte en estrategias de **baja visibilidad y alta protecci\u00f3n**, que no requieran enfrentamientos directos ni denuncias formales. Por ejemplo:\n\n- **Registrar para ti misma**, sin compartir con nadie, fechas y situaciones concretas donde viste el trato desigual. Eso te da claridad interna y, si alg\u00fan d\u00eda lo necesitas, evidencia.\n- **Identificar si hay canales formales an\u00f3nimos** en tu instituci\u00f3n (como una oficina de g\u00e9nero, bienestar o un sindicato) donde puedas consultar sin exponerte.\n- **Cuidar tu red de confianza fuera de ese entorno** para desahogarte sin consecuencias laborales.\n\nA veces, la primera acci\u00f3n protectora es simplemente nombrar para una misma lo que est\u00e1 pasando, sin actuar a\u00fan. \u00bfC\u00f3mo te sientes si consideras esta opci\u00f3n de guardar registro solo para ti, como una forma de no cargar sola con la duda?",
      "created_at": "2026-05-19T17:14:47.109076+00:00"
    },
    {
      "id": "msg-013",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 1,
      "role": "user",
      "content": "How can i come across as more commited to my work in front of my colleagues whitout raising my voice when i have to defend a valid point but no one else is listening to me?",
      "created_at": "2026-05-19T17:11:25.585226+00:00"
    },
    {
      "id": "msg-014",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 2,
      "role": "assistant",
      "content": "Entiendo profundamente lo frustrante que debe ser sentir que tu punto v\u00e1lido no es escuchado, y que adem\u00e1s tengas que preocuparte por c\u00f3mo te perciben al defenderlo. Es completamente comprensible que quieras mostrarte comprometida sin recurrir a alzar la voz, porque eso podr\u00eda ir en contra de c\u00f3mo quieres ser vista.\n\nPara poder darte una sugerencia m\u00e1s ajustada a tu realidad: \u00bfqu\u00e9 has intentado hasta ahora en esas situaciones para hacerte escuchar, y qu\u00e9 resultado has obtenido?",
      "created_at": "2026-05-19T17:11:30.672936+00:00"
    },
    {
      "id": "msg-015",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 3,
      "role": "user",
      "content": "He hecho lo mismo que mis colegas hombres pero recibo una percepci\u00f3n diferente de parte del equipo.",
      "created_at": "2026-05-19T17:12:31.275203+00:00"
    },
    {
      "id": "msg-016",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 4,
      "role": "assistant",
      "content": "Gracias por compartir eso. Es muy significativo lo que dices, y tiene mucho sentido que te genere frustraci\u00f3n: hacer exactamente lo mismo que otros y recibir una evaluaci\u00f3n distinta es una experiencia real y desgastante.\n\nPara entender mejor tu contexto y poder pensar juntas en algo \u00fatil: \u00bfpodr\u00edas darme un ejemplo concreto de una situaci\u00f3n reciente \u2014qu\u00e9 dijiste o hiciste exactamente, y c\u00f3mo reaccionaron tus colegas o jefatura? Eso me ayudar\u00eda a ajustar cualquier sugerencia a tu realidad, sin asumir nada.",
      "created_at": "2026-05-19T17:12:38.09907+00:00"
    },
    {
      "id": "msg-017",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 5,
      "role": "user",
      "content": "After a faculty council where the participant pushed back firmly on a budget decision she considered unfair, two colleagues filed informal complaints describing her as \"aggressive\" and \"hard to work with.\" A male colleague who raised his voice at the same meeting was later praised for his \"commitment to the institution.\"",
      "created_at": "2026-05-19T17:13:18.184164+00:00"
    },
    {
      "id": "msg-018",
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "order": 6,
      "role": "assistant",
      "content": "Gracias por compartir ese ejemplo tan concreto y revelador. Lo que describes \u2014que dos colegas presentaran quejas informales por \"agresiva\" mientras un colega var\u00f3n que alz\u00f3 la voz fue elogiado\u2014 no es una coincidencia, sino un patr\u00f3n documentado en el \u00e1mbito acad\u00e9mico: las mismas conductas asertivas se leen como \"compromiso\" en hombres y como \"agresividad\" en mujeres. Es comprensible que esto sea desgastante y te haga dudar de c\u00f3mo actuar.\n\nDado que ya tienes claro el diagn\u00f3stico, una estrategia concreta que podr\u00edas considerar es **enmarcar tu postura en t\u00e9rminos de beneficio colectivo o institucional antes de defender tu punto**. Por ejemplo, en lugar de decir \"esto es injusto\" (que puede leerse como queja personal), podr\u00edas decir: \"Propongo revisar este punto porque impacta directamente en la equidad de los recursos del departamento, y me preocupa que el criterio actual no est\u00e9 alineado con los principios que declaramos como facultad.\" Esto no cambia la sustancia, pero modifica el marco interpretativo de quienes te escuchan, haciendo m\u00e1s dif\u00edcil que te etiqueten como \"agresiva\" porque est\u00e1s apelando a valores compartidos.\n\n\u00bfTe parece que esta estrategia podr\u00eda ser aplicable en tu contexto, o ves alg\u00fan obst\u00e1culo concreto para probarla?",
      "created_at": "2026-05-19T17:13:24.553912+00:00"
    },
    {
      "id": "msg-019",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 1,
      "role": "user",
      "content": "Hola en una reunion de trabajo dos colegas varones me trataron como \"dificil\" o \"agresiva\" de forma injusta",
      "created_at": "2026-05-19T17:11:45.603088+00:00"
    },
    {
      "id": "msg-020",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 2,
      "role": "assistant",
      "content": "Hola, lamento mucho que hayas tenido que pasar por esa situaci\u00f3n. Es completamente comprensible que te sientas herida o frustrada, porque cuando te etiquetan como \"dif\u00edcil\" o \"agresiva\" sin raz\u00f3n, puede sentirse profundamente injusto y deslegitimador.\n\n\u00bfPodr\u00edas contarme un poco m\u00e1s sobre el contexto espec\u00edfico de esa reuni\u00f3n? Por ejemplo, \u00bfqu\u00e9 estabas planteando o defendiendo cuando recibiste esos comentarios?",
      "created_at": "2026-05-19T17:11:50.840957+00:00"
    },
    {
      "id": "msg-021",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 3,
      "role": "user",
      "content": "Era una reunion presupuestaria sobre",
      "created_at": "2026-05-19T17:12:38.405054+00:00"
    },
    {
      "id": "msg-022",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 4,
      "role": "assistant",
      "content": "Gracias por compartir el contexto. Entiendo que una reuni\u00f3n de presupuesto puede ser un espacio tenso, donde las opiniones y las negociaciones sobre recursos suelen ser delicadas.\n\nPara poder entender mejor tu situaci\u00f3n, \u00bfpodr\u00edas contarme qu\u00e9 punto espec\u00edfico estabas defendiendo o cuestionando cuando recibiste esos comentarios? As\u00ed puedo dimensionar mejor lo que ocurri\u00f3.",
      "created_at": "2026-05-19T17:12:42.494919+00:00"
    },
    {
      "id": "msg-023",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 5,
      "role": "user",
      "content": "Era una discusiom presupuestaria sobre fondos para estudiantws de plstgrade",
      "created_at": "2026-05-19T17:13:37.854969+00:00"
    },
    {
      "id": "msg-024",
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "order": 6,
      "role": "assistant",
      "content": "Gracias por precisarlo. Es evidente que defender recursos para estudiantes de postgrado es una lucha importante, y que recibir ese tipo de etiquetas en ese contexto puede sentirse especialmente invalidante.\n\nPara poder orientarte mejor, \u00bfpodr\u00edas contarme qu\u00e9 fue exactamente lo que dijiste o propusiste en ese momento que gener\u00f3 la reacci\u00f3n de tus colegas? A veces el contenido de la intervenci\u00f3n ayuda a entender por qu\u00e9 se activan esos calificativos.",
      "created_at": "2026-05-19T17:13:41.565781+00:00"
    },
    {
      "id": "msg-025",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 1,
      "role": "user",
      "content": "Soy acad\u00e9mica y mis colegas hombres asumen que, por ser mujer, puedo apoyar mejor a los estudiantes con problemas.",
      "created_at": "2026-05-19T17:12:14.652919+00:00"
    },
    {
      "id": "msg-026",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 2,
      "role": "assistant",
      "content": "Entiendo que esa situaci\u00f3n pueda ser frustrante. Que tus colegas asuman roles para ti basados en g\u00e9nero no solo es injusto, sino que tambi\u00e9n puede cargarte con un trabajo emocional adicional que suele pasar desapercibido.\n\nPara entender mejor tu contexto: \u00bfc\u00f3mo has respondido t\u00fa hasta ahora cuando esta suposici\u00f3n se manifiesta en conversaciones o decisiones de tu departamento?",
      "created_at": "2026-05-19T17:12:18.934395+00:00"
    },
    {
      "id": "msg-027",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 3,
      "role": "user",
      "content": "Lo planti\u00e9 en el departamento y me dijeron que confiaban en m\u00ed porque soy responsbale.",
      "created_at": "2026-05-19T17:12:52.314303+00:00"
    },
    {
      "id": "msg-028",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 4,
      "role": "assistant",
      "content": "Me parece valiente que lo hayas planteado. La respuesta que recibiste \u2014\"confiamos en ti porque eres responsable\"\u2014 es delicada porque, sin mala intenci\u00f3n, desv\u00eda el foco del problema estructural hacia tu perfil personal, lo que hace m\u00e1s dif\u00edcil cuestionar la distribuci\u00f3n del trabajo emocional.\n\nUna estrategia que podr\u00eda funcionar es cambiar el \u00e1ngulo de la conversaci\u00f3n: en lugar de centrarte en c\u00f3mo te perciben a ti, prop\u00f3n al departamento un registro colectivo de las tareas de apoyo estudiantil (horas dedicadas, tipo de casos, carga real). As\u00ed el peso del trabajo se hace visible de manera neutral, sin apelar a cualidades personales. Eso puede abrir espacio para distribuir responsabilidades de forma m\u00e1s equitativa.\n\n\u00bfCrees que esta perspectiva de visibilizar la carga de trabajo \u2014en vez de discutir percepciones\u2014 podr\u00eda serte \u00fatil en tu contexto, o ves otra barrera que habr\u00eda que sortear primero?",
      "created_at": "2026-05-19T17:12:59.110089+00:00"
    },
    {
      "id": "msg-029",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 5,
      "role": "user",
      "content": "Me gusta!",
      "created_at": "2026-05-19T17:13:35.654776+00:00"
    },
    {
      "id": "msg-030",
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "order": 6,
      "role": "assistant",
      "content": "Me alegra mucho que la idea te resuene. A veces, un cambio de enfoque t\u00e9cnico \u2014como medir la carga real\u2014 puede desactivar resistencias que surgen cuando el debate se vuelve personal.\n\nEl siguiente paso natural ser\u00eda pensar c\u00f3mo implementar ese registro sin que se sienta como una auditor\u00eda punitiva para nadie. Podr\u00eda comenzar como una iniciativa piloto tuya, documentando tus propias horas durante un mes, y luego compartir los datos de manera informal con una colega aliada antes de llevarlo al departamento.\n\n\u00bfHay alguien en tu equipo con quien sientas que podr\u00edas ensayar esta conversaci\u00f3n o co-dise\u00f1ar el registro antes de presentarlo formalmente?",
      "created_at": "2026-05-19T17:13:42.571774+00:00"
    },
    {
      "id": "msg-031",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 1,
      "role": "user",
      "content": "Hola! Estoy teniendo complicaciones con mi trabajo, resulta que soy profesora e investigadora de la facultad universitaria, tengo a mi cargo dos comites de tesis, estoy a cargo de el area de bienestar de mi facultad y dado este cargo, informalmente los estudiantes acuden a mi en busca de consejo, mis compa\u00f1eros hombres con mi mismo cargo no cumplen ninguna de estas funciones y desarrollan normalmente su vida academica y laboral. En ese sentido te escribo porque no he podido avanzar en mis trabajos academicos hace 10 meses y en 11 meses mas tengo comit\u00e9 para ver si me promueven, que puedo hacer para balancear mejor esta carga?",
      "created_at": "2026-05-19T17:10:26.723518+00:00"
    },
    {
      "id": "msg-032",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 2,
      "role": "assistant",
      "content": "Entiendo lo agotador que debe ser llevar toda esa carga adicional \u2014los comit\u00e9s, el \u00e1rea de bienestar y la consejer\u00eda informal\u2014 mientras ves que tus colegas hombres no enfrentan lo mismo, y con la presi\u00f3n de la evaluaci\u00f3n en menos de un a\u00f1o. Es comprensible que sientas que no has podido avanzar en tu producci\u00f3n acad\u00e9mica.\n\nPara ayudarte mejor, necesito entender un poco m\u00e1s: **\u00bfQu\u00e9 estrategias has intentado hasta ahora para poner l\u00edmites o delegar algunas de estas tareas?** Por ejemplo, \u00bfhas conversado con alguien de tu facultad sobre redistribuir la carga del \u00e1rea de bienestar o formalizar la consejer\u00eda estudiantil?",
      "created_at": "2026-05-19T17:10:33.903246+00:00"
    },
    {
      "id": "msg-033",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 3,
      "role": "user",
      "content": "Por el momento nada, no he podido ponerme en accion porque me siento sobrepasada",
      "created_at": "2026-05-19T17:11:10.087661+00:00"
    },
    {
      "id": "msg-034",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 4,
      "role": "assistant",
      "content": "Tiene todo el sentido que te sientas sobrepasada; cuando la carga es tan grande, dar el primer paso puede parecer imposible. No hay nada de malo en no haber actuado a\u00fan. Lo importante es que ya identificaste el problema.\n\nPara empezar a moverte sin sentir que necesitas resolver todo de golpe, dime esto: **Si pudieras cambiar una sola cosa esta semana \u2014una tarea espec\u00edfica que te quite m\u00e1s tiempo\u2014 \u00bfcu\u00e1l ser\u00eda?** No pienses en el \"c\u00f3mo\", solo en qu\u00e9 tarea concreta sientes que es la que m\u00e1s te drena.",
      "created_at": "2026-05-19T17:11:17.585937+00:00"
    },
    {
      "id": "msg-035",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 5,
      "role": "user",
      "content": "Le daria apoyo al acompa\u00f1amiento de estudiantes de manera informal, pierdo mucho tiempo conversando luego de clases y respondiendo correos",
      "created_at": "2026-05-19T17:12:34.351478+00:00"
    },
    {
      "id": "msg-036",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 6,
      "role": "assistant",
      "content": "Gracias por precisarlo. Centrarse en el acompa\u00f1amiento informal es muy revelador: esa tarea es invisible pero consume mucho tiempo, y como no est\u00e1 formalizada, es dif\u00edcil medirla o justificar ponerle l\u00edmites. Tiene todo el sentido que ah\u00ed est\u00e9 el primer foco.\n\nUna estrategia concreta que podr\u00edas considerar esta semana es **delimitar un \"horario de atenci\u00f3n abierta\" para esos consejos informales** \u2014por ejemplo, 30 minutos despu\u00e9s de cada clase, dos veces por semana\u2014 y comunicarlo amablemente a tus estudiantes. Para los correos, podr\u00edas redactar una respuesta tipo breve que ofrezca ese espacio en lugar de resolver todo por escrito. Esto no resuelve todo, pero te devuelve algo de control sobre tu tiempo sin desaparecer del todo.\n\nDicho esto, \u00bfcrees que esta idea de poner un horario fijo podr\u00eda ser viable en tu contexto, o ves alg\u00fan obst\u00e1culo concreto que har\u00eda dif\u00edcil implementarlo?",
      "created_at": "2026-05-19T17:12:45.677992+00:00"
    },
    {
      "id": "msg-037",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 7,
      "role": "user",
      "content": "Si, suelo tener libre despues de las clases para este tiempo libre",
      "created_at": "2026-05-19T17:13:11.061528+00:00"
    },
    {
      "id": "msg-038",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 8,
      "role": "assistant",
      "content": "Me alegra que tengas ese espacio despu\u00e9s de clases disponible. Eso hace que la idea de un horario fijo sea muy viable. Podr\u00edas probar con algo simple: al terminar cada clase, anunciar que te quedas 20 minutos para quienes necesiten conversar brevemente, y fuera de ese horario redirigir las consultas a ese espacio o al \u00e1rea de bienestar formal (si existe). As\u00ed reduces la dispersi\u00f3n sin abandonar el apoyo.\n\nAdem\u00e1s, para los correos, te sugiero tener una respuesta modelo breve, como: \"Gracias por tu consulta. Te espero en mi horario de atenci\u00f3n despu\u00e9s de la clase del [d\u00eda] para conversarlo\". Eso pone un l\u00edmite claro sin sentirte culpable.\n\nAhora, una reflexi\u00f3n final: \u00bfC\u00f3mo crees que se sentir\u00eda al implementar este peque\u00f1o cambio durante una semana? A veces visualizar el alivio concreto ayuda a dar el paso.",
      "created_at": "2026-05-19T17:13:19.881904+00:00"
    },
    {
      "id": "msg-039",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 9,
      "role": "user",
      "content": "Yo creo que me ayudaria a ordenar mejor mi tiempo y las cosas que tengo que hacer",
      "created_at": "2026-05-19T17:14:02.736446+00:00"
    },
    {
      "id": "msg-040",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 10,
      "role": "assistant",
      "content": "Me alegra que veas que este cambio podr\u00eda ayudarte a ordenarte. Tener una visi\u00f3n clara del beneficio es un buen primer paso para empezar a actuar.\n\nPara que puedas implementarlo con m\u00e1s confianza, \u00bfhay alg\u00fan colega o autoridad en tu facultad con quien puedas conversar sobre esta medida? Por ejemplo, comentarle al director de tu departamento que vas a formalizar un horario de atenci\u00f3n para que los estudiantes sepan cu\u00e1ndo encontrarte. Eso podr\u00eda darte respaldo y hacer que el l\u00edmite sea m\u00e1s sostenible.",
      "created_at": "2026-05-19T17:14:20.034613+00:00"
    },
    {
      "id": "msg-041",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 11,
      "role": "user",
      "content": "No tengo ninguna compa\u00f1era en mi mismo cargo",
      "created_at": "2026-05-19T17:14:34.526101+00:00"
    },
    {
      "id": "msg-042",
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "order": 12,
      "role": "assistant",
      "content": "Entiendo. No tener colegas mujeres en el mismo cargo hace que sea m\u00e1s dif\u00edcil encontrar apoyo o validaci\u00f3n para poner l\u00edmites. Sin embargo, igual puedes buscar respaldo institucional: tu jefe directo (aunque sea hombre) o la direcci\u00f3n de tu facultad. No necesitas pedir permiso, pero s\u00ed informar que, para proteger tu tiempo de investigaci\u00f3n, vas a establecer un horario de atenci\u00f3n fijo para estudiantes. Eso lo convierte en una decisi\u00f3n profesional, no personal.\n\nAdem\u00e1s, considera buscar una mentora o par acad\u00e9mica fuera de tu universidad (por ejemplo, de otra facultad o disciplina). A veces una conversaci\u00f3n mensual con alguien que entienda el contexto puede darte perspectivas y apoyo sin que dependas de colegas locales.\n\nDado que ya identificaste un primer paso concreto, \u00bfqu\u00e9 te parece si esta semana te enfocas solo en implementar ese horario fijo y ver c\u00f3mo te sientes? El resto de las tareas pueden esperar.",
      "created_at": "2026-05-19T17:14:47.356206+00:00"
    },
    {
      "id": "msg-043",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 1,
      "role": "user",
      "content": "Hi! How can I help you today?\n\n\ud83d\udc64\nI am a faculty member, a new one. I serve in a lot committes relatedbti students wellfare, but I siendo too much time on that... and I haven't finished my research paper. What should I do?",
      "created_at": "2026-05-19T17:11:13.26454+00:00"
    },
    {
      "id": "msg-044",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 2,
      "role": "assistant",
      "content": "It makes a lot of sense that you feel stretched\u2014committees can be consuming, especially when they involve student welfare, which often carries an emotional weight. And as a new faculty member, you may also feel pressure to prove your commitment. It's understandable that your research paper is getting left behind.\n\nTo help us think together, could you tell me: what, if anything, have you considered or tried so far to better balance your committee service with your writing time?",
      "created_at": "2026-05-19T17:11:17.944035+00:00"
    },
    {
      "id": "msg-045",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 3,
      "role": "user",
      "content": "I talked to my chair... it seems that my male colleagues are not taking the same workload",
      "created_at": "2026-05-19T17:12:37.356812+00:00"
    },
    {
      "id": "msg-046",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 4,
      "role": "assistant",
      "content": "That sounds like a significant\u2014and unfortunately common\u2014observation. It's completely understandable that this feels frustrating, especially when you're already stretched thin and trying to meet your research goals. Raising it with your chair was a courageous step.\n\nCould you share what your chair said in response when you brought up that difference in workload? That might help us see what room you have to adjust things.",
      "created_at": "2026-05-19T17:12:42.717535+00:00"
    },
    {
      "id": "msg-047",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 5,
      "role": "user",
      "content": "That they give me those assignments because I am a responsable person",
      "created_at": "2026-05-19T17:13:30.40915+00:00"
    },
    {
      "id": "msg-048",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 6,
      "role": "assistant",
      "content": "Thank you for sharing that\u2014it's a very telling response from your chair. What you describe is a pattern I've seen many times: assigning more service work to someone precisely *because* they are dependable, which can end up penalizing the very responsibility that makes you valuable. The fact that your male colleagues aren't carrying the same load, and that the chair frames this as a reward for your reliability, is important context.\n\nOne strategy that some academics find useful in this situation is to reframe the conversation with your chair from *how much* you are doing to *what gets displaced*. For example, you could say something like: \"I want to continue contributing, but I need to ensure I can meet my research milestones. Could we review the committee workload among the faculty to make sure it's distributed more equitably, so I can protect my writing time?\" This shifts the focus to institutional balance rather than your personal capacity, which can be harder for a chair to dismiss.\n\nDoes this framing resonate with your situation, or would a different angle be more helpful for you to try?",
      "created_at": "2026-05-19T17:13:38.416507+00:00"
    },
    {
      "id": "msg-049",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 7,
      "role": "user",
      "content": "It does",
      "created_at": "2026-05-19T17:14:25.177838+00:00"
    },
    {
      "id": "msg-050",
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "order": 8,
      "role": "assistant",
      "content": "I'm glad that framing clicks for you. One concrete next step could be to prepare a simple, factual comparison of the time you spend on service versus your male colleagues\u2014without accusations, just data. For instance, you could jot down the number of committees you're on, the hours per week, and contrast it with the typical load of your peers (even if it's approximate). Then, bring that to your chair along with your research deadlines.\n\nThis turns the conversation from \"I'm overwhelmed\" (which can be heard as personal) to \"Here's a visible imbalance that affects our unit's productivity and equity\" (which is institutional). Many chairs find it harder to dismiss a concrete picture.\n\nHow do you feel about preparing a brief, factual summary before your next conversation?",
      "created_at": "2026-05-19T17:14:31.682226+00:00"
    },
    {
      "id": "msg-051",
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "order": 1,
      "role": "user",
      "content": "i have a problem with my faculty, i was defending a budget decision i considered it was unfair, but then one of my male colleagues was praised for standing up and raising his voice in the same meeting. i believe this has something to do with the fact that i am a woman, and i am risking the faculty evaluation next week if i dont do something",
      "created_at": "2026-05-19T17:12:11.273819+00:00"
    },
    {
      "id": "msg-052",
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "order": 2,
      "role": "assistant",
      "content": "It makes sense that you feel frustrated and concerned about the difference in treatment and the pressure of the upcoming evaluation. That discrepancy\u2014where your male colleague is praised for similar behavior\u2014can be deeply unsettling, especially when you're already navigating a high-stakes moment.\n\nBefore I can offer any more tailored thoughts, I need to understand one thing: **What specific action(s) are you considering taking before the evaluation next week?** (For example, are you thinking of talking to someone, preparing a statement, or simply observing?)",
      "created_at": "2026-05-19T17:12:17.626041+00:00"
    },
    {
      "id": "msg-053",
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "order": 3,
      "role": "user",
      "content": "probably is the best to talk to someone, but i don\u2019t know how to proceed",
      "created_at": "2026-05-19T17:13:02.223766+00:00"
    },
    {
      "id": "msg-054",
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "order": 4,
      "role": "assistant",
      "content": "Thank you for clarifying. It's completely understandable to feel uncertain about how to approach this\u2014especially when the system feels inconsistent and the evaluation is looming.\n\nSince you're considering talking to someone, let me suggest a concrete first step: **Reframe your goal.** Instead of \"complaining about the unfairness\" (which might be risky), frame it as a *request for clarity on protocols and expectations.* For example, you could schedule a brief meeting with your department head or a trusted senior colleague and say something like: *\"I want to ensure I'm supporting the faculty's best interests. Could you help me understand the criteria for how budget advocacy is valued in evaluations? I noticed different reactions in the last meeting and want to align my approach.\"*\n\nThis keeps the focus on your professional development and the institution's standards, not on comparing yourself to your colleague.\n\n**One reflective question for you:** Does this framing feel like it could protect you while still addressing the issue, or does it raise other concerns for your specific context?",
      "created_at": "2026-05-19T17:13:08.487948+00:00"
    },
    {
      "id": "msg-055",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 1,
      "role": "user",
      "content": "I\u2019d like to know what roles will be taken off my shoulders to give me the time to complete these roles. I also want to know if my expectations on other tasks will be adjusted based on these added expectations.",
      "created_at": "2026-05-19T17:05:46.086228+00:00"
    },
    {
      "id": "msg-056",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 2,
      "role": "assistant",
      "content": "I can hear how important it is for you to have clarity about what will change in your workload when new expectations are added. It makes sense to want to know which tasks will be removed or adjusted, rather than just piling more on. That kind of transparency is not always given, yet it's essential for sustainable work.\n\nTo help you move forward, could you tell me a little more about the specific new roles or expectations that were introduced? For example, were they assigned by a department head, part of a committee, or included in a new teaching or research requirement? Knowing the source and nature of the added tasks will help me offer a more focused perspective.",
      "created_at": "2026-05-19T17:05:50.854085+00:00"
    },
    {
      "id": "msg-057",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 3,
      "role": "user",
      "content": "They were assigned by my head of my department",
      "created_at": "2026-05-19T17:06:44.884434+00:00"
    },
    {
      "id": "msg-058",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 4,
      "role": "assistant",
      "content": "Thank you for clarifying that. Knowing the expectations come from your department head gives a clearer picture\u2014it suggests this is a direct, hierarchical assignment rather than a peer or committee decision, which can affect how you approach a conversation about workload adjustments.\n\nHave you already discussed with your department head the possibility of reallocating or reducing some of your current responsibilities to accommodate these new roles? I ask because understanding what, if any, negotiation has already taken place can help identify the next most useful step.",
      "created_at": "2026-05-19T17:06:57.438356+00:00"
    },
    {
      "id": "msg-059",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 5,
      "role": "user",
      "content": "No",
      "created_at": "2026-05-19T17:07:09.818275+00:00"
    },
    {
      "id": "msg-060",
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "order": 6,
      "role": "assistant",
      "content": "I see\u2014so the new responsibilities were assigned, but no conversation about adjusting your existing workload has happened yet. That's a key piece: without that discussion, it's hard to know whether the department head expects you to simply absorb everything, or whether they're open to renegotiating.\n\nWhat would feel most difficult or risky for you about initiating that conversation? For example, is it about finding the right moment, fearing a negative response, or not being sure how to frame your request in a way that feels professional and fair?",
      "created_at": "2026-05-19T17:07:14.76209+00:00"
    },
    {
      "id": "msg-061",
      "session_id": "175db844-0d89-47a9-8356-574f56378465",
      "order": 1,
      "role": "user",
      "content": "I\u2019d like to know what roles will be taken off my shoulders to give me the time to complete these roles. I also want to know if my expectations on other tasks will be adjusted based on these added expectations.",
      "created_at": "2026-05-19T17:04:06.46676+00:00"
    },
    {
      "id": "msg-062",
      "session_id": "175db844-0d89-47a9-8356-574f56378465",
      "order": 2,
      "role": "assistant",
      "content": "It sounds like you're navigating a workload rebalancing conversation\u2014likely with a manager or team lead. To directly address your questions:\n\n1. **Which roles will be removed or reassigned?**  \n   That depends on the specific tasks you\u2019re currently handling. You\u2019ll need a clear, documented list of your current responsibilities and the new ones being added. From there, your manager should identify which tasks can be delegated, postponed, or eliminated entirely to free up time. If that hasn\u2019t been spelled out yet, ask for a written priority trade-off.\n\n2. **Will expectations on existing tasks be adjusted?**  \n   Yes, that should happen. If you\u2019re taking on new roles, the performance standards, deadlines, or quality targets for your remaining tasks should be formally recalibrated. Otherwise, you risk being set up for failure. Push for explicit agreement on which tasks get lower priority, extended timelines, or reduced scope.\n\n**Next steps you might take:**\n- Request a meeting to review your full workload before and after the change.\n- Ask for a \u201cstop doing\u201d list\u2014specific tasks or responsibilities that will be removed or deprioritized.\n- Confirm whether deadlines or success metrics for ongoing tasks will be relaxed.\n\nIf you haven\u2019t received clear answers yet, you\u2019re right to ask. A sustainable shift requires both subtraction and adjustment, not just addition. Want to share more context so I can help tailor the approach?",
      "created_at": "2026-05-19T17:04:11.585654+00:00"
    },
    {
      "id": "msg-063",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 1,
      "role": "user",
      "content": "Hola, soy una académica de una institución pública",
      "created_at": "2026-05-19T17:02:52.087889+00:00"
    },
    {
      "id": "msg-064",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 2,
      "role": "assistant",
      "content": "\u00a1Hola! Qu\u00e9 gusto saludarte. \u00bfEn qu\u00e9 puedo orientarte hoy sobre tu situaci\u00f3n acad\u00e9mica?",
      "created_at": "2026-05-19T17:02:55.70799+00:00"
    },
    {
      "id": "msg-065",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 3,
      "role": "user",
      "content": "Quisiera consultar sobre una situación de conflicto en mi departamento",
      "created_at": "2026-05-19T17:05:00.77887+00:00"
    },
    {
      "id": "msg-066",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 4,
      "role": "assistant",
      "content": "\u00a1Ah, sin problema, la académica! Gracias por la correcci\u00f3n. Quedo atento si necesitas algo en lo que pueda ayudarte.",
      "created_at": "2026-05-19T17:05:02.584123+00:00"
    },
    {
      "id": "msg-067",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 5,
      "role": "user",
      "content": "Recibi mucha resistencia de parte de un colega varon en una reunion presupuestaria",
      "created_at": "2026-05-19T17:05:51.170897+00:00"
    },
    {
      "id": "msg-068",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 6,
      "role": "assistant",
      "content": "Entiendo la situación. Lamento escuchar que hayas enfrentado resistencia de un colega en una reuni\u00f3n presupuestaria. Es un escenario complejo, sobre todo cuando hay diferencias de opini\u00f3n o din\u00e1micas de poder que pueden hacer sentir que tu voz no es escuchada.\n\nPara poder darte una orientaci\u00f3n m\u00e1s precisa, me gustar\u00eda preguntarte: \u00bfla resistencia se manifest\u00f3 en cr\u00edticas a tus propuestas, interrupciones, descalificaciones o simplemente en una actitud cerrada a considerar alternativas? Dependiendo del tipo de resistencia, las estrategias pueden variar.\n\nEn t\u00e9rminos generales, te sugiero considerar algunos pasos:\n\n1. **Preparaci\u00f3n t\u00e9cnica s\u00f3lida** \u2013 Aseg\u00farate de tener datos, proyecciones y casos concretos que respalden tus puntos. Si tu colega se basa en supuestos o emociones, los n\u00fameros pueden ser tu mejor aliado.\n2. **Comunicaci\u00f3n asertiva** \u2013 Puedes usar frases como: \u201cEntiendo tu punto, pero desde mi perspectiva los datos muestran que\u2026\u201d, o \u201cPropongo que revisemos juntos estas cifras para ver si hay un punto en com\u00fan\u201d.\n3. **Buscar aliados** \u2013 Si hay otros colegas que apoyan tus ideas o que tienen peso en la discusi\u00f3n, coordina con ellos antes de la reuni\u00f3n para que respalden ciertos puntos.\n4. **Documentar la situaci\u00f3n** \u2013 Si la resistencia es recurrente o se torna hostil, puede ser \u00fatil llevar un registro por si necesitas hablar con tu jefe o recursos humanos.\n5. **Hablar con \u00e9l en privado** \u2013 A veces una conversaci\u00f3n uno a uno, sin presi\u00f3n de grupo, puede aclarar malentendidos o tensiones.\n\n\u00bfTe gustar\u00eda que profundice en alguna de estas l\u00edneas o prefieres contarme un poco m\u00e1s sobre c\u00f3mo se desarroll\u00f3 la reuni\u00f3n?",
      "created_at": "2026-05-19T17:06:05.846472+00:00"
    },
    {
      "id": "msg-069",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 7,
      "role": "user",
      "content": "Deber\u00eda reportar su actitud o dejarlo pasar ?",
      "created_at": "2026-05-19T17:06:46.960492+00:00"
    },
    {
      "id": "msg-070",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 8,
      "role": "assistant",
      "content": "Entiendo que esta decisi\u00f3n puede ser inc\u00f3moda y que hay varios factores en juego. Te ayudar\u00e9 a evaluarlo paso a paso para que puedas decidir con claridad.\n\nPrimero, preg\u00fantate:\n\n- **\u00bfFue un episodio aislado o es parte de un patr\u00f3n?** Si es la primera vez y la resistencia se dio solo en esa reuni\u00f3n, quiz\u00e1s valga la pena intentar una conversaci\u00f3n directa con \u00e9l antes de escalarlo. Si ya ha ocurrido antes o hay otras actitudes similares (minimizar tus ideas, interrumpirte, hablar sobre ti), entonces documentarlo y reportarlo cobra m\u00e1s sentido.\n- **\u00bfCu\u00e1l fue el tono y el contenido de la resistencia?** Si fueron cr\u00edticas t\u00e9cnicas y argumentadas (aunque duras), puede ser un desacuerdo profesional normal. Si hubo descalificaciones personales, condescendencia, interrupciones sistem\u00e1ticas o comentarios que sugieran que tu opini\u00f3n vale menos por ser mujer, eso ya es m\u00e1s grave y merece ser reportado.\n- **\u00bfC\u00f3mo afect\u00f3 esto a tu trabajo o a tu bienestar?** Si te hizo sentir insegura, silenciada o con miedo de participar en futuras reuniones, no lo dejes pasar. Tu salud mental y tu derecho a un ambiente respetuoso son prioritarios.\n- **\u00bfExiste una cultura institucional de apoyo?** En la la institución universitaria suele haber canales formales (Oficina de G\u00e9nero, OIRS, denuncias formales) y tambi\u00e9n informales (jefatura, tutores). Si sientes que hay respaldo, reportar puede ser m\u00e1s seguro.\n\n**Mi recomendaci\u00f3n equilibrada:**\n\n- **No lo dejes pasar sin m\u00e1s**, porque podr\u00edas normalizar una conducta que no es aceptable.\n- **Pero no necesariamente lo reportes de inmediato si no hay claridad.** Primero intenta:\n  1. Hablar con \u00e9l en privado, de manera calmada: \u201cEn la reuni\u00f3n sent\u00ed que mis propuestas no fueron consideradas. \u00bfPodemos conversar para entender mejor tu punto y buscar acuerdos?\u201d. A veces es solo mala comunicaci\u00f3n.\n  2. Si no funciona o si la actitud se repite, entonces **documenta** (fecha, palabras textuales, testigos) y **reporta** a tu jefe directo o a la unidad de g\u00e9nero de la universidad.\n\n**En resumen:** Si fue una sola vez y con argumentos t\u00e9cnicos, intenta resolverlo conversando. Si hay indicios de sesgo de g\u00e9nero, patr\u00f3n o maltrato, **no lo dejes pasar y rep\u00f3rtalo**. Nadie deber\u00eda tener que soportar resistencia injusta por su g\u00e9nero.\n\n\u00bfTe sirve este an\u00e1lisis o prefieres que profundice en c\u00f3mo preparar esa conversaci\u00f3n o el reporte?",
      "created_at": "2026-05-19T17:07:08.567765+00:00"
    },
    {
      "id": "msg-071",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 9,
      "role": "user",
      "content": "me han categorizado como \"dificil\" o \"agresiva\"",
      "created_at": "2026-05-19T17:08:42.999432+00:00"
    },
    {
      "id": "msg-072",
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "order": 10,
      "role": "assistant",
      "content": "Lamento mucho que est\u00e9s experimentando esto. Es una situaci\u00f3n muy compleja y, lamentablemente, frecuente cuando una mujer muestra firmeza en contextos laborales o acad\u00e9micos. Ser etiquetada como \"dif\u00edcil\" o \"agresiva\" suele ser una respuesta a la asertividad femenina, mientras que conductas similares en varones son vistas como \"seguridad\" o \"liderazgo\".\n\nAnalicemos esto con cuidado:\n\n**\u00bfQu\u00e9 est\u00e1 pasando realmente?**\n\n- **Sesgo de g\u00e9nero impl\u00edcito:** Existe abundante evidencia (estudios como los de la Universidad de Harvard o el Proyecto Impl\u00edcito) de que las mujeres que son directas, defienden sus ideas o cuestionan decisiones son percibidas como \"agresivas\", mientras que los hombres con el mismo comportamiento son vistos como \"firmes\" o \"competentes\".\n- **Gaslighting institucional:** Al ponerte esa etiqueta, se desv\u00eda la atenci\u00f3n de la conducta de tu colega (resistencia injustificada) hacia tu forma de reaccionar, invalidando tu experiencia y haci\u00e9ndote dudar de ti misma.\n- **Aislamiento:** Este tipo de etiquetas busca silenciarte y desacreditarte ante otros colegas o superiores.\n\n**\u00bfQu\u00e9 puedes hacer?**\n\n1. **No internalices la etiqueta.** No eres \"dif\u00edcil\", eres competente y defiendes tus posiciones. La resistencia que enfrentaste no justifica que ahora te patologicen a ti.\n\n2. **Documenta TODO.** Anota:\n   - Fechas y contexto de la reuni\u00f3n.\n   - Frases textuales de tu colega (resistencia).\n   - Frases textuales de quien te categoriz\u00f3 (si fue \u00e9l u otra persona).\n   - Testigos presentes.\n   - C\u00f3mo te sentiste y c\u00f3mo afect\u00f3 tu desempe\u00f1o.\n\n3. **Busca una conversaci\u00f3n con alguien de confianza en la universidad.** Puede ser:\n   - Tu jefe/a directo/a (si es alguien con quien puedas ser sincera).\n   - La Direcci\u00f3n de G\u00e9nero de la la institución universitaria (tienen experiencia en estos casos y pueden orientarte).\n   - Un/a tutor/a acad\u00e9mico/a o un/a colega senior que te respalde.\n\n4. **Si decides confrontar la etiqueta**, puedes decir algo como:\n   > \"Me han comentado que en la reuni\u00f3n fui percibida como 'agresiva'. Quiero entender mejor a qu\u00e9 se refieren, porque yo estaba defendiendo datos objetivos y propuestas razonadas. A veces, cuando una mujer defiende sus ideas con firmeza, se interpreta de manera distinta que cuando lo hace un hombre. Me gustar\u00eda que revisemos juntos si lo que incomod\u00f3 fue mi forma o el contenido de lo que dije.\"\n\n5. **Eval\u00faa la opci\u00f3n de una denuncia formal** si:\n   - Hay un patr\u00f3n de conducta (no solo este episodio).\n   - La categorizaci\u00f3n viene de tu colega y es reiterada.\n   - Sientes que tu desempe\u00f1o o tu bienestar est\u00e1n siendo afectados.\n   - Hay otras mujeres que hayan reportado conductas similares de la misma persona.\n\n**Lo m\u00e1s importante: no est\u00e1s sola.** Muchas mujeres han pasado por esto antes que t\u00fa. La la institución universitaria tiene protocolos contra el acoso y la discriminaci\u00f3n de g\u00e9nero. No dudes en usarlos si sientes que es necesario.\n\n\u00bfTe gustar\u00eda que te ayude a estructurar c\u00f3mo hablar con tu jefe o con la unidad de g\u00e9nero? \u00bfO prefieres pensar primero en c\u00f3mo responder si vuelven a hacer ese comentario en p\u00fablico?",
      "created_at": "2026-05-19T17:09:09.225897+00:00"
    },
    {
      "id": "msg-073",
      "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "order": 1,
      "role": "user",
      "content": "Hola! Estoy teniendo complicaciones con mi trabajo, resulta que soy profesora e investigadora de la facultad universitaria, tengo a mi cargo dos comites de tesis, estoy a cargo de el area de bienestar de mi facultad y dado este cargo, informalmente los estudiantes acuden a mi en busca de consejo, mis compa\u00f1eros hombres con mi mismo cargo no cumplen ninguna de estas funciones y desarrollan normalmente su vida academica y laboral. En ese sentido te escribo porque no he podido avanzar en mis trabajos academicos hace 10 meses y en 11 meses mas tengo comit\u00e9 para ver si me promueven, que puedo hacer para balancear mejor esta carga?",
      "created_at": "2026-05-19T17:06:30.967361+00:00"
    },
    {
      "id": "msg-074",
      "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "order": 2,
      "role": "assistant",
      "content": "Hola, gracias por compartir tu situaci\u00f3n. Entiendo profundamente lo frustrante y agotador que debe ser cargar con responsabilidades informales que no est\u00e1n reconocidas ni distribuidas equitativamente, mientras ves que tus colegas varones no enfrentan las mismas exigencias. Esto no es solo un problema personal, sino un reflejo de din\u00e1micas de g\u00e9nero estructurales en la academia, donde las mujeres suelen asumir tareas de cuidado, contenci\u00f3n y gesti\u00f3n emocional que no son valoradas en los procesos de evaluaci\u00f3n.\n\nTe propongo algunas estrategias concretas para intentar equilibrar tu carga y avanzar hacia tu promoci\u00f3n:\n\n**1. Haz visible y cuantifica tu trabajo invisible**\n- Lleva un registro durante 2 semanas de todo lo que haces: reuniones informales con estudiantes, consultas de bienestar, gestiones no previstas, horas dedicadas a comit\u00e9s de tesis. Anota tiempos, temas y personas involucradas.\n- Este registro te servir\u00e1 para:\n   a) Mostrar en tu comit\u00e9 de promoci\u00f3n que tu producci\u00f3n acad\u00e9mica se ha visto desplazada por labores de gesti\u00f3n y apoyo que **no son parte formal de tu cargo**.\n   b) Negociar con tus autoridades una redistribuci\u00f3n de tareas o reconocimiento formal (descarga horaria, apoyo administrativo, etc.).\n\n**2. Establece l\u00edmites claros y comun\u00edcalos**\n- Define **horarios de atenci\u00f3n** espec\u00edficos para consultas de estudiantes, y comun\u00edcalos por correo o en la puerta de tu oficina. Fuera de ese horario, no respondas mensajes ni correos informales (salvo emergencias reales).\n- Crea un **protocolo simple** de derivaci\u00f3n: si un estudiante llega con un problema que no es estrictamente de bienestar (por ejemplo, dudas administrativas o acad\u00e9micas generales), redir\u00edgelo a la instancia correspondiente (secretar\u00eda, otro profesor, etc.).\n- Ensaya frases como: *\"Entiendo tu situaci\u00f3n, pero este tema corresponde al \u00e1rea de [X]. Te sugiero que lo consultes con [persona/oficina] porque yo no puedo resolverlo desde aqu\u00ed\"*.\n\n**3. Delegar y redistribuir tareas del \u00e1rea de bienestar**\n- Si tienes colegas en el \u00e1rea de bienestar o en tu facultad, **formaliza la existencia de un equipo**, aunque sea peque\u00f1o. Prop\u00f3n que al menos una persona m\u00e1s (puede ser un ayudante, un estudiante de posgrado remunerado, o un administrativo) comparta la atenci\u00f3n de estudiantes.\n- Si no es posible, pide a tus autoridades que **definan por escrito el alcance de tus funciones** en bienestar. As\u00ed quedar\u00e1 claro qu\u00e9 tareas s\u00ed y cu\u00e1les no te corresponden, y podr\u00e1s negarte a asumir otras sin sentir culpa.\n\n**4. Negocia con tus autoridades usando datos**\n- Pide una reuni\u00f3n con tu director/a de departamento o decano/a. Lleva tu registro de carga de trabajo. Se\u00f1ala con claridad:\n   *\"En los \u00faltimos 10 meses, he dedicado el [X]% de mi tiempo a tareas de bienestar y atenci\u00f3n informal a estudiantes, mientras mis colegas hombres con el mismo cargo dedican ese tiempo a investigaci\u00f3n. Para poder avanzar en mis publicaciones y ser promovida, necesito [descarga horaria / apoyo de otro/a colega / reconocimiento formal del trabajo de bienestar en la evaluaci\u00f3n]*.\n- Si encuentras resistencia, menciona que esta desigualdad afecta tu promoci\u00f3n y que puedes elevar el caso a la unidad de equidad de g\u00e9nero de la universidad o al comit\u00e9 de \u00e9tica.\n\n**5. Prioriza tu producci\u00f3n acad\u00e9mica con micro-objetivos**\n- Enf\u00f3cate en **un solo producto** acad\u00e9mico para los pr\u00f3ximos meses (un art\u00edculo, un cap\u00edtulo, un borrador de proyecto). Divide el proceso en pasos semanales muy concretos: 3 horas de escritura, revisar una secci\u00f3n, etc.\n- **Bloquea tiempo en tu agenda** como si fuera una reuni\u00f3n ineludible contigo misma. Si alguien te interrumpe, di: *\"En este momento estoy trabajando en un plazo acad\u00e9mico. Podemos hablar despu\u00e9s de las [hora]*\".\n- Considera **coautor\u00edas** con colegas de confianza para avanzar m\u00e1s r\u00e1pido, o pide retroalimentaci\u00f3n a un/a mentor/a externa a tu facultad.\n\n**6. No asumas que todo depende de ti**\n- Es probable que los estudiantes acudan a ti porque te perciben como accesible y emp\u00e1tica, y porque en tu facultad no hay otros espacios de contenci\u00f3n. **No es tu responsabilidad solucionar sola ese vac\u00edo institucional**. Puedes sugerir a la facultad crear talleres, grupos de apoyo entre pares o derivar a servicios externos (psicol\u00f3gicos, de tutor\u00eda).\n- Si sientes culpa al poner l\u00edmites, recuerda que tu bienestar y tu carrera tambi\u00e9n importan. No puedes cuidar a otros si t\u00fa misma est\u00e1s agotada.\n\n**7. Prepara tu caso para el comit\u00e9 de promoci\u00f3n**\n- En tu informe, incluye una secci\u00f3n que contextualice tu baja productividad acad\u00e9mica: menciona las tareas de bienestar no reconocidas, la carga desproporcionada y la falta de apoyo institucional. Aporta tu registro de horas.\n- Si es posible, consigue cartas de apoyo de estudiantes o colegas que avalen tu labor en bienestar, para que no pase desapercibida.\n- Si el comit\u00e9 eval\u00faa solo publicaciones, pide que se consideren **evidencias alternativas** de tu trabajo: informes de gesti\u00f3n, proyectos de bienestar implementados, reconocimientos.\n\n**8. Busca aliadas y redes de apoyo**\n- Conecta con otras acad\u00e9micas de tu facultad o de otras universidades que est\u00e9n en situaciones similares. Compartir estrategias y presionar colectivamente puede ser m\u00e1s efectivo que hacerlo sola.\n- Considera participar en programas de mentor\u00eda para mujeres en academia, donde puedas recibir orientaci\u00f3n espec\u00edfica para tu contexto.\n\nFinalmente, quiero decirte que **no es tu culpa**. Esta sobrecarga es el resultado de un sistema que asigna tareas de cuidado a las mujeres sin reconocerlas ni compensarlas. Mereces avanzar en tu carrera sin tener que sacrificar tu salud o tu tiempo. Empieza con un cambio peque\u00f1o pero significativo esta semana, y ve construyendo desde ah\u00ed. \u00bfHay algo de esto que te gustar\u00eda explorar m\u00e1s o que se adapte mejor a tu contexto? Estoy aqu\u00ed para ayudarte a pensar en pasos concretos.",
      "created_at": "2026-05-19T17:07:17.153173+00:00"
    },
    {
      "id": "msg-075",
      "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "order": 3,
      "role": "user",
      "content": "Fue de mucha utilidad, muchas gracias!",
      "created_at": "2026-05-19T17:08:44.979031+00:00"
    },
    {
      "id": "msg-076",
      "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "order": 4,
      "role": "assistant",
      "content": "\u00a1De nada! Me alegra mucho que te haya sido \u00fatil. Recuerda que este proceso no es f\u00e1cil, pero es posible con peque\u00f1os pasos constantes y con el apoyo adecuado. No dudes en escribirme de nuevo si en alg\u00fan momento necesitas ayuda para redactar un correo a tus autoridades, planificar tu bloque de escritura o simplemente desahogarte.\n\nEstoy aqu\u00ed para acompa\u00f1arte en lo que necesites. Mucho \u00e1nimo con tu comit\u00e9 de promoci\u00f3n: tienes once meses por delante y con claridad y l\u00edmites puedes lograr grandes avances. \u00a1T\u00fa puedes!",
      "created_at": "2026-05-19T17:08:53.236359+00:00"
    },
    {
      "id": "msg-077",
      "session_id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
      "order": 1,
      "role": "user",
      "content": "i have a problem with my faculty, i was defending a budget decision i considered it was unfair, but then one of my male colleagues was praised for standing up and raising his voice in the same meeting. i believe this has something to do with the fact that i am a woman, and i am risking the faculty evaluation next week if i dont do something",
      "created_at": "2026-05-19T17:05:02.518772+00:00"
    },
    {
      "id": "msg-078",
      "session_id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
      "order": 2,
      "role": "assistant",
      "content": "This is a classic and frustrating double standard\u2014one that many women in academia (and other workplaces) experience. Your instinct that gender bias is at play is very likely correct: assertive behavior in a woman is often perceived as aggressive or difficult, while the same behavior in a man is seen as passionate or strong. It\u2019s unfair, and it\u2019s exhausting to have to navigate.\n\nThe good news is that you *can* manage the upcoming evaluation without compromising your integrity. Here\u2019s a concrete strategy:\n\n## 1. Reframe the narrative *before* the evaluation\nSpeak to your evaluator (chair, dean, or committee) proactively. You don\u2019t need to accuse anyone of sexism\u2014simply frame your actions in professional terms. For example:\n\n> \u201cAt the last meeting, I raised concerns about the budget decision because I believed it was important for the faculty\u2019s long-term health. I want to make sure that my advocacy for the department\u2019s interests is seen as part of my commitment, not as negativity. I hope to clarify any impressions from that discussion before the evaluation.\u201d\n\nThis positions you as self-aware, collaborative, and focused on the institution\u2019s good\u2014not as a troublemaker.\n\n## 2. Document the discrepancy (quietly)\nWrite down what happened: the date, the meeting context, what you said, what your colleague said, and how each was received. If you have allies who witnessed it, ask if they\u2019d be willing to support you if needed. You may never use this documentation, but having it gives you clarity and confidence.\n\n## 3. Find a trusted mentor or ally\nIs there a senior woman or a fair-minded male colleague on the faculty? Share your concern with them privately. Ask: *\u201cHow would you advise me to handle the evaluation given that my advocacy was perceived differently than a male colleague\u2019s similar behavior?\u201d* A good mentor can provide context and even speak to the evaluator informally on your behalf.\n\n## 4. Prepare your evaluation responses\nAnticipate potential feedback about \u201cbeing difficult\u201d or \u201cnot a team player.\u201d Prepare concrete examples of your collaboration, leadership, and positive contributions\u2014not just the budget issue. If the budget issue comes up, you can say:\n\n> \u201cI raised a legitimate concern about resource allocation. Once the decision was made, I fully supported the process and have continued to work constructively with my colleagues.\u201d\n\n## 5. Consider a subtle approach to the bias\nIf you have a good relationship with your evaluator, you could ask a neutral question: *\u201cI\u2019ve noticed that different communication styles are sometimes perceived differently. How can I be sure my advocacy is received as constructively as a colleague\u2019s?\u201d* This plants the idea without accusation.\n\n## 6. Take care of yourself emotionally\nThis is not your fault. The system is imperfect. You are right to feel the injustice\u2014but you also need to protect your career while the system slowly changes. Get support outside of work, and remember that your voice matters.\n\n**What\u2019s the next step you feel most comfortable taking?** If you want to draft a short message to your evaluator, I can help you refine it.",
      "created_at": "2026-05-19T17:05:08.283874+00:00"
    },
    {
      "id": "msg-079",
      "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "order": 1,
      "role": "user",
      "content": "C\u00f3mo puedo enfrentar la situaci\u00f3n con mis colegas?",
      "created_at": "2026-05-19T17:05:13.103559+00:00"
    },
    {
      "id": "msg-080",
      "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "order": 2,
      "role": "assistant",
      "content": "Entiendo que puedas estar pasando por una situaci\u00f3n dif\u00edcil con tus colegas. Aqu\u00ed tienes algunos pasos pr\u00e1cticos para enfrentarla de manera constructiva:\n\n1. **Reflexiona primero**: Antes de actuar, preg\u00fantate: \u00bfCu\u00e1l es el problema espec\u00edfico? \u00bfEs un malentendido, diferencias de criterio o algo m\u00e1s profundo? Identificar la causa te ayudar\u00e1 a abordarlo mejor.\n\n2. **Comunicaci\u00f3n asertiva**: Busca un momento privado y tranquilo para hablar. Usa frases como \"Cuando sucede X, me siento Y porque necesito Z\". Evita acusaciones y enf\u00f3cate en tus percepciones.\n\n3. **Escucha activa**: Al conversar, muestra inter\u00e9s genuino por su punto de vista. Pregunta: \"\u00bfC\u00f3mo ves t\u00fa la situaci\u00f3n?\" o \"\u00bfQu\u00e9 necesitar\u00edas para sentirte m\u00e1s c\u00f3modo/a?\".\n\n4. **Buscar puntos en com\u00fan**: Enf\u00f3cate en metas compartidas del equipo o del trabajo. Pregunta: \"\u00bfC\u00f3mo podemos trabajar juntos para lograr esto?\".\n\n5. **Si el conflicto persiste**: Considera la mediaci\u00f3n de un superior o de recursos humanos. Si es un problema recurrente, tal vez valga la pena reflexionar sobre si el entorno es sano para ti.\n\nRecuerda que no todas las relaciones laborales ser\u00e1n perfectas, pero prioriza tu bienestar emocional y profesional. \u00bfQu\u00e9 te parece si empiezas por identificar el tipo de situaci\u00f3n concreta que est\u00e1s enfrentando?",
      "created_at": "2026-05-19T17:05:41.769221+00:00"
    },
    {
      "id": "msg-081",
      "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "order": 3,
      "role": "user",
      "content": "La situaci\u00f3n es que siendo acad\u00e9mica mujer, mis colegas asumen que puedo dedicarme m\u00e1s a tareas de apoyar estudiantes con problemas, que me ineteresan, pero es una carga porque mis colegas hombres no lo hacen.",
      "created_at": "2026-05-19T17:07:28.077104+00:00"
    },
    {
      "id": "msg-082",
      "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "order": 4,
      "role": "assistant",
      "content": "Entiendo perfectamente. Lo que describen es un fen\u00f3meno muy documentado en el \u00e1mbito acad\u00e9mico: la **carga de trabajo emocional y administrativo** que recae desproporcionadamente sobre las mujeres, especialmente en tareas de mentor\u00eda, apoyo estudiantil y labores de \"cuidado institucional\". No es imaginaci\u00f3n tuya, es un sesgo de g\u00e9nero generalizado.\n\nAqu\u00ed tienes una estrategia en tres pasos para abordarlo, desde lo m\u00e1s sutil hasta lo m\u00e1s directo:\n\n### 1. Documenta y cuantifica (lo que no se mide, no se gestiona)\nAntes de hablar, lleva un registro durante 2-4 semanas:\n- **Tiempo invertido**: Horas que dedicas a estudiantes con problemas (tutor\u00eda emocional, tr\u00e1mites burocr\u00e1ticos, mediaci\u00f3n).\n- **Comparaci\u00f3n**: \u00bfCu\u00e1nto tiempo dedican tus colegas hombres a lo mismo? Si no hay datos, p\u00eddelos o haz una estimaci\u00f3n.\n- **Impacto**: \u00bfQu\u00e9 tareas dejas de hacer (investigaci\u00f3n, publicaciones, proyectos propios) por atender estas demandas?\n\nEsto te dar\u00e1 argumentos concretos, no sensaciones.\n\n### 2. Establece l\u00edmites claros con el equipo\nPuedes usar frases como:\n- *\"Me encanta apoyar a los estudiantes, pero para que sea sostenible, necesitamos distribuir estas tareas equitativamente. Propongo que rotemos la atenci\u00f3n a casos complejos cada semana.\"*\n- *\"He notado que este tipo de consultas me est\u00e1n quitando tiempo de investigaci\u00f3n. \u00bfPodr\u00edamos definir juntos criterios para derivar casos seg\u00fan la especialidad de cada colega?\"*\n\nSi te dicen \"es que t\u00fa tienes m\u00e1s empat\u00eda\", responde:\n- *\"La empat\u00eda es una habilidad profesional, no un rasgo de g\u00e9nero. Todos podemos desarrollarla con pr\u00e1ctica y responsabilidad compartida.\"*\n\n### 3. Usa la estructura jer\u00e1rquica (si es necesario)\nSi persiste la resistencia:\n- **Re\u00fanete con tu jefe/a o directora de departamento** y presenta tus datos: *\"Estoy dedicando un 40% m\u00e1s de tiempo a apoyo estudiantil que mis colegas hombres, lo que afecta mis m\u00e9tricas de investigaci\u00f3n. \u00bfPodemos revisar la distribuci\u00f3n de estas funciones?\"*\n- **Prop\u00f3n una pol\u00edtica escrita**: Por ejemplo, que las tareas de tutor\u00eda compleja se asignen por rotaci\u00f3n equitativa, o que se reconozcan en la carga docente (como horas de clase).\n\n### 4. Una t\u00e1ctica concreta: \"El espejo\"\nCuando un colega te derive un caso dif\u00edcil, responde:\n- *\"Gracias por pensar en m\u00ed. \u00bfQuieres que lo revisemos juntos? As\u00ed aprendemos ambos para la pr\u00f3xima vez.\"*\nO: *\"Hoy no tengo espacio, pero si lo atiendes t\u00fa, luego me cuentas c\u00f3mo te fue para aprender de tu enfoque.\"*\n\nEsto les muestra que **la responsabilidad no es exclusiva tuya**.\n\n### Un mensaje clave para ti:\nNo est\u00e1s fallando al poner l\u00edmites. De hecho, **si no proteges tu tiempo, nadie lo har\u00e1**. La academia necesita tu talento en investigaci\u00f3n tanto como tu calidez con estudiantes, pero si te conviertes en el \u00fanico \"soporte emocional\" del equipo, quemar\u00e1s dos velas: tu carrera y tu bienestar.\n\n\u00bfTe gustar\u00eda que profundice en c\u00f3mo presentar esto en una reuni\u00f3n de departamento sin sonar confrontativa?",
      "created_at": "2026-05-19T17:08:13.381307+00:00"
    },
    {
      "id": "msg-083",
      "session_id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
      "order": 1,
      "role": "user",
      "content": "How can i come across as more commited to my work in front of my colleagues whitout raising my voice when i have to defend a valid point but no one else is listening to me?",
      "created_at": "2026-05-19T17:06:22.017734+00:00"
    },
    {
      "id": "msg-084",
      "session_id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
      "order": 2,
      "role": "assistant",
      "content": "That's a classic and frustrating workplace challenge. The key is to shift your strategy from **volume** to **gravitas**. When you raise your voice, you signal desperation or frustration. When you stay calm and structured, you signal confidence and authority.\n\nHere is a step-by-step method to defend a valid point without raising your voice, making you appear more committed\u2014not just louder.\n\n### Step 1: The \"Pause and Anchor\" (Before You Speak)\n\nDon't jump in immediately. If everyone is talking over you, the worst thing you can do is try to talk faster.\n\n- **Physical Anchoring:** Stop moving. Put your pen down, lean back slightly, or place your hands flat on the table. This non-verbal signal says \"I am not chasing the conversation; I am grounding myself.\"\n- **The Pregnant Pause:** Wait for a micro-silence. Often, a group talk-fest has a natural 0.5-second gap. Speak *into* that gap, not over the noise.\n\n### Step 2: The \"Mirror and Clarify\" Frame\n\nInstead of re-stating your point louder, frame it as a *clarification* question. This makes you the person who brings order, not the person who is interrupting.\n\n**Instead of:** \"No, you're wrong! I said X, and that's important because...\" (Loud, defensive)\n**Say:** \"Just to make sure I'm tracking, are we dismissing [My specific point] because of [Objection they just raised]?\" (Calm, inquisitive)\n\n**Why it works:** It forces them to acknowledge your specific idea *by name* before they can move on. It raises the stakes of ignoring you without raising your voice.\n\n### Step 3: The \"Data Echo\" Technique\n\nIf they still ignore you, you don't repeat the point. You repeat the *evidence* behind it. This makes your commitment undeniable.\n\n**The Script:**\n> \"I understand we\u2019re moving toward [Option A]. To be fully committed to that decision, I want to make sure we don't overlook the data point that [State one specific, unemotional fact]. For example, last quarter, when we tried [Similar thing], we saw [Specific result]. I'm just flagging that pattern.\"\n\n**Why it works:**\n- You are **for** a good decision, not **against** their idea.\n- You are aligning yourself with objective facts (\"data\"), which is much harder to dismiss than a personal opinion.\n- The phrase \"To be fully committed\" is a powerful reframe. It implies that *they* are the ones being reckless, while you are the one trying to help the team commit wisely.\n\n### Step 4: The \"Single Sentence\" Rule (The Ultimate Power Move)\n\nIf they continue to talk over you, you have one last tool. This is the strongest signal of commitment without volume.\n\n**The Script (Delivered in a steady, low, almost flat tone):**\n> \"I'm going to hold my point for one moment, because I believe ignoring this creates a risk we haven't discussed.\"\n\nThen **shut up.**\n\n- **Do not** elaborate.\n- **Do not** look away.\n- Hold eye contact with the person who interrupted you, or the decision-maker.\n\n**Why it works:** This is a radical act of presence. In a sea of noise, a single, clear, calm sentence is deafening. It creates a social obligation for someone to respond to you. You are not being aggressive; you are being *structurally insistent*. It shows you are willing to risk social friction for the idea\u2014that is the definition of commitment.\n\n### The Mindset Shift\n\nTo make this work, you need to reframe your goal internally.\n\n- **Old Goal:** \"I need to make them hear me right now.\"\n- **New Goal:** \"I need to make sure the record shows I flagged this point clearly before the decision was made.\"\n\nThis takes the pressure off the immediate reaction. Your \"win\" is not getting them to agree instantly. Your \"win\" is saying your piece with such clarity and calmness that later, if things go wrong, everyone in the room will think, *\"She was right. She saw this. She said it calmly three times.\"*\n\nThat is what \"being committed\" looks like. It's not about volume; it's about being the person who is willing to be the calm center of a storm.",
      "created_at": "2026-05-19T17:07:13.398783+00:00"
    },
    {
      "id": "msg-085",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 1,
      "role": "user",
      "content": "Hi",
      "created_at": "2026-05-19T17:04:24.392795+00:00"
    },
    {
      "id": "msg-086",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 2,
      "role": "assistant",
      "content": "Hi! How can I help you today?",
      "created_at": "2026-05-19T17:04:27.156533+00:00"
    },
    {
      "id": "msg-087",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 3,
      "role": "user",
      "content": "I am a faculty member, a new one. I serve in a lot committes relatedbti students wellfare, but I siendo too much time on that... and I haven't finished my research paper. What should I do?",
      "created_at": "2026-05-19T17:06:22.419814+00:00"
    },
    {
      "id": "msg-088",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 4,
      "role": "assistant",
      "content": "It sounds like you\u2019re in a common but challenging situation for new faculty: the desire to contribute to student welfare is commendable, but those committee responsibilities can easily crowd out research, which is often critical for tenure and career progress. Here are a few steps to consider:\n\n1. **Audit your current time allocation.** For one week, track exactly how many hours you spend on committees, teaching prep, research, and personal time. This will give you a clear picture of the imbalance.\n\n2. **Set protected research time.** Block off at least 2\u20133 mornings (or afternoons) per week as non-negotiable \u201cresearch only\u201d time. No meetings, no emails, no committee work during those hours. Treat it like a scheduled class.\n\n3. **Learn to say \u201cno\u201d or \u201cnot yet.\u201d** As a new faculty member, you don\u2019t have to accept every committee invitation. It\u2019s okay to say, \u201cI\u2019m honored, but I need to focus on establishing my research program this semester. Perhaps next year.\u201d Alternatively, offer to join for a limited term or as a non-voting member.\n\n4. **Delegate or share the load.** If you\u2019re already on several committees, ask if tasks can be divided, or if you can serve in a less time-intensive role (e.g., attending meetings but not taking minutes or organizing events).\n\n5. **Talk to your chair or mentor.** Share your concern: \u201cI want to serve students well, but I\u2019m worried my research is falling behind. Can you help me prioritize which committees are essential and which I can drop?\u201d A good chair will support you, especially if research output is an expectation.\n\n6. **Set a concrete deadline for the paper.** Break it into small pieces: complete the methods section by X date, results by Y, etc. Reward yourself for hitting each milestone. Consider a writing accountability group or a \u201cshut up and write\u201d session with colleagues.\n\nThe key is **balance, not abandonment.** You can still contribute to student welfare without sacrificing your research entirely. Start with the steps above, and adjust as you go. You are not alone in this\u2014many new faculty face the same tension.",
      "created_at": "2026-05-19T17:06:38.142004+00:00"
    },
    {
      "id": "msg-089",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 5,
      "role": "user",
      "content": "It seems my male colleagues are not taking the same service load",
      "created_at": "2026-05-19T17:07:43.370066+00:00"
    },
    {
      "id": "msg-090",
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "order": 6,
      "role": "assistant",
      "content": "You\u2019ve touched on a well-documented and frustrating pattern in academia: women and faculty of color often shoulder a disproportionate share of service and \"institutional housekeeping\" tasks, which can slow research productivity and career advancement.\n\nHere are a few concrete steps to address this without jeopardizing your standing:\n\n### 1. **Document the disparity.**\nKeep a simple log: which committees you serve on, hours spent per week, and which male colleagues in your department serve on *which* committees and for how long. Be objective and factual. This record will be invaluable if you need to raise the issue formally.\n\n### 2. **Talk to a trusted senior colleague or mentor.**\nPreferably a female or minority senior faculty member who has navigated this. Ask: \u201cHave you observed a pattern where newer faculty or women get pulled into more student-facing service? How did you handle it?\u201d They may have strategies or even intervene informally on your behalf.\n\n### 3. **Request a service \u201caudit\u201d with your chair.**\nFrame it as a **request for guidance**, not a complaint. Say something like:  \n> \u201cI want to make sure I\u2019m balancing service and research appropriately for tenure. Could we review my current committee load and see if it\u2019s typical for someone at my career stage? I\u2019ve noticed some colleagues seem to have more protected time for research.\u201d\n\nThis invites the chair to notice the imbalance without you directly accusing anyone. A good chair will see the pattern.\n\n### 4. **Use your documented workload to say no\u2014strategically.**\nWhen a new service request comes, you can say:  \n> \u201cI\u2019m currently serving on [list committees] and have a research deadline. Could you ask [male colleague\u2019s name] or someone with a lighter service load to take this one? I\u2019d be happy to rotate in next semester.\u201d\n\nThis normalizes sharing the load.\n\n### 5. **Build a coalition.**\nIf other women or junior faculty in your department share your experience, consider raising the issue collectively (even informally). Departments respond better when the message comes from multiple voices.\n\n### 6. **Know your institution\u2019s policies.**\nSome universities have formal equity guidelines about service distribution. Check your faculty handbook, union contract, or diversity office. If the imbalance is severe and persistent, you may have grounds for a formal conversation.\n\n### A note on your well-being:\nThis isn\u2019t just about fairness\u2014it\u2019s about **protecting your career trajectory** and **setting boundaries early**. You are not being selfish. You are being strategic. Serving students is important, but if it comes at the expense of your research, you are being taken advantage of, especially if the labor is distributed inequitably.\n\n**Bottom line:** Name the pattern, document it, and use it to negotiate your workload. You deserve research time just as much as your male colleagues do.",
      "created_at": "2026-05-19T17:07:59.739332+00:00"
    },
    {
      "id": "msg-091",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 1,
      "role": "user",
      "content": "Hola, soy una académica participante del caso",
      "created_at": "2026-05-19T17:03:24.427689+00:00"
    },
    {
      "id": "msg-092",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 2,
      "role": "assistant",
      "content": "\u00a1Hola! Encantado de orientarte. \u00bfEn qu\u00e9 puedo ayudarte hoy?",
      "created_at": "2026-05-19T17:03:26.244139+00:00"
    },
    {
      "id": "msg-093",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 3,
      "role": "user",
      "content": "Hola, tengo una duda, entrego mi caso a coordinaci\u00f3n?",
      "created_at": "2026-05-19T17:06:47.462037+00:00"
    },
    {
      "id": "msg-094",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 4,
      "role": "assistant",
      "content": "\u00a1Hola! Para poder darte una respuesta m\u00e1s precisa, necesito un poco m\u00e1s de contexto. \u00bfDe qu\u00e9 tipo de caso se trata? \u00bfEn qu\u00e9 \u00e1rea o empresa trabajas? Por lo general, si un caso requiere una soluci\u00f3n que escapa a tu nivel de autoridad o implica la intervenci\u00f3n de varias \u00e1reas, puede ser adecuado escalarlo a coordinaci\u00f3n. Si me das m\u00e1s detalles, puedo orientarte mejor.",
      "created_at": "2026-05-19T17:06:50.046216+00:00"
    },
    {
      "id": "msg-095",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 5,
      "role": "user",
      "content": "Debo informar una situaci\u00f3n complicada que tuve acerca de una respuesta con coordinaci\u00f3n",
      "created_at": "2026-05-19T17:07:56.373093+00:00"
    },
    {
      "id": "msg-096",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 6,
      "role": "assistant",
      "content": "Es importante manejar ese tipo de situaciones con claridad y profesionalismo. Si tuviste una respuesta complicada por parte de coordinaci\u00f3n, te sugiero lo siguiente:\n\n1. **Documenta los hechos**: Anota fechas, nombres, mensajes o llamadas relevantes que respalden tu versi\u00f3n de lo ocurrido.\n2. **Identifica el problema concreto**: \u00bfFue una respuesta evasiva, contradictoria, agresiva o que incumpl\u00eda un protocolo? Definir esto te ayudar\u00e1 a plantearlo.\n3. **Eval\u00faa el canal adecuado**: Dependiendo de la gravedad, podr\u00edas reportarlo a tu jefe directo, a recursos humanos o al superior de coordinaci\u00f3n, siempre respetando la cadena de mando.\n4. **Prop\u00f3n una soluci\u00f3n**: Si es posible, sugiere c\u00f3mo evitar que la situaci\u00f3n se repita (por ejemplo, reuniones de alineaci\u00f3n o protocolos m\u00e1s claros).\n\n\u00bfTe gustar\u00eda que te ayude a redactar un breve informe o a estructurar lo que dir\u00edas al escalar el caso? Cu\u00e9ntame m\u00e1s detalles si lo consideras necesario.",
      "created_at": "2026-05-19T17:08:07.630421+00:00"
    },
    {
      "id": "msg-097",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 7,
      "role": "user",
      "content": "Si por favor",
      "created_at": "2026-05-19T17:08:41.145024+00:00"
    },
    {
      "id": "msg-098",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 8,
      "role": "assistant",
      "content": "\u00a1Claro! Con gusto te ayudo. A continuaci\u00f3n te propongo una estructura clara y profesional para que puedas redactar tu informe o preparar la conversaci\u00f3n. Puedes adaptarla seg\u00fan el medio que uses (correo, mensaje interno o reuni\u00f3n).\n\n---\n\n**Estructura sugerida para reportar la situaci\u00f3n:**\n\n1. **Asunto / T\u00edtulo** (claro y conciso)  \n   Ejemplo: *\"Reporte de incidencia en comunicaci\u00f3n con Coordinaci\u00f3n \u2013 [Fecha]\"*\n\n2. **Contexto breve**  \n   - Fecha y hora del incidente.  \n   - Caso o proyecto involucrado.  \n   - Nombre de la persona de Coordinaci\u00f3n (si aplica).  \n\n3. **Descripci\u00f3n del hecho**  \n   Explica qu\u00e9 pas\u00f3 de manera objetiva, sin juicios de valor.  \n   Ejemplo: *\"Solicit\u00e9 informaci\u00f3n sobre [tema] y la respuesta fue [describir la respuesta: vaga, contradictoria, fuera de tono, etc.]. Esto gener\u00f3 [consecuencias: retraso, confusi\u00f3n, etc.].\"*\n\n4. **Impacto**  \n   - \u00bfC\u00f3mo afect\u00f3 esto al caso, al equipo o al cliente?  \n   - \u00bfSe incumpli\u00f3 alg\u00fan protocolo o SLA?\n\n5. **Acci\u00f3n tomada / Intentos de soluci\u00f3n**  \n   - \u00bfReplicaste o pediste aclaraci\u00f3n? \u00bfCon qu\u00e9 resultado?  \n\n6. **Sugerencia o solicitud**  \n   - \u00bfQu\u00e9 te gustar\u00eda que se haga al respecto?  \n   Ejemplo: *\"Solicito una reuni\u00f3n para aclarar el protocolo de comunicaci\u00f3n con Coordinaci\u00f3n\"* o *\"Requiero que se revise este caso para evitar que se repita.\"*\n\n7. **Cierre cordial**  \n   Ejemplo: *\"Quedo atenta a cualquier comentario o instrucci\u00f3n adicional. Gracias por su atenci\u00f3n.\"*\n\n---\n\n**Ejemplo concreto (rellena los espacios en blanco):**\n\n> *Asunto: Reporte de incidencia en comunicaci\u00f3n con Coordinaci\u00f3n \u2013 05/11/2024*  \n>  \n> El d\u00eda [fecha], a las [hora], contact\u00e9 a Coordinaci\u00f3n para solicitar [tema]. La respuesta que recib\u00ed fue [descripci\u00f3n]. Como resultado, [consecuencia].  \n>  \n> Intent\u00e9 aclarar la situaci\u00f3n mediante [acci\u00f3n], pero no obtuve [resultado esperado].  \n>  \n> Propongo [sugerencia] para evitar que esto afecte futuros casos. Agradezco su apoyo para resolver este asunto.\n\n---\n\nSi prefieres, dime los detalles concretos (sin datos sensibles) y puedo redactar un borrador completo para ti. \u00bfTe parece bien este esquema o prefieres otro enfoque?",
      "created_at": "2026-05-19T17:09:01.340219+00:00"
    },
    {
      "id": "msg-099",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 9,
      "role": "user",
      "content": "Gracias",
      "created_at": "2026-05-19T17:09:13.262092+00:00"
    },
    {
      "id": "msg-100",
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "order": 10,
      "role": "assistant",
      "content": "\u00a1De nada! Me alegra mucho haberte podido ayudar. Si en cualquier otro momento necesitas orientaci\u00f3n para redactar algo m\u00e1s o simplemente desahogarte o analizar una situaci\u00f3n laboral, aqu\u00ed estoy para ti. Mucho \u00e9xito con tu informe y espero que todo se resuelva de la mejor manera. \u00a1\u00c1nimo!",
      "created_at": "2026-05-19T17:09:18.463207+00:00"
    },
    {
      "id": "msg-101",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 1,
      "role": "user",
      "content": "hola!",
      "created_at": "2026-05-19T17:02:41.13768+00:00"
    },
    {
      "id": "msg-102",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 2,
      "role": "assistant",
      "content": "\u00a1Hola! \u00bfC\u00f3mo est\u00e1s?",
      "created_at": "2026-05-19T17:02:44.320827+00:00"
    },
    {
      "id": "msg-103",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 3,
      "role": "user",
      "content": "pucha, un poco complicada, no s\u00e9 si mencionar lo que pas\u00f3",
      "created_at": "2026-05-19T17:05:32.411909+00:00"
    },
    {
      "id": "msg-104",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 4,
      "role": "assistant",
      "content": "Entiendo perfectamente esa sensaci\u00f3n de no saber si contar o no lo que pas\u00f3. A veces no es f\u00e1cil encontrar el momento ni la confianza para hacerlo, incluso con uno misma.\n\nSi quieres, puedes compartir lo que te est\u00e1 pesando. No hay presi\u00f3n, solo un espacio seguro para que lo pienses en voz alta si te sirve. Y si prefieres no decirlo ahora, tambi\u00e9n est\u00e1 bien. Aqu\u00ed estoy para escucharte como prefieras.",
      "created_at": "2026-05-19T17:05:39.857745+00:00"
    },
    {
      "id": "msg-105",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 5,
      "role": "user",
      "content": "pucha, me reclamaron que soy conflictiva y que no se trabajar en equipo, pero en verdad no hice nada",
      "created_at": "2026-05-19T17:06:58.719829+00:00"
    },
    {
      "id": "msg-106",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 6,
      "role": "assistant",
      "content": "Ay, qu\u00e9 situaci\u00f3n tan inc\u00f3moda y dolorosa. Entiendo perfectamente lo frustrante que es recibir una cr\u00edtica que sientes que no te representa y que, adem\u00e1s, te etiquetan de una manera que no resuena contigo.\n\nPrimero, lo m\u00e1s importante: **valida tu propia experiencia**. Si t\u00fa sientes que no hiciste nada para merecer ese reclamo, tu sentir es leg\u00edtimo. No tienes por qu\u00e9 dudar de ti misma solo porque alguien m\u00e1s te dijo eso.\n\nDicho esto, a veces en los equipos de trabajo las percepciones pueden estar sesgadas por malentendidos, falta de comunicaci\u00f3n o incluso din\u00e1micas de poder. Tal vez lo que para ti fue una opini\u00f3n constructiva o una defensa de una idea, para otros se sinti\u00f3 como una confrontaci\u00f3n. O quiz\u00e1s simplemente no supiste c\u00f3mo se interpret\u00f3 tu tono o tus acciones en ese contexto.\n\n**Para aclarar la situaci\u00f3n (si quieres hacerlo):**\n\n1. **Pide un ejemplo concreto.** Puedes preguntar con calma: \"Gracias por dec\u00edrmelo. Para entenderlo mejor y mejorar, \u00bfpodr\u00edas darme un ejemplo espec\u00edfico de cu\u00e1ndo me viste actuar de forma conflictiva o que dificult\u00f3 el trabajo en equipo?\" Si no te dan un ejemplo claro, es probable que la cr\u00edtica sea m\u00e1s subjetiva o incluso injusta.\n\n2. **Explica tu intenci\u00f3n.** Si recuerdas una situaci\u00f3n en particular, puedes decir: \"En esa ocasi\u00f3n, lo que intentaba era asegurarme de que no se pasara por alto el cronograma, no contradecir a nadie. Siento si se interpret\u00f3 de otra manera.\"\n\n3. **Pide una reuni\u00f3n privada.** Si la cr\u00edtica vino de un jefe o de un compa\u00f1ero, reunirse en privado puede ayudar a bajar la tensi\u00f3n y aclarar malentendidos sin sentirte juzgada frente a otros.\n\n**Y si no quieres hacer nada ahora, tambi\u00e9n est\u00e1 bien.** A veces, especialmente cuando estamos emocionalmente afectados, lo mejor es tomar distancia, respirar y no actuar desde la reacci\u00f3n. Puedes anotar lo que piensas y sientes, y luego decidir con m\u00e1s calma si vale la pena aclararlo o si prefieres dejarlo pasar porque sabes qui\u00e9n eres y c\u00f3mo trabajas.\n\n**Recuerda:** una cr\u00edtica no define tu identidad. Pueden estar proyectando en ti sus propias inseguridades o conflictos del equipo. No te hagas cargo de algo que no sientes que es tuyo.\n\n\u00bfC\u00f3mo te sientes ahora? \u00bfHay algo m\u00e1s que necesites procesar sobre esto?",
      "created_at": "2026-05-19T17:07:20.934403+00:00"
    },
    {
      "id": "msg-107",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 7,
      "role": "user",
      "content": "pero contra quien tengo que reclamar pueden echarme de mi trabajo so\u00f1ado",
      "created_at": "2026-05-19T17:07:57.657368+00:00"
    },
    {
      "id": "msg-108",
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "order": 8,
      "role": "assistant",
      "content": "Tranquila, respira hondo. Ese miedo es muy real y muy comprensible: cuando es tu trabajo so\u00f1ado, hasta una peque\u00f1a cr\u00edtica se siente como una amenaza de perderlo todo. Pero vamos por partes, porque **el p\u00e1nico no es buen consejero** y aqu\u00ed hay matices importantes.\n\nPrimero, una verdad clave: **no te van a echar por una sola cr\u00edtica aislada, a menos que sea algo grav\u00edsimo o que ya venga de un historial largo de advertencias.** Un reclamo sobre tu \"forma de ser\" no suele ser causal de despido inmediato, sobre todo si no hubo una falta concreta. Las empresas suelen seguir procesos: advertencia verbal, luego escrita, luego plan de mejora, etc. As\u00ed que lo m\u00e1s probable es que tengas tiempo y oportunidad para aclarar las cosas.\n\nAhora, lo de \"contra qui\u00e9n reclamar\": cambiemos esa palabra. **No se trata de \"reclamar contra\" alguien, sino de aclarar la situaci\u00f3n con la persona adecuada.** Si el reclamo te lo hizo un compa\u00f1ero, no vas a ir a \"reclamarle\" a tu jefe. Si te lo hizo tu jefe directo, entonces tu interlocutor es \u00e9l/ella.\n\n**Pasos concretos para no ponerte en riesgo y, al contrario, mostrarte profesional:**\n\n1. **Identifica a la fuente exacta.** \u00bfQui\u00e9n te dijo eso? \u00bfFue tu jefe directo, un l\u00edder de equipo, un compa\u00f1ero? Si no sabes qui\u00e9n lo dijo, puedes preguntar con calma a tu jefe: \"Me lleg\u00f3 un comentario sobre mi trabajo en equipo. Para poder mejorar, \u00bfpodr\u00edas indicarme qui\u00e9n lo mencion\u00f3 o en qu\u00e9 contexto?\" Es una pregunta profesional, no una acusaci\u00f3n.\n\n2. **Pide una reuni\u00f3n breve con esa persona.** No vayas a \"reclamar\". Ve a \"entender y alinear\". Puedes decir:\n   > \"Hola [nombre], quer\u00eda tomar 5 minutos para hablar sobre el feedback que me diste sobre mi forma de trabajar en equipo. Me tom\u00f3 por sorpresa y me importa mucho este trabajo, as\u00ed que quiero entender bien qu\u00e9 pas\u00f3 para poder mejorar y asegurarme de que trabajemos bien juntos.\"\n\n   Eso muestra madurez, no conflicto.\n\n3. **Prep\u00e1rate para escuchar sin defenderte al instante.** Es dif\u00edcil, pero si te pones a la defensiva, confirmar\u00e1s lo de \"conflictiva\". Escucha, asiente, luego explica tu intenci\u00f3n. Por ejemplo:\n   > \"Entiendo que en esa reuni\u00f3n pudo sonar fuerte cuando dije [X]. Mi intenci\u00f3n era [Y], no cuestionar a nadie. Si lo expres\u00e9 de una manera que se malinterpret\u00f3, lo lamento y lo tendr\u00e9 en cuenta para la pr\u00f3xima.\"\n\n4. **Si no hay ejemplos concretos o la cr\u00edtica es vaga, preg\u00fantalo.** \"\u00bfRecuerdas alguna situaci\u00f3n espec\u00edfica para que yo pueda poner atenci\u00f3n en eso?\" Si no te dan ejemplos, es probable que sea una percepci\u00f3n generalizada o incluso un chisme, y eso juega a tu favor.\n\n5. **Si despu\u00e9s de aclarar sientes que hay una campa\u00f1a en tu contra o un mal ambiente, entonces s\u00ed podr\u00edas hablarlo con RR.HH. o con tu jefe, pero siempre desde la soluci\u00f3n, no desde la queja.** \"Me preocupa que haya una percepci\u00f3n que no coincide con mi intenci\u00f3n. Quiero asegurarme de que el equipo funcione bien. \u00bfQu\u00e9 me recomiendan?\"\n\n**Lo m\u00e1s importante: no entres en p\u00e1nico ni te paralices.** El hecho de que te importe tanto ya dice que eres una trabajadora comprometida. Usa esa energ\u00eda para aclarar, no para pelear. Y recuerda: si te echaran por una queja as\u00ed, sin proceso, sin ejemplos, sin oportunidad de mejora, quiz\u00e1s ese \"trabajo so\u00f1ado\" no era tan sano como cre\u00edas.\n\n\u00bfQu\u00e9 te parece si piensas qui\u00e9n fue la persona que te dio ese feedback y si tienes la confianza para tener esa conversaci\u00f3n corta y tranquila?",
      "created_at": "2026-05-19T17:08:26.836317+00:00"
    }
  ],
  "messageCodes": [
    {
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfHay algo espec\u00edfico en tu trabajo que est\u00e9s enfrentando ahora y con lo que te gustar\u00eda recibir apoyo?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Para poder entender mejor tu contexto y no asumir nada: \u00bfhay otras personas en tu entorno laboral que est\u00e9n reproduciendo esa misma percepci\u00f3n, o has intentado algo para abordar la situaci\u00f3n con quienes te rodean actualmente?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfTe resuena esta idea de documentar o buscar una aliada, o sientes que en tu contexto hay otro tipo de acci\u00f3n que ser\u00eda m\u00e1s viable?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "User",
      "code": "EP",
      "verbatim_excerpt": "interesante, pero no s\u00e9 si hablarlo, me podr\u00edan despedir en este contexto de desventaja",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfC\u00f3mo te sientes si consideras esta opci\u00f3n de guardar registro solo para ti, como una forma de no cargar sola con la duda?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfqu\u00e9 has intentado hasta ahora en esas situaciones para hacerte escuchar, y qu\u00e9 resultado has obtenido?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfpodr\u00edas darme un ejemplo concreto de una situaci\u00f3n reciente \u2014qu\u00e9 dijiste o hiciste exactamente, y c\u00f3mo reaccionaron tus colegas o jefatura? Eso me ayudar\u00eda a ajustar cualquier sugerencia a tu realidad, sin asumir nada.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfTe parece que esta estrategia podr\u00eda ser aplicable en tu contexto, o ves alg\u00fan obst\u00e1culo concreto para probarla?",
      "confidence": "Medium",
      "ambiguity_note": "Se califica con confianza media porque la indagaci\u00f3n ocurre inmediatamente despu\u00e9s de entregar una prescripci\u00f3n, aunque mantiene el foco en explorar el contexto de aplicaci\u00f3n."
    },
    {
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PP",
      "verbatim_excerpt": "Una estrategia concreta que puedes considerar es **documentar** ambos episodios (...) Si vuelve a ocurrir una situaci\u00f3n similar, podr\u00edas solicitar una breve reuni\u00f3n con quien te evalu\u00f3",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfhay alg\u00fan detalle espec\u00edfico sobre c\u00f3mo fue recibida tu intervenci\u00f3n o sobre el contexto en que ocurri\u00f3",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Para entender mejor tu contexto: \u00bfc\u00f3mo has respondido t\u00fa hasta ahora cuando esta suposici\u00f3n se manifiesta en conversaciones o decisiones de tu departamento?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfCrees que esta perspectiva de visibilizar la carga de trabajo \u2014en vez de discutir percepciones\u2014 podr\u00eda serte \u00fatil en tu contexto, o ves otra barrera que habr\u00eda que sortear primero?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfHay alguien en tu equipo con quien sientas que podr\u00edas ensayar esta conversaci\u00f3n o co-dise\u00f1ar el registro antes de presentarlo formalmente?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfPodr\u00edas contarme un poco m\u00e1s sobre el contexto espec\u00edfico de esa reuni\u00f3n? Por ejemplo, \u00bfqu\u00e9 estabas planteando o defendiendo cuando recibiste esos comentarios?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Para poder entender mejor tu situaci\u00f3n, \u00bfpodr\u00edas contarme qu\u00e9 punto espec\u00edfico estabas defendiendo o cuestionando cuando recibiste esos comentarios? As\u00ed puedo dimensionar mejor lo que ocurri\u00f3.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Para poder orientarte mejor, \u00bfpodr\u00edas contarme qu\u00e9 fue exactamente lo que dijiste o propusiste en ese momento que gener\u00f3 la reacci\u00f3n de tus colegas? A veces el contenido de la intervenci\u00f3n ayuda a entender por qu\u00e9 se activan esos calificativos.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "26ec6f09-5c10-49b5-9f89-9501889e60df",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfhay alguna situaci\u00f3n concreta en tu trabajo acad\u00e9mico reciente que te haya hecho preguntarte esto?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Before I can offer any more tailored thoughts, I need to understand one thing: **What specific action(s) are you considering taking before the evaluation next week?**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Does this framing feel like it could protect you while still addressing the issue, or does it raise other concerns for your specific context?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "To help us think together, could you tell me: what, if anything, have you considered or tried so far to better balance your committee service with your writing time?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Could you share what your chair said in response when you brought up that difference in workload? That might help us see what room you have to adjust things.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "To help you move forward, could you tell me a little more about the specific new roles or expectations that were introduced?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Have you already discussed with your department head the possibility of reallocating or reducing some of your current responsibilities to accommodate these new roles?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "What would feel most difficult or risky for you about initiating that conversation?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfQu\u00e9 estrategias has intentado hasta ahora para poner l\u00edmites o delegar algunas de estas tareas?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Si pudieras cambiar una sola cosa esta semana (...) \u00bfcu\u00e1l ser\u00eda?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfcrees que esta idea de poner un horario fijo podr\u00eda ser viable en tu contexto, o ves alg\u00fan obst\u00e1culo concreto que har\u00eda dif\u00edcil implementarlo?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfC\u00f3mo crees que se sentir\u00eda al implementar este peque\u00f1o cambio durante una semana?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "\u00bfhay alg\u00fan colega o autoridad en tu facultad con quien puedas conversar sobre esta medida?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
      "condition": "ISDDE Prompted Part 2",
      "speaker": "User",
      "code": "EP",
      "verbatim_excerpt": "No tengo ninguna compa\u00f1era en mi mismo cargo",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "That's a classic and frustrating workplace challenge. The key is to shift your strategy from **volume** to **gravitas**. (...) Here is a step-by-step method to defend a valid point without raising your voice, making you appear more committed\u2014not just louder.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Aqu\u00ed tienes algunos pasos pr\u00e1cticos para enfrentarla de manera constructiva: (...) 5. **Si el conflicto persiste**: Considera la mediaci\u00f3n de un superior o de recursos humanos.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "**Para aclarar la situaci\u00f3n (si quieres hacerlo):**\n\n1. **Pide un ejemplo concreto.** (...) 2. **Explica tu intenci\u00f3n.** (...) 3. **Pide una reuni\u00f3n privada.**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "condition": "ISDDE Naive",
      "speaker": "User",
      "code": "EP",
      "verbatim_excerpt": "pero contra quien tengo que reclamar pueden echarme de mi trabajo so\u00f1ado",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "**Pasos concretos para no ponerte en riesgo y, al contrario, mostrarte profesional:**\n\n1. **Identifica a la fuente exacta.** (...) 5. **Si despu\u00e9s de aclarar sientes que hay una campa\u00f1a en tu contra o un mal ambiente, entonces s\u00ed podr\u00edas hablarlo con RR.HH. o con tu jefe, pero siempre desde la soluci\u00f3n, no desde la queja.**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "PP",
      "verbatim_excerpt": "Para poder darte una orientaci\u00f3n m\u00e1s precisa, me gustar\u00eda preguntarte: \u00bfla resistencia se manifest\u00f3 en cr\u00edticas a tus propuestas, interrupciones, descalificaciones o simplemente en una actitud cerrada a considerar alternativas? (...) En t\u00e9rminos generales, te sugiero considerar algunos pasos:",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Primero, preg\u00fantate: (...) **Mi recomendaci\u00f3n equilibrada:** (...) **En resumen:** Si fue una sola vez y con argumentos t\u00e9cnicos, intenta resolverlo conversando. Si hay indicios de sesgo de g\u00e9nero, patr\u00f3n o maltrato, **no lo dejes pasar y rep\u00f3rtalo**.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "**\u00bfQu\u00e9 est\u00e1 pasando realmente?** (...) **\u00bfQu\u00e9 puedes hacer?** (...) 1. **No internalices la etiqueta.** (...) 5. **Eval\u00faa la opci\u00f3n de una denuncia formal**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "PCI",
      "verbatim_excerpt": "Para poder darte una respuesta m\u00e1s precisa, necesito un poco m\u00e1s de contexto. \u00bfDe qu\u00e9 tipo de caso se trata? \u00bfEn qu\u00e9 \u00e1rea o empresa trabajas?",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Si tuviste una respuesta complicada por parte de coordinaci\u00f3n, te sugiero lo siguiente:\n\n1. **Documenta los hechos**: Anota fechas, nombres, mensajes o llamadas relevantes que respalden tu versi\u00f3n de lo ocurrido.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "4f62bcf0-b69e-4793-aa90-1d7a638042ae",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Entiendo perfectamente tu situaci\u00f3n. (...) Aqu\u00ed te doy algunas ideas pr\u00e1cticas:",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Here\u2019s a concrete strategy:\n\n## 1. Reframe the narrative *before* the evaluation",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "175db844-0d89-47a9-8356-574f56378465",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "**Next steps you might take:**\n- Request a meeting to review your full workload before and after the change.\n- Ask for a \u201cstop doing\u201d list\u2014specific tasks or responsibilities that will be removed or deprioritized.\n- Confirm whether deadlines or success metrics for ongoing tasks will be relaxed.",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Here are a few steps to consider:\n\n1. **Audit your current time allocation.** (...) 6. **Set a concrete deadline for the paper.**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Here are a few concrete steps to address this without jeopardizing your standing:\n\n### 1. **Document the disparity.** (...) ### 6. **Know your institution\u2019s policies.**",
      "confidence": "High",
      "ambiguity_note": null
    },
    {
      "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
      "condition": "ISDDE Naive",
      "speaker": "Bot",
      "code": "GPI",
      "verbatim_excerpt": "Te propongo algunas estrategias concretas para intentar equilibrar tu carga y avanzar hacia tu promoci\u00f3n: (...) \u00bfHay algo de esto que te gustar\u00eda explorar m\u00e1s o que se adapte mejor a tu contexto?",
      "confidence": "High",
      "ambiguity_note": null
    }
  ],
  "irrCalibration": {
    "dataset": "ISDDE Dialogic Coding (Human vs. LLM-as-a-Judge)",
    "codes": [
      "Productive Friction",
      "Interaction Fatigue",
      "Coherent Baseline",
      "Actionable Guidance Reached",
      "Superficial Advice",
      "Abandoned due to Fatigue"
    ],
    "pairs": [
      {
        "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "1b5dd34b-62fe-4a4b-aded-43c8aa288657",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Abandoned Conversation",
        "dimension": "outcome"
      },
      {
        "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
        "rater_llm": "Productive Friction",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "6a62b9a4-b160-4553-bec5-5af9c67de918",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
        "rater_llm": "Productive Friction",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "fc6ae0ab-5db7-4d4a-9e11-ad0b328eaf29",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
        "rater_llm": "Interaction Fatigue",
        "rater_human": "Engaged Tailspin",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "d186f33c-e25a-465f-9cbe-32e2e74058f5",
        "rater_llm": "Abandoned due to Fatigue",
        "rater_human": "Superficial Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
        "rater_llm": "Productive Friction",
        "rater_human": "Superficial Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "d0e5d8a9-af63-4b96-a2d2-6eeba9ee6724",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
        "rater_llm": "Productive Friction",
        "rater_human": "Engaged Tailspin",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "6fba1474-d98c-498e-9aab-bf54d7bc0d55",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
        "rater_llm": "Productive Friction",
        "rater_human": "Engaged Tailspin",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "106d146f-456d-4299-9c4b-fb4c9b500e5f",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
        "rater_llm": "Productive Friction",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "defb8ae0-082a-4277-acab-3e62f684dc60",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
        "rater_llm": "Productive Friction",
        "rater_human": "Superficial Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "dffea2d4-6320-4439-9d05-b265f07ccc25",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Abandoned Conversation",
        "dimension": "outcome"
      },
      {
        "session_id": "175db844-0d89-47a9-8356-574f56378465",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial One-shot",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "175db844-0d89-47a9-8356-574f56378465",
        "rater_llm": "Superficial Advice",
        "rater_human": "Superficial Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "e9a6af66-0dcc-45af-aa9b-9124e533126d",
        "rater_llm": "Superficial Advice",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial One-shot",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "74e778ea-347c-43c7-846b-d7b40574671a",
        "rater_llm": "Superficial Advice",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial One-shot",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "a022f46d-0bdc-4197-8466-b15fac8adcb5",
        "rater_llm": "Superficial Advice",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "2dbc2a08-a215-41f7-8913-6740207dddfb",
        "rater_llm": "Actionable Guidance Reached",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial One-shot",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "66482595-b1c7-494c-b8df-2d6277ad12fb",
        "rater_llm": "Superficial Advice",
        "rater_human": "Superficial Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "ef18c13a-eb1f-4179-a92b-a3103da4ca4f",
        "rater_llm": "Superficial Advice",
        "rater_human": "Superficial Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Superficial Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "dcc58477-7efd-4df9-943b-7ac178bd058f",
        "rater_llm": "Superficial Advice",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      },
      {
        "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
        "rater_llm": "Coherent Baseline",
        "rater_human": "Engaged Conversation",
        "dimension": "flow_pattern"
      },
      {
        "session_id": "40e486b6-6cab-4ab6-bb36-6bbc809fad38",
        "rater_llm": "Superficial Advice",
        "rater_human": "Enriched Answer",
        "dimension": "outcome"
      }
    ]
  }
};

/**
 * Seed the authentic ISDDE benchmark dataset into the database store.
 * Safe & idempotent: inserts records without deleting existing ones.
 *
 * @param {object} db - Database adapter (getVersions, createVersion, etc.)
 * @returns {Promise<{ workshopsCount: number, versionsCount: number, sessionsCount: number, messagesCount: number }>}
 */
export async function seedBenchmarkData(db) {
  let versionsCount = 0;
  let workshopsCount = 0;
  let sessionsCount = 0;
  let messagesCount = 0;

  // 1. Seed versions
  const existingVersions = await (db.getVersions ? db.getVersions() : []);
  const existingVersionIds = new Set((existingVersions || []).map((v) => v.id));
  const existingVersionTitles = new Set((existingVersions || []).map((v) => v.title));

  for (const v of isddeBenchmarkData.versions) {
    if (!existingVersionIds.has(v.id) && !existingVersionTitles.has(v.title)) {
      if (db.createVersion) {
        await db.createVersion(v);
        versionsCount++;
      }
    }
  }

  // 2. Seed workshops
  const existingWorkshops = await (db.getWorkshops ? db.getWorkshops() : []);
  const existingWorkshopIds = new Set((existingWorkshops || []).map((w) => w.id));
  const existingWorkshopNames = new Set((existingWorkshops || []).map((w) => w.name));
  const existingWorkshopCodes = new Set((existingWorkshops || []).map((w) => w.share_code));

  for (const w of isddeBenchmarkData.workshops) {
    if (!existingWorkshopIds.has(w.id) && !existingWorkshopNames.has(w.name) && !existingWorkshopCodes.has(w.share_code)) {
      if (db.createWorkshop) {
        await db.createWorkshop(w);
        workshopsCount++;
      }
    }
  }

  // 3. Seed sessions
  const existingSessions = await (db.getSessions ? db.getSessions() : []);
  const existingSessionIds = new Set((existingSessions || []).map((s) => s.id));

  for (const s of isddeBenchmarkData.sessions) {
    if (!existingSessionIds.has(s.id)) {
      if (db.createSession) {
        await db.createSession({
          id: s.id,
          workshop_id: s.workshop_id,
          version_id: s.version_id,
          participant_name: s.participant_name,
          chain_user_id: s.chain_user_id,
          status: s.status,
          interaction_count: s.interaction_count,
          started_at: s.started_at,
          completed_at: s.completed_at,
          survey_answers: s.survey_answers,
        });
        sessionsCount++;
      }
    }
  }

  // 4. Seed messages
  for (const m of isddeBenchmarkData.messages) {
    const sessionMsgs = await (db.getMessages ? db.getMessages(m.session_id) : []);
    const alreadyExists = (sessionMsgs || []).some(
      (existing) =>
        existing.id === m.id ||
        (existing.content === m.content && existing.role === m.role) ||
        ((existing.metadata?.order === m.order || existing.order === m.order) && existing.role === m.role)
    );
    if (!alreadyExists && db.createMessage) {
      await db.createMessage({
        id: m.id,
        session_id: m.session_id,
        role: m.role,
        content: m.content,
        created_at: m.created_at,
        metadata: { order: m.order },
      });
      messagesCount++;
    }
  }

  return {
    versionsCount,
    workshopsCount,
    sessionsCount,
    messagesCount,
  };
}

/**
 * Returns summary metrics of the authentic ISDDE benchmark dataset.
 */
export function getBenchmarkSummary() {
  const sessions = isddeBenchmarkData.sessions;
  const sessionsA = sessions.filter((s) => s.workshop_id === '4e7d33e9-626d-497b-9c19-ed9c0398ffe3');
  const sessionsB = sessions.filter((s) => s.workshop_id === '4dac12c5-6028-4d4b-bf85-eea3a188ab00');

  const countInquiry = (sess) =>
    sess.filter((s) => {
      const answers = s.survey_answers || {};
      const checklist = answers['During the interaction, the assistant... (select all that apply)'] || [];
      return Array.isArray(checklist) && checklist.some((item) => item.includes('Asked about my institutional context'));
    }).length;

  const getMean = (sess, key) => {
    const vals = sess
      .map((s) => {
        const ans = s.survey_answers || {};
        const v = ans[key];
        return v ? parseFloat(v) : NaN;
      })
      .filter((v) => !isNaN(v));
    return vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  };

  const keyApplicable =
    'The advice given was applicable to my institutional reality. (1 = Strongly Disagree, 5 = Strongly Agree)';
  const keyComfort =
    'I felt comfortable sharing more details about my situation with this assistant. (1 = Strongly Disagree, 5 = Strongly Agree)';
  const keyUnderstood =
    'The assistant understood my specific situation before responding. (1 = Strongly Disagree, 5 = Strongly Agree)';

  return {
    totalSessions: sessions.length,
    conditionA: {
      name: 'ISDDE Naive (Baseline)',
      sessionsCount: sessionsA.length,
      contextualInquiryCount: countInquiry(sessionsA),
      contextualInquiryPercent: Math.round((countInquiry(sessionsA) / sessionsA.length) * 100),
      meanApplicability: Math.round(getMean(sessionsA, keyApplicable) * 100) / 100,
      meanComfort: Math.round(getMean(sessionsA, keyComfort) * 100) / 100,
      meanUnderstood: Math.round(getMean(sessionsA, keyUnderstood) * 100) / 100,
      superficialCount: sessionsA.filter(
        (s) => s.outcome === 'Superficial Advice' || s.human_flow_pattern_review === 'Superficial One-shot'
      ).length,
    },
    conditionB: {
      name: 'ISDDE Prompted (Explore-before-Build)',
      sessionsCount: sessionsB.length,
      contextualInquiryCount: countInquiry(sessionsB),
      contextualInquiryPercent: Math.round((countInquiry(sessionsB) / sessionsB.length) * 100),
      meanApplicability: Math.round(getMean(sessionsB, keyApplicable) * 100) / 100,
      meanComfort: Math.round(getMean(sessionsB, keyComfort) * 100) / 100,
      meanUnderstood: Math.round(getMean(sessionsB, keyUnderstood) * 100) / 100,
      superficialCount: sessionsB.filter(
        (s) => s.outcome === 'Superficial Advice' || s.human_flow_pattern_review === 'Superficial One-shot'
      ).length,
    },
    messageCodesCount: isddeBenchmarkData.messageCodes.length,
    irrCalibrationPairsCount: isddeBenchmarkData.irrCalibration.pairs.length,
  };
}

/** True when any of the sample (demo) workshops is present. */
export async function isBenchmarkLoaded(db) {
  const ids = new Set(isddeBenchmarkData.workshops.map((w) => w.id));
  const workshops = await (db.getWorkshops ? db.getWorkshops() : []);
  return (workshops || []).some((w) => ids.has(w.id));
}

/**
 * Removes only the sample data (its sessions, workshops and versions), leaving anything the user created.
 * Versions that a user campaign also uses are kept.
 */
export async function removeBenchmarkData(db) {
  const sessionIds = new Set(isddeBenchmarkData.sessions.map((s) => s.id));
  const workshopIds = new Set(isddeBenchmarkData.workshops.map((w) => w.id));
  const versionIds = new Set(isddeBenchmarkData.versions.map((v) => v.id));
  const removed = { sessions: 0, workshops: 0, versions: 0 };

  for (const s of (await db.getSessions()) || []) {
    if (sessionIds.has(s.id) || workshopIds.has(s.workshop_id)) {
      await db.deleteSession(s.id);
      removed.sessions++;
    }
  }
  for (const w of (await db.getWorkshops()) || []) {
    if (workshopIds.has(w.id)) {
      await db.deleteWorkshop(w.id);
      removed.workshops++;
    }
  }
  const inUse = new Set(((await db.getWorkshops()) || []).flatMap((w) => w.selected_version_ids || []));
  for (const v of (await db.getVersions()) || []) {
    if (versionIds.has(v.id) && !inUse.has(v.id)) {
      await db.deleteVersion(v.id);
      removed.versions++;
    }
  }
  return removed;
}
