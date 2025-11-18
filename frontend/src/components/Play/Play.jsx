import styles from "./play.module.css"
import { useState, useEffect } from "react"
import { getMaps } from "../../api.js";
import { useNavigate } from "react-router-dom";
export default function Play() {
    const [selectedMap, setSelectedMap] = useState(null)
    const [maps, setMaps] = useState([]);
    const navigate = useNavigate();

    useEffect(() => {
        getMaps().then(data => setMaps(data));
    }, []);

    function navigateToMap(mapId) {
        navigate(`/map/${mapId}`);
    }
    return (
        <div className={styles.play}>
            <h1>Choose a Map</h1>
            <div className={styles.mapContainer}>
                {maps.map(map => (
                    <div
                        key={map.id}
                        className={`${styles.map} ${selectedMap === map.id ? styles.selected : ''}`}
                        style={{ backgroundImage: map.url ? `url(${map.url})` : 'none' }}
                        onClick={() => setSelectedMap(map.id)}
                    >
                        <span className={styles.mapName}>{map.name}</span>
                    </div>
                ))}
            </div>
            {selectedMap && <h2>You selected map: {selectedMap}</h2>}
            <div className={styles.buttonContainer}>
                <button
                    onClick={() => navigateToMap(selectedMap)}
                    className={styles.startButton}
                    disabled={!selectedMap}
                >
                    Start Game
                </button>
            </div>
        </div>
    )
}