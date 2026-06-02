import { state, updateState, updateFilters, resetPagination } from './state.js';
import { fetchGraphQL, fetchFiltersDataQuery, getPokemonQuery, getPokemonByGameQuery } from './api/index.js';
import { renderPokemon, setupSidebar, initTheme, setupModal } from './ui.js';
import { debounce } from './utils.js';

// Setup Intersection Observer for infinite scrolling
function setupObserver() {
    const options = {
        root: null,
        rootMargin: '100px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !state.loading && state.hasMore) {
                fetchPokemon();
            }
        });
    }, options);

    const target = document.getElementById('sentinel');
    observer.observe(target);
}

// Fetch and populate filters
async function loadFilters() {
    const data = await fetchGraphQL(fetchFiltersDataQuery);
    if (!data) return;

    const genSelect = document.getElementById('generation-filter');
    data.generations.forEach(gen => {
        const option = document.createElement('option');
        option.value = gen.id;
        option.textContent = `Поколение ${gen.name.split('-')[1].toUpperCase()}`;
        genSelect.appendChild(option);
    });

    updateState({ versions: data.versions });
}

// Update game filter based on selected generation
function updateGameFilter(generationId) {
    const gameSelect = document.getElementById('game-filter');

    Array.from(gameSelect.options).forEach(opt => {
        if (opt.value !== 'all') opt.remove();
    });

    if (generationId === 'all') {
        state.versions.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `Pokémon ${v.name.charAt(0).toUpperCase() + v.name.slice(1)}`;
            gameSelect.appendChild(option);
        });
    } else {
        const filteredVersions = state.versions.filter(v => v.version_group_id === parseInt(generationId));
        filteredVersions.forEach(v => {
            const option = document.createElement('option');
            option.value = v.id;
            option.textContent = `Pokémon ${v.name.charAt(0).toUpperCase() + v.name.slice(1)}`;
            gameSelect.appendChild(option);
        });
    }
}

// Main fetch function
async function fetchPokemon() {
    if (state.loading || !state.hasMore) return;

    updateState({ loading: true });
    document.getElementById('loading').classList.remove('loading--hidden');

    const variables = {
        limit: state.limit,
        offset: state.offset,
        search: `%${state.searchQuery}%`,
        sortOrder: state.sort.order
    };

    const hasSearch = state.searchQuery.length > 0;
    const hasFilter = state.filters.generation !== 'all';

    if (hasFilter) {
        variables.generation = parseInt(state.filters.generation);
    }

    let statusFilters = [];
    if (state.filters.status !== 'all') {
        statusFilters.push({ [state.filters.status]: {_eq: true} });
    } else {
        statusFilters = [{}];
    }
    variables.statusFilters = statusFilters;

    let query;
    if (state.filters.game !== 'all') {
        variables.versionId = parseInt(state.filters.game);
        query = getPokemonByGameQuery(hasSearch, hasFilter, state.sort.by);
    } else {
        query = getPokemonQuery(hasSearch, hasFilter, state.sort.by);
    }

    const data = await fetchGraphQL(query, variables);

    if (data && data.pokemon) {
        if (data.pokemon.length < state.limit) {
            updateState({ hasMore: false });
        }

        const isFirstPage = state.offset === 0;
        const newPokemonList = [...state.pokemonList, ...data.pokemon];
        updateState({
            pokemonList: newPokemonList,
            offset: state.offset + state.limit
        });

        await renderPokemon(data.pokemon, isFirstPage);
    } else {
        updateState({ hasMore: false });
    }

    updateState({ loading: false });
    document.getElementById('loading').classList.add('loading--hidden');
    if (!state.hasMore) {
        const sentinel = document.getElementById('sentinel');
        if (sentinel) sentinel.style.display = 'none';
    } else {
        const sentinel = document.getElementById('sentinel');
        if (sentinel) sentinel.style.display = 'block';
    }
}

// Reset and refetch
function resetAndFetchPokemon() {
    resetPagination();
    const sentinel = document.getElementById('sentinel');
    if (sentinel) sentinel.style.display = 'block';
    fetchPokemon();
}

// Event Listeners setup
function setupEventListeners() {
    // Search
    const searchInput = document.getElementById('search-input');
    const debouncedSearch = debounce((e) => {
        updateState({ searchQuery: e.target.value.trim().toLowerCase() });
        resetAndFetchPokemon();
    }, 500);
    searchInput.addEventListener('input', debouncedSearch);

    // Filters
    document.getElementById('generation-filter').addEventListener('change', (e) => {
        updateFilters({ generation: e.target.value, game: 'all' });
        updateGameFilter(e.target.value);
        resetAndFetchPokemon();
    });

    document.getElementById('game-filter').addEventListener('change', (e) => {
        updateFilters({ game: e.target.value });
        resetAndFetchPokemon();
    });

    document.getElementById('status-filter').addEventListener('change', (e) => {
        updateFilters({ status: e.target.value });
        resetAndFetchPokemon();
    });

    // Sort
    document.getElementById('sort-filter').addEventListener('change', (e) => {
        updateState({ sort: { ...state.sort, by: e.target.value } });
        resetAndFetchPokemon();
    });

    document.getElementById('sort-order-btn').addEventListener('click', (e) => {
        const currentOrder = state.sort.order;
        const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';
        updateState({ sort: { ...state.sort, order: newOrder } });
        e.target.textContent = newOrder === 'asc' ? '⬆️' : '⬇️';
        resetAndFetchPokemon();
    });

    // Reset button
    document.getElementById('reset-filters').addEventListener('click', () => {
        updateFilters({ generation: 'all', game: 'all', status: 'all' });
        updateState({ sort: { by: 'id', order: 'asc' }, searchQuery: '' });

        document.getElementById('generation-filter').value = 'all';
        document.getElementById('game-filter').value = 'all';
        document.getElementById('status-filter').value = 'all';
        document.getElementById('sort-filter').value = 'id';
        document.getElementById('search-input').value = '';
        document.getElementById('sort-order-btn').textContent = '⬆️';

        resetAndFetchPokemon();

        const sidebar = document.getElementById('filters-sidebar');
        const backdrop = document.getElementById('sidebar-backdrop');
        sidebar.classList.remove('sidebar--open');
        backdrop.classList.add('sidebar__backdrop--hidden');
        document.body.classList.remove('page--sidebar-open');
    });
}

// Initialization
async function init() {
    setupSidebar();
    setupModal();
    initTheme();
    setupEventListeners();
    await loadFilters();
    updateGameFilter('all');
    fetchPokemon();
    setupObserver();
}

// Start the app
document.addEventListener('DOMContentLoaded', init);
