import { useState } from 'react'
import './App.css'
import Nav from './components/Nav/Nav.jsx'
import { Routes, Route } from 'react-router-dom'
import Play from './components/Play/Play.jsx'
import Map from './components/Map/Map.jsx'
import Leaderboard from './components/Leaderboard/Leaderboard.jsx'
import AdminUpload from './components/AdminUpload/AdminUpload.jsx'

function App() {


  return (
    <>
      <Nav />
      <Routes>
        <Route path="/play" element={<Play />} />
        <Route path='/' element={<Play />} />
        <Route path='/map/:mapId' element={<Map />} />
        <Route path='/leaderboard' element={<Leaderboard />} />
        <Route path='/admin/upload' element={<AdminUpload />} />
      </Routes>
    </>
  )
}

export default App
