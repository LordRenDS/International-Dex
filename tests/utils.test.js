import test from 'node:test';
import assert from 'node:assert';
import { methodDictRu, debounce } from '../js/utils.js';

test('methodDictRu contains expected translations', () => {
    assert.strictEqual(methodDictRu['walk'], 'В высокой траве');
    assert.strictEqual(methodDictRu['surf'], 'Серфинг');
    assert.strictEqual(methodDictRu['gift'], 'Подарок');
});

test('debounce delays execution', async () => {
    let callCount = 0;
    const debounced = debounce(() => { callCount++ }, 50);

    debounced();
    debounced();
    debounced();

    assert.strictEqual(callCount, 0); // Not called immediately

    await new Promise(resolve => setTimeout(resolve, 60));

    assert.strictEqual(callCount, 1); // Called exactly once after wait
});
