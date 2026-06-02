import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';

test('Russian dictionary does not contain garbage keys', () => {
    const data = fs.readFileSync('js/data/pokemon_ru_names.js', 'utf8');
    assert.ok(!data.includes('"яйца"'));
    assert.ok(!data.includes('Yaytsa'));
    assert.ok(data.includes('bulbasaur'));
});
