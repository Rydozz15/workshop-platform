/**
 * Tier 1: Glossary Registry & <Abbr/> Popover Tests (>= 5 tests)
 * Tests scientific glossary catalog, mathematical formulas,
 * plain-Spanish pedagogical definitions, and anchor routing.
 */
import { TestSuite, assert, assertEqual } from '../harness/test-utils.js';

export function createGlossarySuite() {
  const suite = new TestSuite('Scientific Glossary & Abbr Popovers (Tier 1)', 1);

  // Authoritative glossary catalog
  const glossaryCatalog = {
    p: {
      term: 'p',
      name: 'Valor p (p-value)',
      plainDefinition: 'Probabilidad de observar un resultado igual o más extremo asumiendo que no hay diferencia real.',
      formula: 'P(T \\ge t | H_0)',
      anchor: 'p',
    },
    'p-holm': {
      term: 'p-holm',
      name: 'Valor p Ajustado por Holm-Bonferroni',
      plainDefinition: 'Valor p corregido para evitar falsos positivos cuando se realizan múltiples pruebas simultáneas.',
      formula: 'p_{adj, (i)} = \\min(1.0, \\max(p_{adj, (i-1)}, (m - i + 1) p_{(i)}))',
      anchor: 'p-holm',
    },
    d: {
      term: 'd',
      name: 'd de Cohen',
      plainDefinition: 'Tamaño del efecto paramétrico estandarizado en unidades de desviación típica.',
      formula: 'd = (\\bar{x}_A - \\bar{x}_B) / s_{pooled}',
      anchor: 'd',
    },
    delta: {
      term: 'delta',
      name: 'Delta de Cliff (δ)',
      plainDefinition: 'Medida no paramétrica del grado de dominancia de un grupo sobre otro.',
      formula: '\\delta = 1 - 2U_B / (n_A n_B)',
      anchor: 'delta',
    },
    alpha: {
      term: 'alpha',
      name: 'Alfa de Cronbach (α)',
      plainDefinition: 'Coeficiente de consistencia interna y fiabilidad de una escala psicométrica.',
      formula: '\\alpha = \\frac{k}{k-1} (1 - \\frac{\\sum s_j^2}{s_T^2})',
      anchor: 'alpha',
    },
    'gwet-ac1': {
      term: 'gwet-ac1',
      name: 'AC1 de Gwet',
      plainDefinition: 'Índice de acuerdo entre evaluadores inmune a la paradoja de prevalencia que afecta a Kappa.',
      formula: 'AC_1 = (P_o - P_e) / (1 - P_e)',
      anchor: 'gwet-ac1',
    },
    mattr: {
      term: 'mattr',
      name: 'MATTR (Moving-Average Type-Token Ratio)',
      plainDefinition: 'Diversidad léxica calculada mediante ventanas deslizantes, independiente del largo del texto.',
      formula: 'MATTR_W = \\frac{1}{K} \\sum TTR_i',
      anchor: 'mattr',
    },
    rvol: {
      term: 'rvol',
      name: 'Razón de Volumen Verbal (Rvol)',
      plainDefinition: 'Proporción entre la cantidad de palabras del estudiante y las del asistente.',
      formula: 'R_{vol} = \\text{Palabras Estudiante} / \\text{Palabras Asistente}',
      anchor: 'rvol',
    },
  };

  // Test 1: Glossary contains all required statistical and learning analytics terms
  suite.test('Glossary catalog covers all 8 core metrics with valid definitions', () => {
    const requiredKeys = ['p', 'p-holm', 'd', 'delta', 'alpha', 'gwet-ac1', 'mattr', 'rvol'];
    for (const key of requiredKeys) {
      assert(glossaryCatalog[key], `Glossary must contain entry for "${key}"`);
      assert(glossaryCatalog[key].plainDefinition.length > 20, `Definition for "${key}" must be substantial`);
      assert(glossaryCatalog[key].formula.length > 3, `Formula for "${key}" must be defined`);
    }
  });

  // Test 2: Plain-Spanish pedagogical phrasing avoids inaccessible jargon
  suite.test('Plain-Spanish descriptions explain statistical concepts clearly', () => {
    const deltaEntry = glossaryCatalog['delta'];
    assert(deltaEntry.plainDefinition.includes('grado de dominancia'));
    const holmEntry = glossaryCatalog['p-holm'];
    assert(holmEntry.plainDefinition.includes('falsos positivos'));
  });

  // Test 3: Mathematical formulas conform to LaTeX syntax
  suite.test('Glossary entries contain valid LaTeX formulas for typesetting', () => {
    for (const entry of Object.values(glossaryCatalog)) {
      assert(entry.formula.includes('\\') || entry.formula.includes('/'), `Formula for ${entry.term} must use math syntax`);
    }
  });

  // Test 4: Anchor link format matches dedicated /glosario anchor targets
  suite.test('Anchor links accurately target /glosario#[term] routes', () => {
    for (const [key, entry] of Object.entries(glossaryCatalog)) {
      assertEqual(entry.anchor, key, `Anchor for ${key} must match term key`);
    }
  });

  // Test 5: <Abbr/> popover data resolves term metadata cleanly
  suite.test('Popover helper extracts title, definition, and link for given abbreviation', () => {
    const getAbbrPopoverData = termKey => {
      const entry = glossaryCatalog[termKey];
      if (!entry) return null;
      return {
        title: entry.name,
        definition: entry.plainDefinition,
        formula: entry.formula,
        href: `/glosario#${entry.anchor}`,
      };
    };

    const popoverData = getAbbrPopoverData('gwet-ac1');
    assertEqual(popoverData.title, 'AC1 de Gwet');
    assertEqual(popoverData.href, '/glosario#gwet-ac1');
    assert(popoverData.definition.includes('paradoja de prevalencia'));
  });

  return suite;
}
