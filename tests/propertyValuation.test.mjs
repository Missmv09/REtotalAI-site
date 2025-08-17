import assert from 'assert/strict';
import { getPropertyValuation } from '../plugins/propertyValuation.js';

async function testSuccess() {
  const expected = {
    propertyValue: 500000,
    confidenceScore: 87,
    lastUpdated: '2024-05-01T00:00:00Z'
  };
  global.fetch = async (url) => ({
    ok: true,
    json: async () => expected,
  });
  const result = await getPropertyValuation({
    address: '123 Main St',
    city: 'Anytown',
    state: 'CA',
    zipcode: '90210',
    propertyType: 'Single Family'
  });
  assert.deepEqual(result, expected);
  console.log('testSuccess passed');
}

async function testFailure() {
  global.fetch = async () => ({ ok: false, status: 500 });
  let threw = false;
  try {
    await getPropertyValuation({
      address: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zipcode: '90210',
      propertyType: 'Single Family'
    });
  } catch (err) {
    threw = true;
    assert.ok(err instanceof Error);
  }
  assert.ok(threw, 'Expected error to be thrown');
  console.log('testFailure passed');
}

await testSuccess();
await testFailure();
console.log('All tests passed');
