export const state = {
    offset: 0,
    limit: 20,
    loading: false,
    hasMore: true,
    filters: {
        generation: 'all',
        game: 'all',
        status: 'all'
    },
    sort: {
        by: 'id',
        order: 'asc'
    },
    searchQuery: '',
    pokemonList: [],
    versions: []
};

export function updateState(newState) {
    Object.assign(state, newState);
}

export function updateFilters(newFilters) {
    state.filters = { ...state.filters, ...newFilters };
}

export function resetPagination() {
    state.offset = 0;
    state.hasMore = true;
    state.pokemonList = [];
}
