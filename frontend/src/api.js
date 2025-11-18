const API_BASE = 'https://waldogame-production.up.railway.app/api';

let sessionId = null;

export async function getMaps() {
    const res = await fetch(`${API_BASE}/maps`, {
        includeCredentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch maps');
    const data = await res.json();
    return data.maps;
}

export async function initializeGame(mapId) {
    const res = await fetch(`${API_BASE}/game/initialize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mapId })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to initialize game');
    }
    const data = await res.json();
    if (data.sessionId) {
        sessionId = data.sessionId;
    }
    return data;
}

export async function validateCharacter(characterKey, clickCoords) {
    const headers = { 'Content-Type': 'application/json' };
    if (sessionId) {
        headers['X-Session-Id'] = sessionId;
    }
    const res = await fetch(`${API_BASE}/game/validate`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ characterKey, clickCoords })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to validate character');
    }
    return res.json();
}

export async function submitScore(playerName) {
    const headers = { 'Content-Type': 'application/json' };
    if (sessionId) {
        headers['X-Session-Id'] = sessionId;
    }
    const res = await fetch(`${API_BASE}/leaderboard`, {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({ playerName })
    });
    if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to submit score');
    }
    return res.json();
}

export async function getLeaderboard(mapId = null, page = 1) {
    const params = new URLSearchParams();
    if (mapId !== null) params.append('mapId', mapId);
    params.append('page', page);

    const res = await fetch(`${API_BASE}/leaderboard?${params}`, {
        includeCredentials: 'include'
    });
    if (!res.ok) throw new Error('Failed to fetch leaderboard');
    return res.json();
}