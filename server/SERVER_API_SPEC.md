# Server API Specification

This document outlines all the API endpoints needed on the server side to replace the current client-side `api.js` functions.

## Base URL
All endpoints should be prefixed with your API base URL, e.g., `http://localhost:3000/api`

---

## Endpoints

### 1. Get All Maps
**Endpoint:** `GET /api/maps`

**Description:** Returns list of all available maps (without character coordinates)

**Response (200 OK):**
```json
{
  "maps": [
    { "id": 1, "name": "Map 1", "src": "/images/maps/1.jpg" },
    { "id": 2, "name": "Map 2", "src": "/images/maps/2.jpg" },
    { "id": 3, "name": "Map 3", "src": "/images/maps/3.jpg" }
  ]
}
```

---

### 2. Initialize Game
**Endpoint:** `POST /api/game/initialize`

**Description:** Creates a new game session and returns map data, session info, and character list (without coordinates)

**Request Body:**
```json
{
  "mapId": 1
}
```

**Response (200 OK):**
```json
{
  "map": {
    "id": 1,
    "name": "Map 1",
    "src": "/images/maps/1.jpg",
    "characters": [
    { "key": "waldo", "name": "Waldo" },
    { "key": "wizardWhitebeard", "name": "Wizard Whitebeard" }
  ]
  
}}
```

**Response Headers:**
```
Set-Cookie: sessionId=session_1234567890_abc123; HttpOnly; SameSite=Strict; Path=/
```

**Error Response (404 Not Found):**
```json
{
  "error": "Map not found"
}
```

**Server-side logic:**
- Validate mapId exists
- Generate unique session ID
- Store session with: id, mapId, startTime, charactersFound (object with all characters set to false), win: false, endTime: null
- Set session cookie in response headers (HttpOnly for security)
- Return map data, session info, and character list (names only, NO coordinates)

---

### 3. Validate Character Click
**Endpoint:** `POST /api/game/validate`

**Description:** Validates if a character was found at the clicked coordinates (server-side validation)

**Request Body:**
```json
{
  "characterKey": "waldo",
  "clickCoords": {
    "x": 0.35,
    "y": 0.52
  }
}
```

**Response (200 OK - Found, Not Won Yet):**
```json
{
  "found": true,
  "characterKey": "waldo",
  "allFound": false,
  "message": "Found waldo!"
}
```

**Response (200 OK - Found, Game Won):**
```json
{
  "found": true,
  "characterKey": "waldo",
  "allFound": true,
  "win": true,
  "sessionId": "session_1234567890_abc123",
  "time": 45,
  "message": "You won! Time: 45 seconds"
}
```

**Response (200 OK - Not Found):**
```json
{
  "found": false,
  "message": "Character not at that location"
}
```

**Error Responses:**
```json
404: { "error": "Session not found" }
400: { "error": "Game already won" }
400: { "error": "Invalid character" }
400: { "error": "Character already found" }
```

**Server-side logic:**
- Get session from request (cookie/header/token)
- Validate session exists
- Check if game already won
- Check if character is valid for this map
- Check if character already found
- Compare clickCoords with stored character coordinates (tolerance ~3%)
- If found: update session.charactersFound[characterKey] = true
- If all characters found: set session.win = true, session.endTime = Date.now()
- Calculate time: (endTime - startTime) / 1000
- Return appropriate response

**IMPORTANT:** Character coordinates NEVER leave the server!

---

### 4. Submit Score to Leaderboard
**Endpoint:** `POST /api/leaderboard`

**Description:** Submits a winning session to the leaderboard with player name

**Request Body:**
```json
{
  "playerName": "John Doe"
}
```

**Response (201 Created):**
```json
{
  "entry": {
    "id": "score_1234567890",
    "playerName": "John Doe",
    "mapId": 1,
    "time": 45,
    "timestamp": 1700000000000
  },
  "message": "Score submitted successfully!"
}
```

**Error Responses:**
```json
404: { "error": "Session not found" }
400: { "error": "Game not won yet" }
```

**Server-side logic:**
- Get session from request (cookie/header/token)
- Validate session exists and is won
- Calculate time from session: (endTime - startTime) / 1000
- Create leaderboard entry with: id, playerName, mapId, time, timestamp
- Save to database
- Return entry

---

### 5. Get Leaderboard
**Endpoint:** `GET /api/leaderboard`

**Description:** Returns paginated leaderboard, optionally filtered by map

**Query Parameters:**
- `mapId` (optional): Filter by specific map ID, omit for all maps
- `page` (optional): Page number, defaults to 1

**Examples:**
- `/api/leaderboard` - All maps, page 1
- `/api/leaderboard?mapId=1` - Map 1 only, page 1
- `/api/leaderboard?page=2` - All maps, page 2
- `/api/leaderboard?mapId=1&page=3` - Map 1 only, page 3

**Response:**
```json
{
  "scores": [
    {
      "id": "score_1234567890",
      "playerName": "John Doe",
      "mapId": 1,
      "time": 45,
      "timestamp": 1700000000000,
      "place": 1
    },
    {
      "id": "score_1234567891",
      "playerName": "Jane Smith",
      "mapId": 1,
      "time": 52,
      "timestamp": 1700000001000,
      "place": 2
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalScores": 47,
    "itemsPerPage": 10
  }
}
```

**Server-side logic:**
- Query leaderboard entries
- Filter by mapId if provided
- Sort by time ascending (fastest first)
- Paginate: 10 items per page
- Calculate pagination metadata
- Add `place` to each entry (1-indexed rank)
- Return scores and pagination info

---

## Database Schema

### Sessions Table/Collection
```javascript
{
  id: String (unique),
  mapId: Number,
  startTime: Number (timestamp),
  endTime: Number (timestamp, nullable),
  win: Boolean,
  charactersFound: {
    waldo: Boolean,
    wizardWhitebeard: Boolean,
    // ... other characters
  }
}
```

### Leaderboard Table/Collection
```javascript
{
  id: String (unique),
  playerName: String,
  mapId: Number,
  time: Number (seconds),
  timestamp: Number
}
```

### Character Coordinates (Server-Only, Never Exposed)
```javascript
{
  1: {
    waldo: { x: 0.3, y: 0.5 },
  },
  2: {
    wizardWhitebeard: { x: 0.25, y: 0.35 },
    odlaw: { x: 0.6, y: 0.45 },
  },
  3: {
    woof: { x: 0.1, y: 0.2 },
    waldo: { x: 0.5, y: 0.6 },
  }
}
```

---

## Express.js Example Routes Structure

```javascript
// routes/maps.js
router.get('/maps', getMaps);

// routes/game.js
router.post('/game/initialize', initializeGame);
router.post('/game/validate', validateCharacter);

// routes/leaderboard.js
router.post('/leaderboard', submitScore);
router.get('/leaderboard', getLeaderboard);
```

---

## Frontend Refactoring

Once your server is ready, replace all functions in `api.js` with fetch calls:

```javascript
const API_BASE = 'http://localhost:3000/api';

export async function getMaps() {
  const res = await fetch(`${API_BASE}/maps`);
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
  return res.json();
}

export async function validateCharacter(characterKey, clickCoords) {
  const res = await fetch(`${API_BASE}/game/validate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  const res = await fetch(`${API_BASE}/leaderboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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
  
  const res = await fetch(`${API_BASE}/leaderboard?${params}`);
  if (!res.ok) throw new Error('Failed to fetch leaderboard');
  return res.json();
}
```

---

## Security Considerations

1. **Character coordinates MUST stay server-side only**
2. Validate all session IDs before processing
3. Rate limit validation attempts to prevent brute force
4. Sanitize player names before storing
5. Consider adding authentication for future features
6. Use CORS properly if frontend/backend on different domains
7. Add request validation middleware
8. Consider adding session expiration (e.g., 1 hour timeout)

---

## Testing Checklist

- [ ] Can fetch all maps
- [ ] Can initialize game and get session
- [ ] Can validate correct character location
- [ ] Can reject incorrect character location
- [ ] Can detect when all characters found
- [ ] Can submit score after winning
- [ ] Can fetch paginated leaderboard
- [ ] Can filter leaderboard by map
- [ ] Character coordinates never exposed to client
- [ ] Sessions are properly stored and retrieved
- [ ] Leaderboard sorted correctly (fastest first)
