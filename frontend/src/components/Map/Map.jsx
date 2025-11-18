import { useParams, useNavigate } from "react-router-dom";
import { initializeGame, validateCharacter, submitScore, getLeaderboard } from "../../api.js";
import styles from "./Map.module.css";
import { useImageClick } from "./useImgClick.jsx";
import { useState, useEffect } from "react";

export default function Map() {
    const { mapId } = useParams();
    const navigate = useNavigate();
    const [map, setMap] = useState(null);
    const [characters, setCharacters] = useState([]);
    const [charactersFound, setCharactersFound] = useState({});
    const [message, setMessage] = useState(null);
    const [gameWon, setGameWon] = useState(false);
    const [winTime, setWinTime] = useState(null);
    const [showLeaderboard, setShowLeaderboard] = useState(false);
    const [leaderboard, setLeaderboard] = useState([]);
    const [playerName, setPlayerName] = useState("");
    const [showNamePrompt, setShowNamePrompt] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const { imgRef, clickCoords, menuPosition, handleImageClick, clearClick } = useImageClick();

    // Initialize game - get map, session, and characters all at once
    useEffect(() => {
        if (mapId) {
            initializeGame(mapId).then(gameData => {
                setMap(gameData.map);
                setCharacters(gameData.characters);
                const foundState = {};
                gameData.characters.forEach(char => foundState[char.key] = false);
                setCharactersFound(foundState);
            }).catch(error => {
                console.error('Failed to initialize game:', error);
            });
        }
    }, [mapId]);

    // Timer effect
    useEffect(() => {
        if (!map || gameWon) return;

        const interval = setInterval(() => {
            setElapsedTime(prev => prev + 1);
        }, 1000);

        return () => clearInterval(interval);
    }, [map, gameWon]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCharacterSelect = async (characterKey) => {
        if (!clickCoords) return;

        try {
            const result = await validateCharacter(characterKey, clickCoords);

            if (result.found) {
                setCharactersFound(prev => ({ ...prev, [characterKey]: true }));
                setMessage(`Found ${characterKey}! ✓`);

                if (result.win) {
                    setGameWon(true);
                    setWinTime(result.time);
                    setShowNamePrompt(true);
                }
            } else {
                setMessage("Not here! Try again.");
            }
        } catch (error) {
            console.error('Validation error:', error);
            setMessage(error.message || "Error validating character. Try again.");
        }

        clearClick();
        setTimeout(() => setMessage(null), 2000);
    };

    const handleSubmitScore = async () => {
        if (playerName.trim()) {
            try {
                await submitScore(playerName.trim());
                setShowNamePrompt(false);
                const data = await getLeaderboard(parseInt(mapId));
                setLeaderboard(data.scores);
                setShowLeaderboard(true);
            } catch (error) {
                console.error('Failed to submit score:', error);
            }
        }
    };

    const handleViewLeaderboard = async () => {
        try {
            const data = await getLeaderboard(parseInt(mapId));
            setLeaderboard(data.scores);
            setShowLeaderboard(true);
        } catch (error) {
            console.error('Failed to load leaderboard:', error);
        }
    };

    const handlePlayAgain = async () => {
        // Reset all game state
        setShowLeaderboard(false);
        setShowNamePrompt(false);
        setGameWon(false);
        setWinTime(null);
        setElapsedTime(0);
        setPlayerName("");
        setMessage(null);
        clearClick();

        // Reinitialize the game
        try {
            const gameData = await initializeGame(mapId);
            setMap(gameData.map);
            setCharacters(gameData.characters);
            const foundState = {};
            gameData.characters.forEach(char => foundState[char.key] = false);
            setCharactersFound(foundState);
        } catch (error) {
            console.error('Failed to restart game:', error);
        }
    };

    if (!map) return <div className={styles.mapPage}><h1>Map not found</h1></div>;

    return (
        <div className={styles.mapPage}>
            <div className={styles.header}>
                <h1>{map.name}</h1>
                <div className={styles.timer}>
                    Time: {formatTime(elapsedTime)}
                </div>
                <div className={styles.characterList}>
                    {characters.map(char => (
                        <div
                            key={char.key}
                            className={`${styles.characterTag} ${charactersFound[char.key] ? styles.found : ''}`}
                        >
                            {char.imageUrl && (
                                <img
                                    src={char.imageUrl}
                                    alt={char.name}
                                    className={styles.characterImage}
                                />
                            )}
                            <span>{char.name} {charactersFound[char.key] && '✓'}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.imageContainer}>
                <img
                    ref={imgRef}
                    onClick={handleImageClick}
                    src={map.url}
                    alt={map.name}
                    className={styles.mapImage}
                />

                {menuPosition && (
                    <div
                        className={styles.characterMenu}
                        style={{ left: `${menuPosition.x}px`, top: `${menuPosition.y}px` }}
                    >
                        <div className={styles.menuTitle}>Who is here?</div>
                        {characters.map(char => (
                            !charactersFound[char.key] && (
                                <button
                                    key={char.key}
                                    className={styles.menuButton}
                                    onClick={() => handleCharacterSelect(char.key)}
                                >
                                    {char.name}
                                </button>
                            )
                        ))}
                        <button className={styles.menuCancel} onClick={clearClick}>Cancel</button>
                    </div>
                )}
            </div>

            {message && (
                <div className={styles.message}>
                    {message}
                </div>
            )}

            {showNamePrompt && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>🎉 You Won!</h2>
                        <p>Time: {winTime} seconds</p>
                        <input
                            type="text"
                            placeholder="Enter your name"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className={styles.nameInput}
                            maxLength={20}
                        />
                        <div className={styles.modalButtons}>
                            <button onClick={handleSubmitScore} className={styles.submitButton}>
                                Submit Score
                            </button>
                            <button onClick={() => navigate('/')} className={styles.skipButton}>
                                Back to Maps
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showLeaderboard && (
                <div className={styles.modal}>
                    <div className={styles.modalContent}>
                        <h2>🏆 Leaderboard</h2>
                        <div className={styles.leaderboardList}>
                            {leaderboard.length === 0 ? (
                                <p>No scores yet!</p>
                            ) : (
                                leaderboard.map(entry => (
                                    <div key={entry.id} className={styles.leaderboardEntry}>
                                        <span className={styles.place}>#{entry.place}</span>
                                        <span className={styles.name}>{entry.playerName}</span>
                                        <span className={styles.time}>{entry.time}s</span>
                                    </div>
                                ))
                            )}
                        </div>
                        <div className={styles.modalButtons}>
                            <button onClick={() => navigate('/')} className={styles.closeButton}>
                                Back to Maps
                            </button>
                            <button onClick={handlePlayAgain} className={styles.submitButton}>
                                Play Again
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}