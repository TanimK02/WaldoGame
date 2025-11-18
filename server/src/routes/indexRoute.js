import { Router } from "express";
import { getMaps, initializeGame, validateCharacterClick, submitScore, getLeaderboard } from "../controllers/indexController.js";
const indexRoute = Router();

indexRoute.get("/maps", getMaps);
indexRoute.post("/game/initialize", initializeGame);
indexRoute.post("/game/validate", validateCharacterClick);
indexRoute.post("/leaderboard", submitScore);
indexRoute.get("/leaderboard", getLeaderboard);

export default indexRoute;