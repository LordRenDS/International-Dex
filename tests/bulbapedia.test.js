import test from 'node:test';
import assert from 'node:assert';
import { fetchBulbapediaLocations } from '../js/api/bulbapedia.js';

// Minimal DOM mock for bulbapedia parser
global.DOMParser = class { parseFromString(html, mime) { return global.document.createElement("div"); } };
global.document = {
    createElement: () => {
        return {
            innerHTML: '',
            querySelectorAll: (selector) => {
                if (selector === 'h2, h3, h4') {
                    return [
                        { textContent: 'Biology' },
                        { textContent: 'Game locations', nextElementSibling: {
                            tagName: 'TABLE',
                            matches: () => false,
                            querySelectorAll: (sel) => {
                                if (sel === 'th') {
                                    return [
                                        {
                                            closest: () => ({
                                                children: [
                                                    { tagName: 'TH', textContent: 'Red' },
                                                    { tagName: 'TD', textContent: 'Route 1', cloneNode: function() { return { textContent: this.textContent, querySelectorAll: () => [] } } }
                                                ]
                                            })
                                        }
                                    ];
                                }
                                return [];
                            }
                        } }
                    ]
                }
                return [];
            }
        };
    }
};

test('fetchBulbapediaLocations returns parsed locations', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({
        json: () => Promise.resolve({
            parse: {
                text: {
                    '*': '<html>MOCK_HTML</html>'
                }
            }
        })
    });

    try {
        const locations = await fetchBulbapediaLocations('bulbasaur');
        assert.ok(locations);
        assert.strictEqual(locations.length, 1);
        assert.strictEqual(locations[0].games, 'Red');
        assert.strictEqual(locations[0].location, 'Route 1');
    } finally {
        global.fetch = originalFetch;
    }
});

test('fetchBulbapediaLocations handles error gracefully', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.reject(new Error('Network error'));

    try {
        const locations = await fetchBulbapediaLocations('bulbasaur');
        assert.strictEqual(locations, null);
    } finally {
        global.fetch = originalFetch;
    }
});

test('fetchBulbapediaLocations returns null on invalid JSON response', async () => {
    const originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({
        json: () => Promise.resolve({ error: 'Not found' })
    });

    try {
        const locations = await fetchBulbapediaLocations('bulbasaur');
        assert.strictEqual(locations, null);
    } finally {
        global.fetch = originalFetch;
    }
});

test('fetchBulbapediaLocations handles no Game locations header', async () => {
    const originalDoc = global.document;
    global.DOMParser = class { parseFromString(html, mime) { return global.document.createElement("div"); } };
global.document = {
        createElement: () => ({
            innerHTML: '',
            querySelectorAll: () => []
        })
    };
    const originalFetch = global.fetch;
    global.fetch = () => Promise.resolve({
         json: () => Promise.resolve({
             parse: { text: { '*': '' } }
         })
    });

    try {
        const locations = await fetchBulbapediaLocations('bulbasaur');
        assert.strictEqual(locations, null);
    } finally {
        global.document = originalDoc;
        global.fetch = originalFetch;
    }
});
