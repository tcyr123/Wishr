import { createContext, useContext } from 'react';

const ScreenSizeContext = createContext();

export function useScreenSizeContext() {
    return useContext(ScreenSizeContext);
}

export default ScreenSizeContext;
