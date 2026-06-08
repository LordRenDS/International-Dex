import { state, updateState } from './state.js';
import { fetchGraphQL, getPokemonDetailsQuery, translateToRu, fetchBulbapediaLocations } from './api/index.js';
import { escapeHTML } from './utils.js';

export function setupSidebar() {
    const sidebar = document.getElementById('filters-sidebar');
    const backdrop = document.getElementById('sidebar-backdrop');

    function openSidebar() {
        sidebar.classList.add('sidebar--open');
        backdrop.classList.remove('sidebar__backdrop--hidden');
        document.body.classList.add('page--sidebar-open');
    }

    function closeSidebar() {
        sidebar.classList.remove('sidebar--open');
        backdrop.classList.add('sidebar__backdrop--hidden');
        document.body.classList.remove('page--sidebar-open');
    }

    document.getElementById('sidebar-toggle').addEventListener('click', openSidebar);
    document.getElementById('close-sidebar').addEventListener('click', closeSidebar);
    backdrop.addEventListener('click', closeSidebar);
}

export function initTheme() {
    const themeSelect = document.getElementById('theme-filter');
    const savedTheme = localStorage.getItem('theme') || 'system';

    themeSelect.value = savedTheme;
    applyTheme(savedTheme);

    themeSelect.addEventListener('change', (e) => {
        const theme = e.target.value;
        localStorage.setItem('theme', theme);
        applyTheme(theme);
    });

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

export async function renderPokemon(pokemonList, isFirstPage) {
    const grid = document.getElementById('pokedex-grid');

    if (isFirstPage) {
        grid.innerHTML = '';
    }

    if (pokemonList.length === 0 && isFirstPage) {
        grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--id-color); padding: 2rem;">Ничего не найдено</div>';
        return;
    }

    const fragment = document.createDocumentFragment();

    const translatedNames = await Promise.all(pokemonList.map(async (poke) => {
        let ruName = '';
        if (typeof pokemonRuNames !== 'undefined' && pokemonRuNames[poke.name]) {
            ruName = pokemonRuNames[poke.name];
        } else {
             ruName = await translateToRu(poke.name);
        }
        return { ...poke, ruName };
    }));

    translatedNames.forEach(poke => {
        const card = document.createElement('div');
        card.className = 'card';
        card.dataset.id = poke.id;

        const imgUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${poke.id}.png`;

        const typesHTML = poke.pokemon_v2_pokemontypes ? poke.pokemon_v2_pokemontypes.map(t => `<span class="type-badge type-${escapeHTML(t.pokemon_v2_type.name)}">${escapeHTML(t.pokemon_v2_type.name)}</span>`).join('') : '';

        card.innerHTML = `
            <div class="card__image-container">
                <img class="card__image" src="${escapeHTML(imgUrl)}" alt="${escapeHTML(poke.name)}" loading="lazy" onerror="this.style.display='none'">
            </div>
            <div class="card__id">#${escapeHTML(String(poke.id).padStart(3, '0'))}</div>
            <div class="card__name">${escapeHTML(poke.name)}</div>
            <div class="card__ru-name">${escapeHTML(poke.ruName)}</div>
            <div class="card__types">${typesHTML}</div>
        `;

        card.addEventListener('click', () => openModal(poke.id, poke.ruName));
        fragment.appendChild(card);
    });

    grid.appendChild(fragment);
}

export async function openModal(pokemonId, ruName) {
    const modal = document.getElementById('pokemon-modal');
    const modalBody = modal.querySelector('.modal__body');

    modal.classList.remove('modal--hidden');
    document.body.classList.add('page--modal-open');
    modalBody.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p class="loading__text">Загрузка данных...</p></div>';

    try {
        const data = await fetchGraphQL(getPokemonDetailsQuery, { id: pokemonId });

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


        let encounterHTML = '';
        try {
            if (typeof customLocations !== 'undefined' && customLocations[poke.name]) {
                encounterHTML = `<div class="encounter-details">
                                    <div class="encounter-game">Особый способ получения / Альтернативная форма</div>
                                    <div class="encounter-location">${escapeHTML(customLocations[poke.name])}</div>
                                 </div>`;
            } else {
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
                                <div class="encounter-game">${escapeHTML(g.games.split(', ').map(n => 'Pokémon ' + n).join(', '))}</div>
                                <div class="encounter-location">${escapeHTML(g.location)}</div>
                            </li>
                        `).join('') + `</ul>`;
                    }
                }

                if (!encounterHTML) {
                    const specy = poke.pokemon_v2_pokemonspecy;
                    let fallbackMessage = 'Способ получения неизвестен.';

                    if (specy) {
                        if (specy.is_legendary || specy.is_mythical) {
                            fallbackMessage = 'Легендарный или мифический покемон (получается в ходе сюжета или на специальных ивентах).';
                        } else if (specy.is_baby) {
                            fallbackMessage = 'Покемон-малыш (получается из яйца).';
                        } else if (specy.evolves_from_species_id) {
                            const preEvoId = specy.evolves_from_species_id;
                            let preEvoName = 'предыдущей формы';
                            if (specy.pokemon_v2_evolutionchain) {
                                const preEvoObj = specy.pokemon_v2_evolutionchain.pokemon_v2_pokemonspecies.find(s => s.id === preEvoId);
                                if (preEvoObj) {
                                    preEvoName = (typeof pokemonRuNames !== 'undefined' && pokemonRuNames[preEvoObj.name])
                                        ? pokemonRuNames[preEvoObj.name]
                                        : (preEvoObj.name.charAt(0).toUpperCase() + preEvoObj.name.slice(1));
                                }
                            }
                            fallbackMessage = `Эволюционирует из ${preEvoName}.`;
                        } else {
                             fallbackMessage = 'Возможно, стартовый покемон, ивентовый или доступен только через обмен.';
                        }
                    }

                    encounterHTML = `<div class="no-data">${escapeHTML(fallbackMessage)}</div>`;
                }
            }

        } catch(e) {
            console.error("Bulbapedia fetch error:", e);
            encounterHTML = `<div class="no-data">Не удалось загрузить данные из Bulbapedia.</div>`;
        }

        modalBody.innerHTML = `
            <div class="modal__header">
                <div class="modal__image-wrapper">
                    <img class="modal__image" src="${escapeHTML(imgUrl)}" alt="${escapeHTML(ruName)}" onerror="this.src='https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${escapeHTML(poke.id)}.png'">
                </div>
                <div class="modal__title-wrapper">
                    <div class="modal__id">#${escapeHTML(String(poke.id).padStart(3, '0'))}</div>
                    <h2 class="modal__name">${escapeHTML(poke.name)}</h2>
                    <h3 class="modal__ru-name">${escapeHTML(ruName)}</h3>
                </div>
            </div>

            <div class="modal__section">
                <h3>Описание</h3>
                <div class="modal__desc">${escapeHTML(flavorRu)}</div>
                ${flavorEn ? `<div class="modal__desc modal__desc--en">${escapeHTML(flavorEn)}</div>` : ''}
            </div>

            <div class="modal__section">
                <h3>Где найти</h3>
                ${encounterHTML}
            </div>
        `;

    } catch (error) {
        console.error("Modal Error:", error);
        modalBody.innerHTML = '<div class="no-data">Произошла ошибка при загрузке данных.</div>';
    }
}

export function setupModal() {
    const modal = document.getElementById('pokemon-modal');

    document.querySelector('.modal__close-btn').addEventListener('click', () => {
        modal.classList.add('modal--hidden');
        document.body.classList.remove('page--modal-open');
    });

    modal.addEventListener('click', (e) => {
        if (e.target.id === 'pokemon-modal') {
            e.target.classList.add('modal--hidden');
            document.body.classList.remove('page--modal-open');
        }
    });
}
