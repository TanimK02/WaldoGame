import { AppContext } from "./context/context.js";

export function Provider({ children }) {
    return <AppContext.Provider value={{}}>{children}</AppContext.Provider>
}