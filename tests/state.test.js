import test from 'node:test';
import assert from 'node:assert';
import { state, updateState, updateFilters, resetPagination } from '../js/state.js';

test('updateState updates main state', () => {
    updateState({ searchQuery: 'test' });
    assert.strictEqual(state.searchQuery, 'test');
});

test('updateFilters updates filters deeply', () => {
    updateFilters({ generation: 'generation-i' });
    assert.strictEqual(state.filters.generation, 'generation-i');
    assert.strictEqual(state.filters.game, 'all'); // other filters unchanged
});

test('resetPagination resets pagination properties', () => {
    updateState({ offset: 40, hasMore: false, pokemonList: [{id: 1}] });
    resetPagination();
    assert.strictEqual(state.offset, 0);
    assert.strictEqual(state.hasMore, true);
    assert.deepStrictEqual(state.pokemonList, []);
});
