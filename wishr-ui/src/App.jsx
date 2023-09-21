import axios from 'axios';
import { useEffect, useState } from 'react';
import './App.css';
import Header from './components/header/Header';
import { API } from './constants';
import ScreenSizeContext from './contexts/ScreenSizeContext';
import useScreenSize from './hooks/useScreenSize';

function App() {
  const screenSize = useScreenSize();
  const [allData, setAllData] = useState()

  useEffect(() => {
    //onLoad, get all the data (temp)
    axios.get(`${API}/all`)
      .then(function (response) {
        console.table(response)
        setAllData(response)
      })
      .catch(function (error) {
        console.log(error);
      })
  }, [])

  return (
    <ScreenSizeContext.Provider value={screenSize}>
      <Header />
      <div className="card">
        <h3>The main dashboard</h3>
        {allData ? JSON.stringify(allData) : null}
      </div>
    </ScreenSizeContext.Provider>
  )
}

export default App
