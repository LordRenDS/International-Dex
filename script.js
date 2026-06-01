const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

// Состояние приложения
const state = {
    offset: 0,
    limit: 20,
    loading: false,
    hasMore: true,
    filters: {
        generation: 'all',
        game: 'all',
        status: 'all'
    },
    pokemonList: [],
    versions: [] // Храним версии для фильтрации
};

// Функция для выполнения GraphQL запросов
async function fetchGraphQL(query, variables = {}) {
    try {
        const response = await fetch(GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query, variables })
        });

        const json = await response.json();

        if (json.errors) {
            console.error('GraphQL Errors:', json.errors);
            throw new Error('GraphQL Error');
        }

        return json.data;
    } catch (error) {
        console.error('Error fetching data:', error);
        return null;
    }
}

// Запрос для получения списка поколений и игр для фильтров
const fetchFiltersDataQuery = `
query GetFilters {
  generations: pokemon_v2_generation {
    id
    name
  }
  versions: pokemon_v2_version {
    id
    name
    pokemon_v2_versionnames(where: {language_id: {_eq: 9}}) {
      name
    }
    pokemon_v2_versiongroup {
      pokemon_v2_generation {
        id
      }
    }
  }
}
`;

// Имена поколений на русском (в API их может не быть)
const genNamesRu = {
    1: 'Поколение I',
    2: 'Поколение II',
    3: 'Поколение III',
    4: 'Поколение IV',
    5: 'Поколение V',
    6: 'Поколение VI',
    7: 'Поколение VII',
    8: 'Поколение VIII',
    9: 'Поколение IX'
};

// Загрузка начальных данных для фильтров
async function loadFilters() {
    const data = await fetchGraphQL(fetchFiltersDataQuery);
    if (!data) return;

    state.versions = data.versions;

    const genSelect = document.getElementById('generation-filter');
    const gameSelect = document.getElementById('game-filter');

    // Заполнение поколений
    data.generations.forEach(gen => {
        const option = document.createElement('option');
        option.value = gen.id;
        option.textContent = genNamesRu[gen.id] || gen.name;
        genSelect.appendChild(option);
    });

    // Заполнение игр
    updateGameFilter('all');

    // Слушатели событий
    genSelect.addEventListener('change', (e) => {
        state.filters.generation = e.target.value;
        state.filters.game = 'all';
        updateGameFilter(e.target.value);
        resetAndFetchPokemon();
    });

    gameSelect.addEventListener('change', (e) => {
        state.filters.game = e.target.value;
        resetAndFetchPokemon();
    });

    document.getElementById('status-filter').addEventListener('change', (e) => {
        state.filters.status = e.target.value;
        resetAndFetchPokemon();
    });
}

// Обновление списка игр в зависимости от выбранного поколения
function updateGameFilter(generationId) {
    const gameSelect = document.getElementById('game-filter');
    // Сохраняем "Все игры"
    gameSelect.innerHTML = '<option value="all">Все игры</option>';

    let filteredVersions = state.versions;
    if (generationId !== 'all') {
        filteredVersions = state.versions.filter(v =>
            v.pokemon_v2_versiongroup &&
            v.pokemon_v2_versiongroup.pokemon_v2_generation &&
            v.pokemon_v2_versiongroup.pokemon_v2_generation.id == generationId
        );
    }

    const seenNames = new Set();

    filteredVersions.forEach(version => {
        let name = version.name;
        if (version.pokemon_v2_versionnames && version.pokemon_v2_versionnames.length > 0) {
            name = version.pokemon_v2_versionnames[0].name;
        }

        if (!name.startsWith('Pokémon ')) {
            name = 'Pokémon ' + name;
        }

        if (!seenNames.has(name)) {
            seenNames.add(name);
            const option = document.createElement('option');
            option.value = version.id;
            option.textContent = name;
            gameSelect.appendChild(option);
        }
    });
}

function resetAndFetchPokemon() {
    // Эта функция будет реализована в следующем шаге
    console.log('Filters changed, fetching new data...', state.filters);
}

document.addEventListener('DOMContentLoaded', () => {
    loadFilters();
});

// Типы покемонов: цвета
const typeColors = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705898',
    steel: '#B7B7CE',
    fairy: '#D685AD'
};



// --- Translation Functionality ---
const translationCache = {};

async function translateToRu(text) {
    if (!text) return '';
    if (translationCache[text]) {
        return translationCache[text];
    }

    try {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ru&dt=t&q=${encodeURIComponent(text)}`;
        const response = await fetch(url);
        const data = await response.json();
        const translatedText = data[0].map(item => item[0]).join('');
        translationCache[text] = translatedText;
        return translatedText;
    } catch (error) {
        console.error('Translation error:', error);
        return text; // Fallback to original text if translation fails
    }
}
// ---------------------------------

const typeNamesRu = {
    normal: 'Обычный', fire: 'Огненный', water: 'Водяной', electric: 'Электрический',
    grass: 'Травяной', ice: 'Ледяной', fighting: 'Боевой', poison: 'Ядовитый',
    ground: 'Земляной', flying: 'Летающий', psychic: 'Психический', bug: 'Насекомое',
    rock: 'Каменный', ghost: 'Призрачный', dragon: 'Драконий', dark: 'Тёмный',
    steel: 'Стальной', fairy: 'Волшебный'
};

// Intersection Observer для бесконечного скролла
let observer;

function setupObserver() {
    const options = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !state.loading && state.hasMore) {
                fetchPokemon();
            }
        });
    }, options);

    // Добавим триггер для обсервера в HTML
    let trigger = document.getElementById('scroll-trigger');
    if (!trigger) {
        trigger = document.createElement('div');
        trigger.id = 'scroll-trigger';
        document.querySelector('.main-content').appendChild(trigger);
    }
    observer.observe(trigger);
}

// Запрос покемонов
async function fetchPokemon() {
    if (state.loading || !state.hasMore) return;

    state.loading = true;
    document.getElementById('loading').classList.remove('hidden');

    let whereClause = {};

    // Фильтр по поколению
    if (state.filters.generation !== 'all') {
        whereClause.pokemon_v2_pokemonspecy = {
            ...whereClause.pokemon_v2_pokemonspecy,
            generation_id: { _eq: parseInt(state.filters.generation) }
        };
    }

    // Фильтр по игре (game)
    if (state.filters.game !== 'all') {
        const gameId = parseInt(state.filters.game);
        whereClause._or = [
            { pokemon_v2_encounters: { version_id: { _eq: gameId } } },
            { pokemon_v2_pokemonspecy: { pokemon_v2_pokemonspeciesflavortexts: { version_id: { _eq: gameId } } } },
            { pokemon_v2_pokemonmoves: { pokemon_v2_versiongroup: { pokemon_v2_versions: { id: { _eq: gameId } } } } }
        ];
    }

    // Фильтр по статусу (редкости)
    if (state.filters.status !== 'all') {
        whereClause.pokemon_v2_pokemonspecy = {
            ...whereClause.pokemon_v2_pokemonspecy,
            [state.filters.status]: { _eq: true }
        };
    }

    // Преобразуем whereClause в строку для GraphQL
    // Поскольку GraphQL ожидает объект без кавычек на ключах, мы передадим его через variables
    const query = `
    query GetPokemonList($limit: Int!, $offset: Int!, $where: pokemon_v2_pokemon_bool_exp) {
      pokemon: pokemon_v2_pokemon(limit: $limit, offset: $offset, order_by: {id: asc}, where: $where) {
        id
        name
        pokemon_v2_pokemonspecy {
          pokemon_v2_pokemonspeciesnames(where: {language_id: {_eq: 9}}) {
            name
          }
        }
        pokemon_v2_pokemontypes {
          pokemon_v2_type {
            name
          }
        }
      }
    }
    `;

    try {
        const data = await fetchGraphQL(query, {
            limit: state.limit,
            offset: state.offset,
            where: whereClause
        });

        if (data && data.pokemon) {
            if (data.pokemon.length < state.limit) {
                state.hasMore = false;
            }

            renderPokemon(data.pokemon);
            state.offset += state.limit;
        }
    } catch (error) {
        console.error("Error fetching pokemon list:", error);
    } finally {
        state.loading = false;
        document.getElementById('loading').classList.add('hidden');
    }
}

// Отрисовка карточек
function renderPokemon(pokemonList) {
    const grid = document.getElementById('pokedex-grid');

    pokemonList.forEach(async poke => {
        const card = document.createElement('div');
        card.className = 'pokemon-card';
        card.dataset.id = poke.id;

        let enName = poke.name;
        if (poke.pokemon_v2_pokemonspecy &&
            poke.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspeciesnames &&
            poke.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspeciesnames.length > 0) {
            enName = poke.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspeciesnames[0].name;
        }

        const types = poke.pokemon_v2_pokemontypes.map(t => t.pokemon_v2_type.name);
        const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`;

        // Create initial card structure with a placeholder for the name
        card.innerHTML = `
            <div class="pokemon-image-container">
                <img src="${imgUrl}" alt="Loading..." loading="lazy" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png'">
            </div>
            <div class="pokemon-id">#${String(poke.id).padStart(3, '0')}</div>
            <div class="pokemon-name"><strong style="text-transform: capitalize;">${enName}</strong> <br/> <span id="name-${poke.id}">Загрузка...</span></div>
            <div class="pokemon-types">
                ${types.map(t => `<span class="type-badge" style="background-color: ${typeColors[t] || '#777'}">${typeNamesRu[t] || t}</span>`).join('')}
            </div>
        `;
        grid.appendChild(card);

        // Translate name asynchronously
        const ruName = await translateToRu(enName);

        // Update DOM
        const nameElement = card.querySelector(`#name-${poke.id}`);
        if (nameElement) {
            nameElement.textContent = ruName;
        }
        const imgElement = card.querySelector('img');
        if (imgElement) {
             imgElement.alt = ruName;
        }

        card.addEventListener('click', () => openModal(poke.id, ruName));
    });
}

// Обновленная функция сброса
function resetAndFetchPokemon() {
    state.offset = 0;
    state.hasMore = true;
    state.pokemonList = [];
    document.getElementById('pokedex-grid').innerHTML = '';
    fetchPokemon();
}

// Инициализация обсервера при старте
document.addEventListener('DOMContentLoaded', () => {
    // loadFilters() уже вызывается
    setupObserver();
    initTheme();
});

// --- Theme Handling ---
function initTheme() {
    const themeSelect = document.getElementById('theme-filter');
    const savedTheme = localStorage.getItem('theme') || 'system';

    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    });

    // Listen for system theme changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (localStorage.getItem('theme') === 'system') {
            applyTheme('system');
        }
    });
}

function applyTheme(theme) {
    if (theme === 'system') {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
        document.documentElement.setAttribute('data-theme', theme);
    }
}
// ----------------------


// Заглушка для модального окна (реализуем в след шаге)
function openModal(id, name) {
    console.log('Open modal for', id, name);
}


// Закрытие модального окна
document.querySelector('.close-modal').addEventListener('click', () => {
    document.getElementById('pokemon-modal').classList.add('hidden');
});

document.getElementById('pokemon-modal').addEventListener('click', (e) => {
    if (e.target.id === 'pokemon-modal') {
        e.target.classList.add('hidden');
    }
});

// Словари для локализации способов поимки
const methodDictRu = {
    'walk': 'В высокой траве',
    'surf': 'Серфинг',
    'old-rod': 'Старая удочка',
    'good-rod': 'Хорошая удочка',
    'super-rod': 'Супер удочка',
    'gift': 'Подарок',
    'rock-smash': 'Разбивание камней',
    'headbutt': 'Удар головой'
};

// --- Bulbapedia Integration ---
async function fetchBulbapediaLocations(pokemonNameEn) {
    const pageName = `${pokemonNameEn.charAt(0).toUpperCase() + pokemonNameEn.slice(1)}_(Pokémon)`;
    const url = `https://bulbapedia.bulbagarden.net/w/api.php?action=parse&page=${pageName}&prop=text&format=json&origin=*`;
    try {
        const res = await fetch(url);
        const json = await res.json();
        if (!json.parse) return null;
        const html = json.parse.text['*'];

        const div = document.createElement('div');
        div.innerHTML = html;

        const headings = Array.from(div.querySelectorAll('h2, h3, h4'));
        let locationsHeader = headings.find(h => h.textContent.includes('Game locations'));

        if (!locationsHeader) return null;

        let current = locationsHeader.nextElementSibling;
        let locationsTable = null;
        while (current && !current.matches('h2, h3, h4')) {
            if (current.tagName === 'TABLE') {
                locationsTable = current;
                break;
            }
            current = current.nextElementSibling;
        }

        if (!locationsTable) return null;

        const validRows = [];
        const ths = Array.from(locationsTable.querySelectorAll('th'));
        const processedTrs = new Set();

        for (const th of ths) {
            const tr = th.closest('tr');
            if (!tr || processedTrs.has(tr)) continue;

            const trThs = Array.from(tr.children).filter(el => el.tagName === 'TH');
            const tds = Array.from(tr.children).filter(el => el.tagName === 'TD');

            if (trThs.length > 0 && tds.length > 0) {
                 processedTrs.add(tr);
                 const games = trThs.map(t => t.textContent.trim().replace(/\n/g, ' ')).filter(g => g && !g.includes('Generation'));
                 if (games.length > 0) {
                     const locText = tds.map(td => {
                         const clone = td.cloneNode(true);
                         Array.from(clone.querySelectorAll('sup')).forEach(s => s.remove());
                         return clone.textContent.trim().replace(/\n/g, ' ').replace(/\s{2,}/g, ' ');
                     }).filter(t => t).join(' | ');

                     if (locText && !locText.includes('Unobtainable')) {
                         validRows.push({ games: games.join(', '), location: locText });
                     }
                 }
            }
        }
        return validRows;
    } catch(e) {
        return null;
    }
}
// ------------------------------

async function openModal(pokemonId, ruName) {
    const modal = document.getElementById('pokemon-modal');
    const modalBody = modal.querySelector('.modal-body');

    modal.classList.remove('hidden');
    modalBody.innerHTML = '<div class="loading"><div class="spinner"></div><p>Загрузка данных...</p></div>';

    const query = `
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

    try {
        const data = await fetchGraphQL(query, {
            id: pokemonId
        });

        if (!data || !data.pokemon) throw new Error("Data not found");

        const poke = data.pokemon;
        const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`;

        let flavorRu = 'Описание недоступно.';
        let flavorEn = '';

        if (poke.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspeciesflavortexts) {
            const texts = poke.pokemon_v2_pokemonspecy.pokemon_v2_pokemonspeciesflavortexts;
            const en = texts.find(t => t.language_id === 9);

            if (en) {
                flavorEn = en.flavor_text.replace(/[\f\n]/g, ' ');
                flavorRu = await translateToRu(flavorEn);
            }
        }

        // Получение локаций из Bulbapedia
        let encounterHTML = '';
        try {
            const locations = await fetchBulbapediaLocations(poke.name);
            if (locations && locations.length > 0) {
                let targetGameName = null;
                if (state.filters.game !== 'all') {
                    const gameSelect = document.getElementById('game-filter');
                    targetGameName = gameSelect.options[gameSelect.selectedIndex].text.replace('Pokémon ', '');
                }

                let filteredLocations = locations;
                if (targetGameName) {
                    filteredLocations = locations.filter(loc => loc.games.includes(targetGameName));
                }

                if (filteredLocations.length > 0) {
                    encounterHTML = `<ul class="encounters-list">` + filteredLocations.map(g => `
                        <li class="encounter-item">
                            <div class="encounter-game">${g.games.split(', ').map(n => 'Pokémon ' + n).join(', ')}</div>
                            <div class="encounter-location">${g.location}</div>
                        </li>
                    `).join('') + `</ul>`;
                } else {
                     encounterHTML = `<div class="no-data">${targetGameName ? 'В выбранной игре этот покемон не встречается в дикой природе или получается другим способом.' : 'Способ получения неизвестен.'}</div>`;
                }
            } else {
                encounterHTML = `<div class="no-data">Информация о местах обитания не найдена.</div>`;
            }
        } catch(e) {
            console.error("Bulbapedia fetch error:", e);
            encounterHTML = `<div class="no-data">Не удалось загрузить данные из Bulbapedia.</div>`;
        }

        modalBody.innerHTML = `
            <div class="modal-header">
                <div class="modal-image">
                    <img src="${imgUrl}" alt="${ruName}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${poke.id}.png'">
                </div>
                <div class="modal-title">
                    <div class="modal-id">#${String(poke.id).padStart(3, '0')}</div>
                    <h2 style="text-transform: capitalize;">${poke.name}</h2>
                    <h3>${ruName}</h3>
                </div>
            </div>

            <div class="modal-section">
                <h3>Описание</h3>
                <div class="modal-desc">${flavorRu}</div>
                ${flavorEn ? `<div class="modal-desc modal-desc-en">${flavorEn}</div>` : ''}
            </div>

            <div class="modal-section">
                <h3>Где найти</h3>
                ${encounterHTML}
            </div>
        `;

    } catch (error) {
        console.error("Modal Error:", error);
        modalBody.innerHTML = '<div class="no-data">Произошла ошибка при загрузке данных.</div>';
    }
}
