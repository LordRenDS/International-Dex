# Pokedex Project Knowledge Base & Agent Directives

## 1. Architecture & Tech Stack
* **Stack**: Vanilla JavaScript, HTML, and CSS only (no external frontend frameworks).
* **API**: Uses the PokéAPI GraphQL beta endpoint (`https://beta.pokeapi.co/graphql/v1beta`).
* **Images**: Uses 'official-artwork' sprites from PokéAPI for high-quality, standardized images across all UI elements, avoiding default pixel art.
* **Development & Testing**:
  * Local server: `python3 -m http.server 8000`.
  * Tests: Uses the native Node.js test runner (`node --test`), executed via `npm test` to minimize external dependencies.

## 2. PokéAPI & Error Handling
* **Null Safety**: PokéAPI data can contain null fields (e.g., `pokemon_v2_locationarea` for event/legendary Pokémon). Always use optional chaining (`?.`) and default fallback values during frontend rendering to prevent TypeErrors.
* **Game-Specific Filtering**: When querying for game-specific data, filtering should check encounters, flavor texts, and moves (using an `_or` clause) to accurately include all Pokémon (legendaries, starters, newer generations lack wild encounter data).

## 3. Localization & Data
* **UI/UX Requirements**: Minimalist UI design. The application interface and data must be localized into Russian.
* **Pokémon Names**: Primary Pokémon names MUST be displayed in English, with Russian provided as a secondary/supplementary name.
* **Name Translation**: Russian Pokémon names are translated using a local static dictionary (`js/data/pokemon_ru_names.js`). Fall back to Google Translate for missing entries.
* **Dynamic API Translation**: English PokéAPI data is dynamically translated into Russian using the Google Translate API. Translations MUST be executed concurrently (e.g., using `Promise.all`) rather than sequentially to prevent timeouts and API rate-limiting.
* **Search**: The PokéAPI GraphQL endpoint strictly uses English for the primary `name` field (`_ilike`). Cyrillic (Russian) searches require fetching larger datasets from the API and applying text-matching filters client-side.
* **Obtainment Methods**: Populated using a custom dictionary (`js/data/custom_locations.js`). Programmatic fallbacks rely on evolution chains, starter types, or legendary status data when specific location info is missing.

## 4. UI/UX Features
* **Theming**: Supports light, dark, and system themes managed via CSS variables and saved in `localStorage`.
* **Modals**: To prevent background scrolling when modals are open, use a `modal-open` CSS class on `document.body` that sets `overflow: hidden`.

## 5. Git & Workflow
* **Commits & Branches**: Use descriptive branch names and meaningful, focused commits.
* **Pull Requests**: If a pull request has already been approved or merged and subsequent changes are missing, DO NOT push to the old branch. Create a completely new branch from `main`, apply the new commits (e.g., via `cherry-pick`), and open a fresh pull request.
