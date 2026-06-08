import test from 'node:test';
import assert from 'node:assert';
import { getPokemonQuery, getPokemonByGameQuery } from '../js/api/queries.js';

test('getPokemonQuery formats query correctly', () => {
    const query = getPokemonQuery(true, false, 'id', false);
    assert.ok(query.includes('$search: String!'));
    assert.ok(query.includes('{id: $sortOrder}'));
    assert.ok(!query.includes('generation_id: {_eq: $generation}'));

    const queryWithFilter = getPokemonQuery(false, true, 'name', true);
    assert.ok(queryWithFilter.includes('$searchList: [String!]'));
    assert.ok(queryWithFilter.includes('{name: $sortOrder}, {id: $sortOrder}'));
    assert.ok(queryWithFilter.includes('generation_id: {_eq: $generation}'));
});

test('getPokemonByGameQuery formats query correctly', () => {
    const query = getPokemonByGameQuery(true, false, 'id', false);
    assert.ok(query.includes('$search: String!'));
    assert.ok(query.includes('{id: $sortOrder}'));
    assert.ok(!query.includes('generation_id: {_eq: $generation}'));
    assert.ok(query.includes('version_id: {_eq: $versionId}'));

    const queryWithFilter = getPokemonByGameQuery(false, true, 'name', true);
    assert.ok(queryWithFilter.includes('$searchList: [String!]'));
    assert.ok(queryWithFilter.includes('{name: $sortOrder}, {id: $sortOrder}'));
    assert.ok(queryWithFilter.includes('generation_id: {_eq: $generation}'));
    assert.ok(queryWithFilter.includes('version_id: {_eq: $versionId}'));
});
