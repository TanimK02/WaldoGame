// Load environment variables from .env during app startup
import express from "express";
import dotenv from 'dotenv';
import cors from 'cors';
import { Router } from "express";
import session from "express-session";
import prisma from "./prisma/prisma.js";
import { PrismaSessionStore } from "@quixo3/prisma-session-store";
import indexRoute from "./routes/indexRoute.js";
import uploadRoute from "./routes/uploadRoute.js";

const api = Router();
dotenv.config();
const app = express();

// Trust Railway proxy
app.set('trust proxy', 1);

app.use(cors({
    origin: ['http://localhost:5173', 'https://waldo-game.vercel.app', 'https://waldogame-production.up.railway.app'],
    credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        maxAge: 1000 * 60 * 60,
        secure: true,
        sameSite: 'none',
    },
    store: new PrismaSessionStore(prisma, {
        checkPeriod: 2 * 60 * 1000,
        dbRecordIdIsSessionId: true,
        sessionModelName: 'session',
        dbRecordIdFunction: undefined,
    }),
}));

api.use("/", indexRoute);
api.use("/admin", uploadRoute);

app.use("/api", api);


app.keepAliveTimeout = 61 * 1000;
app.headersTimeout = 65 * 1000;
const PORT = 3000;
app.listen(process.env.PORT || PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${process.env.PORT || PORT} go to http://localhost:${process.env.PORT || PORT}/api`);
});