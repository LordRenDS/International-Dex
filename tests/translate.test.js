import test from 'node:test';
import assert from 'node:assert';
import { translateToRu } from '../js/api/translate.js';

test('translateToRu returns empty string for empty input', async () => {
    assert.strictEqual(await translateToRu(''), '');
    assert.strictEqual(await translateToRu(null), '');
    assert.strictEqual(await translateToRu(undefined), '');
});

test('translateToRu returns original text on translation error', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.reject(new Error('Network error'));

    try {
        const result = await translateToRu('test');
        assert.strictEqual(result, 'test');
    } finally {
        global.fetch = originalFetch;
    }
});

test('translateToRu parses valid translation response', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({
        json: () => Promise.resolve([
            [
                ["привет", "hello", null, null, 1],
                [" мир", " world", null, null, 1]
            ]
        ])
    });

    try {
        const result = await translateToRu('hello world');
        assert.strictEqual(result, 'привет мир');
    } finally {
        global.fetch = originalFetch;
    }
});
