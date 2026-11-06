'use client';

import React, { useState } from 'react';
import BlueprintPanel from './panel';
import SplitButton from './split-button';
import Field from './field';
import Stepper from './stepper';
import LanguageSelector from './language-selector';
import Logo from '../brand';
import CadIcon from '../cad-icon';

const PHASES = [
  { id: 'start', label: 'Antes de empezar' },
  { id: 'how', label: 'Cómo funciona' },
];

const EXPERIENCE = [
  { id: 'baja', label: 'Poco' },
  { id: 'intermedia', label: 'Algo' },
  { id: 'alta', label: 'Mucho' },
];

/**
 * OnboardingStepper - short welcome for participants: who you are (required name), optional consent,
 * and a 3-line explanation of how the activity works. Calls onStartSession with the answers.
 */
export function OnboardingStepper({
  code,
  workshopName,
  chainOrder = 1,
  stepCount = 1,
  onboardingInstructions = null,
  consentRequired = false,
  consentUrl = null,
  initialName = '',
  joining = false,
  error = '',
  onStartSession,
}) {
  const consentKey = `ps_consent:${consentUrl || 'default'}`;
  const [phase, setPhase] = useState(0);
  const [participantName, setParticipantName] = useState(initialName || '');
  const [nameError, setNameError] = useState('');
  const [consented, setConsented] = useState(() => {
    try {
      return typeof window !== 'undefined' && localStorage.getItem(consentKey) === 'accepted';
    } catch {
      return false;
    }
  });
  const [consentError, setConsentError] = useState('');
  const [experience, setExperience] = useState('');

  const goNext = () => {
    let ok = true;
    if (!participantName.trim()) {
      setNameError('Escribe tu nombre o un seudónimo para continuar.');
      ok = false;
    }
    if (consentRequired && !consented) {
      setConsentError('Para participar necesitas aceptar el consentimiento.');
      ok = false;
    }
    if (ok) setPhase(1);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (consentRequired) {
      try {
        localStorage.setItem(consentKey, 'accepted');
      } catch {
        // storage unavailable: the consent is still recorded with the session
      }
    }
    onStartSession?.({
      participantName: participantName.trim(),
      onboardingAnswers: {
        ...(experience ? { prior_ai_experience: experience } : {}),
        ...(consentRequired ? { consent_accepted: true, consent_url: consentUrl, consent_at: new Date().toISOString() } : {}),
        oriented_at: new Date().toISOString(),
      },
    });
  };

  const title = workshopName || `Actividad ${code}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 md:py-10">
      <div className="flex items-center justify-between gap-3 mb-6">
        <Logo />
        <LanguageSelector compact={true} />
      </div>

      <BlueprintPanel
        title={title}
        subtitle={stepCount > 1 ? `Parte ${chainOrder} de ${stepCount}` : 'Te tomará unos minutos.'}
        headingLevel={2}
      >
        <Stepper steps={PHASES} current={phase} label="Pasos para comenzar" className="mb-6" />

        {error && (
          <div role="alert" className="mb-5 p-3 border-2 border-vermilion-ink bg-vermilion-tint font-body text-sm text-vermilion-ink flex items-center gap-2">
            <CadIcon name="AlertTriangle" size={16} />
            <span>{error}</span>
          </div>
        )}

        {phase === 0 && (
          <div className="space-y-5">
            {onboardingInstructions && (
              <p className="font-body text-base text-ink leading-relaxed m-0 whitespace-pre-line p-4 bg-paper-subtle border-l-4 border-cobalt">
                {onboardingInstructions}
              </p>
            )}

            <Field
              label="Tu nombre o seudónimo"
              required={true}
              error={nameError}
              help="Puedes usar un seudónimo. Lo usamos para unir tus respuestas si la actividad tiene más de una parte."
            >
              <input
                type="text"
                value={participantName}
                onChange={(e) => {
                  setParticipantName(e.target.value);
                  if (nameError) setNameError('');
                }}
                autoComplete="nickname"
                autoFocus
                className="ps-field__control w-full font-body text-base text-ink bg-paper border-2 border-line-strong px-3 py-2"
              />
            </Field>

            {consentRequired && (
              <div className={`p-4 border-2 ${consentError ? 'border-vermilion-ink bg-vermilion-tint' : 'border-line-control bg-paper-subtle'}`}>
                <label className="flex items-start gap-3 font-body text-sm text-ink cursor-pointer min-h-[44px]">
                  <input
                    type="checkbox"
                    checked={consented}
                    onChange={(e) => {
                      setConsented(e.target.checked);
                      if (consentError) setConsentError('');
                    }}
                    className="w-5 h-5 mt-0.5 accent-cobalt shrink-0"
                  />
                  <span>
                    He leído y acepto el consentimiento informado
                    {consentUrl && (
                      <>
                        {' ('}
                        <a href={consentUrl} target="_blank" rel="noopener noreferrer" className="text-cobalt font-semibold underline">
                          leer documento
                        </a>
                        {')'}
                      </>
                    )}
                    .
                  </span>
                </label>
                {consentError && <p role="alert" className="font-body text-sm text-vermilion-ink m-0 mt-2">{consentError}</p>}
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-line-control">
              <SplitButton variant="primary" iconBox="ArrowRight" onClick={goNext} type="button">
                Continuar
              </SplitButton>
            </div>
          </div>
        )}

        {phase === 1 && (
          <form onSubmit={handleSubmit} className="space-y-5">
            <ol className="list-none m-0 p-0 space-y-3">
              {[
                ['FileText', 'Lee el caso', 'Está a un lado de la pantalla (en el celular, en la pestaña “Ver caso”).'],
                ['MessageSquare', 'Conversa con el asistente', 'Escribe con tus propias palabras. Enter envía; Shift + Enter hace un salto de línea.'],
                ['CheckSquare', 'Termina y responde unas preguntas', 'Cuando quieras cerrar, usa el botón “Terminar conversación”.'],
              ].map(([icon, head, body], i) => (
                <li key={head} className="flex gap-3 p-3 bg-paper-subtle border border-line-control">
                  <span className="ps-step__dot shrink-0">{i + 1}</span>
                  <div>
                    <p className="font-body text-base font-semibold text-ink m-0 flex items-center gap-2"><CadIcon name={icon} size={16} />{head}</p>
                    <p className="font-body text-sm text-ink-2 m-0 mt-0.5">{body}</p>
                  </div>
                </li>
              ))}
            </ol>

            <fieldset className="m-0 p-0 border-0">
              <legend className="font-body text-sm font-semibold text-ink mb-2">¿Cuánto has usado asistentes de IA antes? (opcional)</legend>
              <div className="grid grid-cols-3 gap-2">
                {EXPERIENCE.map((opt) => (
                  <label
                    key={opt.id}
                    className={`min-h-[44px] px-3 py-2 border font-body text-sm flex items-center justify-center gap-2 cursor-pointer ${
                      experience === opt.id ? 'bg-cobalt-tint border-cobalt text-cobalt font-semibold' : 'bg-paper border-line-control text-ink'
                    }`}
                  >
                    <input type="radio" name="prior_experience" value={opt.id} checked={experience === opt.id} onChange={(e) => setExperience(e.target.value)} className="sr-only" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </fieldset>

            <p className="font-body text-sm text-ink-2 m-0 border-l-2 border-cobalt pl-3">
              Guardamos el texto de la conversación, los tiempos y tus respuestas. No escribas datos personales de otras personas.
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-line-control">
              <button
                type="button"
                onClick={() => setPhase(0)}
                className="min-h-[44px] px-4 py-2 border border-line-control bg-paper hover:bg-paper-subtle font-body text-sm text-ink inline-flex items-center gap-2"
              >
                <CadIcon name="ArrowLeft" size={14} />
                <span>Volver</span>
              </button>
              <SplitButton type="submit" variant="primary" iconBox="Play" loading={joining}>
                Comenzar
              </SplitButton>
            </div>
          </form>
        )}
      </BlueprintPanel>
    </div>
  );
}

export default OnboardingStepper;
