/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './lib/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    borderRadius: {
      none: '0px',
      DEFAULT: '0px',
      xs: '2px', // ONLY for 6x6px status dot
    },
    boxShadow: {
      none: 'none',
      hard: 'var(--ps-shadow-hard)',
      'hard-lg': 'var(--ps-shadow-hard-lg)',
    },
    colors: {
      transparent: 'transparent',
      current: 'currentColor',
      canvas: 'var(--ps-canvas)',
      kraft: 'var(--ps-kraft)',
      paper: 'var(--ps-paper)',
      'paper-subtle': 'var(--ps-paper-subtle)',
      'paper-muted': 'var(--ps-paper-muted)',
      ink: 'var(--ps-ink)',
      'ink-2': 'var(--ps-ink-2)',
      'ink-deco': 'var(--ps-ink-deco)',
      cobalt: 'var(--ps-cobalt)',
      'cobalt-hover': 'var(--ps-cobalt-hover)',
      'cobalt-tint': 'var(--ps-cobalt-tint)',
      graphite: 'var(--ps-graphite)',
      'graphite-tint': 'var(--ps-graphite-tint)',
      vermilion: 'var(--ps-vermilion)',
      'vermilion-block': 'var(--ps-vermilion-block)',
      'vermilion-ink': 'var(--ps-vermilion-ink)',
      'vermilion-tint': 'var(--ps-vermilion-tint)',
      crimson: 'var(--ps-crimson)',
      emerald: 'var(--ps-emerald)',
      'emerald-tint': 'var(--ps-emerald-tint)',
      'line-control': 'var(--ps-line-control)',
      'line-strong': 'var(--ps-line-strong)',
      rule: 'var(--ps-rule)',
      focus: 'var(--ps-focus)',
    },
    fontFamily: {
      display: ['var(--font-display)'],
      body: ['var(--font-body)'],
      'ui-mono': ['var(--font-ui-mono)'],
      stat: ['var(--font-stat)'],
      note: ['var(--font-note)'],
    },
    extend: {
      minHeight: {
        target: 'var(--ps-target)',
      },
      minWidth: {
        target: 'var(--ps-target)',
      },
    },
  },
  corePlugins: {
    backgroundImage: false, // Disables bg-gradient-*; blueprint grid is declared in CSS
  },
};
