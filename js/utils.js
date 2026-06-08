export const methodDictRu = {
    'walk': 'В высокой траве',
    'surf': 'Серфинг',
    'old-rod': 'Старая удочка',
    'good-rod': 'Хорошая удочка',
    'super-rod': 'Супер удочка',
    'gift': 'Подарок',
    'rock-smash': 'Разбивание камней',
    'headbutt': 'Удар головой'
};

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
