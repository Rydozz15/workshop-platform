/**
 * QA Test Script - Version Maintenance Logic
 * This script overrides DB_PROVIDER to "memory" and simulates a chained campaign flow.
 */

process.env.DB_PROVIDER = 'memory';

async function runTest() {
  const db = await import('../lib/db.js');
  
  console.log('--- QA TEST START ---');

  // 1. Create 2 Versions
  const v1 = db.createVersion({ title: 'Version 1', case_content: 'Content 1' });
  const v2 = db.createVersion({ title: 'Version 2', case_content: 'Content 2' });
  console.log('Created Versions:', v1.title, v2.title);

  // 2. Create Chained Campaign
  // Step 1: Normal
  const w1 = await db.createWorkshop({
    name: 'Step 1',
    selected_version_ids: [v1.id, v2.id],
    maintain_version: false
  });
  
  // Step 2: Maintain Version = True
  const w2 = await db.createWorkshop({
    name: 'Step 2',
    selected_version_ids: [v1.id, v2.id],
    maintain_version: true,
    chain_id: 'test-chain'
  });
  
  console.log('Created Chained Workshops:', w1.name, w2.name);
  console.log('Step 2 maintain_version:', w2.maintain_version);

  // 3. Simulate User Joining Step 1
  const cuid = 'qa-user-123';
  
  // Logic from join route (simulated)
  // Step 1: Should be random
  const assignedVId1 = v1.id; // Force one for testing or use real logic
  const session1 = await db.createSession({
    workshop_id: w1.id,
    version_id: assignedVId1,
    participant_name: 'QA User',
    chain_user_id: cuid
  });
  console.log('Session 1 started with version:', assignedVId1 === v1.id ? 'V1' : 'V2');

  // 4. Simulate User Joining Step 2 (The actual test)
  console.log('Testing Join Step 2...');
  
  // Logic from app/api/session/join/route.js:
  let assignedVersionId2 = null;
  if (w2.maintain_version && cuid) {
    assignedVersionId2 = await db.getLastSessionVersion(cuid);
  }

  console.log('Result of maintenance logic:', assignedVersionId2 === assignedVId1 ? 'PASS (Matches)' : 'FAIL');
  
  if (assignedVersionId2 === assignedVId1) {
    console.log('--- TEST PASSED ✅ ---');
  } else {
    console.log('--- TEST FAILED ❌ ---');
    process.exit(1);
  }
}

runTest().catch(err => {
  console.error('Test Error:', err);
  process.exit(1);
});
