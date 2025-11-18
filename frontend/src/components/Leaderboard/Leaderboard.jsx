import { useState, useEffect } from "react";
import { getMaps, getLeaderboard } from "../../api.js";
import styles from "./Leaderboard.module.css";

export default function Leaderboard() {
    const [maps, setMaps] = useState([]);
    const [selectedMapId, setSelectedMapId] = useState(null);
    const [leaderboardData, setLeaderboardData] = useState({ scores: [], pagination: {} });
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        getMaps().then(data => setMaps(data));
    }, []);

    useEffect(() => {
        getLeaderboard(selectedMapId, currentPage).then(data => {
            setLeaderboardData(data);
        });
    }, [selectedMapId, currentPage]);

    const handleMapChange = (e) => {
        const value = e.target.value;
        setSelectedMapId(value === "all" ? null : parseInt(value));
        setCurrentPage(1);
    };

    const handlePageChange = (newPage) => {
        setCurrentPage(newPage);
    };

    const { scores, pagination } = leaderboardData;

    return (
        <div className={styles.leaderboardPage}>
            <div className={styles.header}>
                <h1>🏆 Leaderboard</h1>
                <div className={styles.filterSection}>
                    <label htmlFor="mapFilter">Filter by Map:</label>
                    <select
                        id="mapFilter"
                        value={selectedMapId === null ? "all" : selectedMapId}
                        onChange={handleMapChange}
                        className={styles.mapSelect}
                    >
                        <option value="all">All Maps</option>
                        {maps.map(map => (
                            <option key={map.id} value={map.id}>
                                {map.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className={styles.leaderboardContainer}>
                {scores.length === 0 ? (
                    <div className={styles.noScores}>
                        <p>No scores yet! Be the first to play!</p>
                    </div>
                ) : (
                    <>
                        <div className={styles.leaderboardHeader}>
                            <span className={styles.headerPlace}>Rank</span>
                            <span className={styles.headerName}>Player</span>
                            <span className={styles.headerMap}>Map</span>
                            <span className={styles.headerTime}>Time</span>
                        </div>
                        {scores.map(entry => {
                            const map = maps.find(m => m.id === entry.mapId);
                            return (
                                <div key={entry.id} className={styles.leaderboardEntry}>
                                    <span className={`${styles.place} ${entry.place <= 3 ? styles[`place${entry.place}`] : ''}`}>
                                        #{entry.place}
                                    </span>
                                    <span className={styles.name}>{entry.playerName}</span>
                                    <span className={styles.mapName}>{map?.name || `Map ${entry.mapId}`}</span>
                                    <span className={styles.time}>{entry.time}s</span>
                                </div>
                            );
                        })}
                    </>
                )}
            </div>

            {pagination.totalPages > 1 && (
                <div className={styles.pagination}>
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className={styles.pageButton}
                    >
                        Previous
                    </button>
                    <span className={styles.pageInfo}>
                        Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === pagination.totalPages}
                        className={styles.pageButton}
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}
