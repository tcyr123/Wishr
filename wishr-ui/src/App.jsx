import { useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const [count, setCount] = useState(0)
  const screenSize = useScreenSize();

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Header />
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>
          count is {count}
        </button>
        <p>
          Edit <code>src/App.jsx</code> and save to test HMR
        </p>
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
