const GRAPHQL_URL = 'https://beta.pokeapi.co/graphql/v1beta';

export async function fetchGraphQL(query, variables = {}) {
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
