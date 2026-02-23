import fs from 'fs';

export function parseFailure() {
  const raw = fs.readFileSync('artifacts/test-results.json', 'utf8');
  const data = JSON.parse(raw);

  for (const suite of data.suites) {
    for (const spec of suite.specs) {
      for (const test of spec.tests) {
        if (test.status === 'failed') {
          return {
            testFile: spec.file,
            title: spec.title,
            error: test.results[0].error?.message || ''
          };
        }
      }
    }
  }

  return null;
}