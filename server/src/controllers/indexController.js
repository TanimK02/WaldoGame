import prisma from "../prisma/prisma.js";

export const getMaps = async (req, res) => {
    try {
        const maps = await prisma.map.findMany();
        res.json({ maps });
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch maps" });
    }
};

export const initializeGame = async (req, res) => {
    const { mapId } = req.body;
    const parsedMapId = parseInt(mapId);
    if (isNaN(parsedMapId)) {
        return res.status(400).json({ message: "Invalid mapId" });
    }

    let map;
    try {
        map = await prisma.map.findUnique({
            where: { id: parsedMapId },
            include: { characters: true }
        });
        if (!map) {
            return res.status(404).json({ message: "Map not found" });
        }

        // Reset session for new game
        req.session.mapId = parsedMapId;
        req.session.startTime = Date.now();
        req.session.win = false;
        req.session.endTime = null;

    } catch (error) {
        return res.status(500).json({ message: "Failed to initialize game" });
    }

    const charactersFound = {};
    map.characters.forEach(char => {
        charactersFound[char.key] = false;
    });

    req.session.charactersFound = charactersFound;

    const characters = map.characters.map(char => ({
        key: char.key,
        name: char.name,
        imageUrl: char.imageUrl
    }));

    // Save session explicitly
    req.session.save((err) => {
        if (err) {
            console.error('Session save error:', err);
            return res.status(500).json({ message: "Failed to save session" });
        }

        return res.status(200).json({
            sessionId: req.sessionID,
            map: {
                id: map.id,
                name: map.name,
                url: map.url
            },
            characters
        });
    });
};

export const validateCharacterClick = async (req, res) => {
    const { characterKey, clickCoords } = req.body;
    const session = req.session;
    
    console.log('Validate request - Session ID:', req.sessionID);
    console.log('Validate request - Session data:', session);
    
    if (!characterKey || !clickCoords || typeof clickCoords.x !== 'number' || typeof clickCoords.y !== 'number') {
        return res.status(400).json({ error: "Invalid request body" });
    }
    if (!session || !session.mapId) {
        console.log('Session not found or no mapId');
        return res.status(404).json({ error: "Session not found" });
    }

    if (session.win) {
        return res.status(400).json({ error: "Game already won" });
    }

    if (session.charactersFound[characterKey] === undefined) {
        return res.status(400).json({ error: "Invalid character" });
    }

    if (session.charactersFound[characterKey] === true) {
        return res.status(400).json({ error: "Character already found" });
    }


    const mapId = session.mapId;
    let character;
    try {
        const map = await prisma.map.findUnique({
            where: { id: mapId },
            include: { characters: true }
        });
        character = map.characters.find(char => char.key === characterKey);
        if (!character) {
            return res.status(400).json({ error: "Invalid character" });
        }
    } catch (error) {
        return res.status(500).json({ error: "Failed to validate character" });
    }
    const { x, y } = character;
    const tolerance = 0.02;

    const dx = clickCoords.x - x;
    const dy = clickCoords.y - y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    const found = distance <= tolerance;


    if (found) {
        session.charactersFound[characterKey] = true;

        const allFound = Object.values(session.charactersFound).every(val => val === true);

        if (allFound) {
            session.win = true;
            session.endTime = Date.now();
            const timeInSeconds = Math.floor((session.endTime - session.startTime) / 1000);

            return res.status(200).json({
                found: true,
                characterKey,
                allFound: true,
                win: true,
                sessionId: session.id,
                time: timeInSeconds,
                message: `You won! Time: ${timeInSeconds} seconds`
            });
        }

        return res.status(200).json({
            found: true,
            characterKey,
            allFound: false,
            message: `Found ${characterKey}!`
        });
    }

    return res.status(200).json({
        found: false,
        message: "Character not at that location"
    });
};


// ### 4. Submit Score to Leaderboard
// **Endpoint:** `POST /api/leaderboard`

// **Description:** Submits a winning session to the leaderboard with player name

// **Request Body:**
// ```json
// {
//   "playerName": "John Doe"
// }
// ```

// **Response (201 Created):**
// ```json
// {
//   "entry": {
//     "id": "score_1234567890",
//     "playerName": "John Doe",
//     "mapId": 1,
//     "time": 45,
//     "timestamp": 1700000000000
//   },
//   "message": "Score submitted successfully!"
// }
// ```

// **Error Responses:**
// ```json
// 404: { "error": "Session not found" }
// 400: { "error": "Game not won yet" }
// ```

// **Server-side logic:**
// - Get session from request (cookie/header/token)
// - Validate session exists and is won
// - Calculate time from session: (endTime - startTime) / 1000
// - Create leaderboard entry with: id, playerName, mapId, time, timestamp
// - Save to database
// - Return entry

// ---

// ### 5. Get Leaderboard
// **Endpoint:** `GET /api/leaderboard`

// **Description:** Returns paginated leaderboard, optionally filtered by map

// **Query Parameters:**
// - `mapId` (optional): Filter by specific map ID, omit for all maps
// - `page` (optional): Page number, defaults to 1

// **Examples:**
// - `/api/leaderboard` - All maps, page 1
// - `/api/leaderboard?mapId=1` - Map 1 only, page 1
// - `/api/leaderboard?page=2` - All maps, page 2
// - `/api/leaderboard?mapId=1&page=3` - Map 1 only, page 3

// **Response:**
// ```json
// {
//   "scores": [
//     {
//       "id": "score_1234567890",
//       "playerName": "John Doe",
//       "mapId": 1,
//       "time": 45,
//       "timestamp": 1700000000000,
//       "place": 1
//     },
//     {
//       "id": "score_1234567891",
//       "playerName": "Jane Smith",
//       "mapId": 1,
//       "time": 52,
//       "timestamp": 1700000001000,
//       "place": 2
//     }
//   ],
//   "pagination": {
//     "currentPage": 1,
//     "totalPages": 5,
//     "totalScores": 47,
//     "itemsPerPage": 10
//   }
// }
// ```

// **Server-side logic:**
// - Query leaderboard entries
// - Filter by mapId if provided
// - Sort by time ascending (fastest first)
// - Paginate: 10 items per page
// - Calculate pagination metadata
// - Add `place` to each entry (1-indexed rank)
// - Return scores and pagination info

// ---

export const submitScore = async (req, res) => {
    const { playerName } = req.body;
    const session = req.session;

    if (!session) {
        return res.status(404).json({ error: "Session not found" });
    }

    if (!session.win) {
        return res.status(400).json({ error: "Game not won yet" });
    }

    const timeInSeconds = Math.floor((session.endTime - session.startTime) / 1000);

    try {
        const entry = await prisma.leaderboardEntry.create({
            data: {
                playerName,
                mapId: session.mapId,
                timeTaken: timeInSeconds
            }
        });
        return res.status(201).json({
            entry: {
                id: entry.id,
                playerName: entry.playerName,
                mapId: entry.mapId,
                time: entry.timeTaken,
                timestamp: entry.createdAt.getTime()
            },
            message: "Score submitted successfully!"
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to submit score" });
    }
}

export const getLeaderboard = async (req, res) => {
    const mapId = req.query.mapId ? parseInt(req.query.mapId) : null;
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const itemsPerPage = 10;

    let whereClause = {};
    if (mapId !== null && !isNaN(mapId)) {
        whereClause.mapId = mapId;
    }

    try {
        const totalScores = await prisma.leaderboardEntry.count({
            where: whereClause
        });

        const totalPages = Math.ceil(totalScores / itemsPerPage);
        const offset = (page - 1) * itemsPerPage;

        const scores = await prisma.leaderboardEntry.findMany({
            where: whereClause,
            orderBy: { timeTaken: 'asc' },
            skip: offset,
            take: itemsPerPage
        });

        const scoresWithPlace = scores.map((entry, index) => ({
            id: entry.id,
            playerName: entry.playerName,
            mapId: entry.mapId,
            time: entry.timeTaken,
            timestamp: entry.createdAt.getTime(),
            place: offset + index + 1
        }));

        return res.json({
            scores: scoresWithPlace,
            pagination: {
                currentPage: page,
                totalPages,
                totalScores,
                itemsPerPage
            }
        });
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch leaderboard" });
    }
} 