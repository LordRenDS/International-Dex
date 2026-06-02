export async function fetchBulbapediaLocations(pokemonNameEn) {
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
