'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import CadIcon from '@/components/ui/cad-icon';
import { suggestionsForPage } from '@/lib/assistant-prompt';

/**
 * Floating assistant available on every admin page. Asks /api/admin/copilot (mode "assist"),
 * which answers with the configured AI provider or, with no key, from an offline knowledge base.
 */
export default function AssistantWidget() {
  const pathname = usePathname() || '';
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const listRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages, busy]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const ask = async (text) => {
    const question = text.trim();
    if (!question || busy) return;
    const next = [...messages, { role: 'user', content: question }];
    setMessages(next);
    setInput('');
    setBusy(true);
    try {
      const res = await fetch('/api/admin/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: 'assist', messages: next.map(({ role, content }) => ({ role, content })), page: pathname }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'No pude responder ahora.');
      setMessages([...next, { role: 'assistant', content: data.reply, links: data.links || [] }]);
    } catch (e) {
      setMessages([...next, { role: 'assistant', content: e.message || 'No pude responder ahora. Inténtalo de nuevo.', links: [] }]);
    }
    setBusy(false);
  };

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir el asistente"
          className="fixed bottom-4 right-4 z-40 min-h-[56px] px-4 bg-cobalt hover:bg-cobalt-hover text-paper border border-line-strong shadow-hard font-body text-sm font-semibold inline-flex items-center gap-2"
        >
          <CadIcon name="MessageCircle" size={20} />
          <span className="hidden sm:inline">Asistente</span>
        </button>
      )}
      {open && (
        <section
          role="dialog"
          aria-label="Asistente"
          className="fixed z-50 bottom-0 right-0 sm:bottom-4 sm:right-4 w-full sm:w-[24rem] h-[min(34rem,100dvh)] bg-paper border-2 border-line-strong shadow-hard-lg flex flex-col"
        >
          <header className="flex items-center justify-between gap-3 px-4 py-3 bg-paper-muted border-b-2 border-line-strong">
            <div>
              <h2 className="ps-h3">Asistente</h2>
              <p className="ps-meta m-0">Pregúntame sobre esta página o la plataforma.</p>
            </div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Cerrar el asistente" className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center hover:bg-paper">
              <CadIcon name="X" size={18} />
            </button>
          </header>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3" aria-live="polite">
            {messages.length === 0 && (
              <div className="space-y-3">
                <p className="font-body text-sm text-ink m-0">Hola. ¿En qué te ayudo?</p>
                <div className="flex flex-wrap gap-2">
                  {suggestionsForPage(pathname).map((s) => (
                    <button key={s} type="button" onClick={() => ask(s)} className="min-h-[44px] px-3 py-2 border border-line-control bg-paper-subtle hover:bg-cobalt-tint font-body text-sm text-ink text-left">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                <div className={`max-w-[88%] px-3 py-2 border font-body text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-cobalt-tint border-cobalt text-ink' : 'bg-paper border-line-control text-ink'}`}>
                  {m.content}
                  {m.links?.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-3">
                      {m.links.map((l) => (
                        <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="font-semibold text-cobalt underline">
                          {l.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && <p className="ps-meta m-0" role="status">Pensando…</p>}
          </div>

          <form onSubmit={(e) => { e.preventDefault(); ask(input); }} className="p-3 border-t border-line-control flex gap-2">
            <label htmlFor="assistant-input" className="sr-only">Tu pregunta</label>
            <input
              id="assistant-input"
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Escribe tu pregunta"
              className="flex-1 min-w-0 min-h-[44px] font-body text-sm text-ink bg-paper border border-line-control px-3"
            />
            <button type="submit" disabled={busy || !input.trim()} aria-label="Enviar" className="min-h-[44px] min-w-[44px] bg-cobalt hover:bg-cobalt-hover text-paper border border-line-strong inline-flex items-center justify-center disabled:opacity-50">
              <CadIcon name="Send" size={18} />
            </button>
          </form>
        </section>
      )}
    </>
  );
}
