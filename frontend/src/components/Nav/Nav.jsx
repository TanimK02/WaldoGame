import { useNavigate, useLocation } from "react-router-dom"
import styles from "./nav.module.css"
export default function Nav() {
    const navigate = useNavigate()
    const location = useLocation()

    return (
        <nav className={styles.nav}>
            <h2>Waldo Game</h2>
            <div className={styles.buttons}>
                <button className={location.pathname === "/play" || location.pathname === "/" ? styles.active : ""} onClick={() => navigate("/play")}>Play</button>
                <button className={location.pathname === "/leaderboard" ? styles.active : ""} onClick={() => navigate("/leaderboard")}>Leaderboard</button>
            </div>
        </nav>
    )
}