import { createContext, useContext } from "react";

const AppContext = createContext();
const useAppContext = () => useContext(AppContext);

export { AppContext, useAppContext };