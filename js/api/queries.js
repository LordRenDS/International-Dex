export const fetchFiltersDataQuery = `
  query GetFiltersData {
    generations: pokemon_v2_generation {
      id
      name
    }
    versions: pokemon_v2_version {
      id
      name
      version_group_id
    }
  }
`;

export const getPokemonQuery = (hasSearch, hasFilter) => `
query GetPokemon($limit: Int!, $offset: Int!, $search: String!, $generation: Int, $statusFilters: [pokemon_v2_pokemon_bool_exp!]!, $sortOrder: order_by!) {
  pokemon: pokemon_v2_pokemon(
    limit: $limit,
    offset: $offset,
    order_by: [
      ${hasSearch ? '{id: asc}' : '{name: $sortOrder}, {id: $sortOrder}'}
    ],
    where: {
      is_default: {_eq: true},
      _and: [
        {name: {_ilike: $search}},
        ${hasFilter ? '{pokemon_v2_pokemonspecy: {generation_id: {_eq: $generation}}}' : ''},
        {_or: $statusFilters}
      ]
    }
  ) {
    id
    name
  }
}
`;

export const getPokemonByGameQuery = (hasSearch, hasFilter) => `
query GetPokemonByGame($limit: Int!, $offset: Int!, $search: String!, $generation: Int, $statusFilters: [pokemon_v2_pokemon_bool_exp!]!, $sortOrder: order_by!, $versionId: Int!) {
  pokemon: pokemon_v2_pokemon(
    limit: $limit,
    offset: $offset,
    order_by: [
      ${hasSearch ? '{id: asc}' : '{name: $sortOrder}, {id: $sortOrder}'}
    ],
    where: {
      is_default: {_eq: true},
      _and: [
        {name: {_ilike: $search}},
        ${hasFilter ? '{pokemon_v2_pokemonspecy: {generation_id: {_eq: $generation}}}' : ''},
        {_or: $statusFilters},
        {_or: [
          {pokemon_v2_encounters: {version_id: {_eq: $versionId}}},
          {pokemon_v2_pokemonspecy: {pokemon_v2_pokemonspeciesflavortexts: {version_id: {_eq: $versionId}}}},
          {pokemon_v2_pokemonmoves: {pokemon_v2_versiongroup: {pokemon_v2_versions: {id: {_eq: $versionId}}}}}
        ]}
      ]
    }
  ) {
    id
    name
  }
}
`;

export const getPokemonDetailsQuery = `
query GetPokemonDetails($id: Int!) {
  pokemon: pokemon_v2_pokemon_by_pk(id: $id) {
    id
    name
    pokemon_v2_pokemonspecy {
      pokemon_v2_pokemonspeciesflavortexts(where: {language_id: {_eq: 9}}, limit: 2, order_by: {version_id: desc}) {
        flavor_text
        language_id
      }
    }
  }
}
`;
