/**
 * Tier 1: Case Sheet Tests (>= 5 tests)
 * Tests side-panel case sheet fetching, markdown formatting,
 * version assignment balance, and session isolation.
 */
import { TestSuite, assert, assertEqual, assertNotEqual } from '../harness/test-utils.js';
import { apiClient } from '../harness/api-client.js';
import { setupTestDatabase } from '../harness/memory-db-harness.js';

export function createCaseSheetSuite() {
  const suite = new TestSuite('Case Sheet Component & Data Pipeline (Tier 1)', 1);

  // Test 1: Case content fetched and rendered for assigned version
  suite.test('Assigned version case sheet is returned upon session join', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({
      code: 'TEST01',
      participant_name: 'Ana M.',
    });
    assertEqual(joinRes.status, 200);
    const ver = joinRes.data.version;
    assert(ver.title.includes('Condition'), 'Version title must match scenario');
    assert(ver.case_content.includes('# Caso'), 'Case content must include markdown title');
  });

  // Test 2: Case sheet tab persists across session details fetch
  suite.test('Session details GET endpoint reliably preserves case content across calls', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Test 2' });
    const sId = joinRes.data.session_id;

    const detailRes = await apiClient.getSession(sId);
    assertEqual(detailRes.status, 200);
    assertEqual(detailRes.data.version.id, joinRes.data.version.id);
    assertEqual(detailRes.data.version.case_content, joinRes.data.version.case_content);
  });

  // Test 3: Markdown formatting structure is preserved
  suite.test('Case sheet content preserves markdown headers, bullet lists, and section markers', async () => {
    setupTestDatabase();
    const joinRes = await apiClient.joinSession({ code: 'TEST01', participant_name: 'Test 3' });
    const content = joinRes.data.version.case_content;
    assert(content.includes('## '), 'Must preserve H2 markdown headers');
    assert(content.includes('- '), 'Must preserve bullet lists');
  });

  // Test 4: Balanced randomized allocation between versions
  suite.test('Consecutive session joins distribute participants across available versions', async () => {
    setupTestDatabase();
    const assignedVersions = [];
    for (let i = 0; i < 4; i++) {
      const res = await apiClient.joinSession({ code: 'TEST01', participant_name: `User ${i}` });
      assignedVersions.push(res.data.version.id);
    }
    const countA = assignedVersions.filter(id => id === 'ver-a-baseline').length;
    const countB = assignedVersions.filter(id => id === 'ver-b-contestable').length;
    assertEqual(countA, 2, 'Balanced allocation should assign exactly 2 to ver A');
    assertEqual(countB, 2, 'Balanced allocation should assign exactly 2 to ver B');
  });

  // Test 5: Case content isolation between disparate workshops
  suite.test('Session case sheet matches specific workshop configuration and version IDs', async () => {
    setupTestDatabase();
    const res1 = await apiClient.joinSession({ code: 'CHAIN1', participant_name: 'Chain User 1' });
    assertEqual(res1.data.version.id, 'ver-a-baseline');

    const res2 = await apiClient.joinSession({ code: 'CHAIN2', participant_name: 'Chain User 2' });
    assertEqual(res2.data.version.id, 'ver-b-contestable');
    assertNotEqual(res1.data.version.case_content, res2.data.version.case_content);
  });

  return suite;
}
