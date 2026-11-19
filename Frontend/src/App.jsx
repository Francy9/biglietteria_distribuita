import { useEffect } from 'react'
import './App.css'
import { Link, NavLink, Route, Routes } from 'react-router-dom'
import Home from './pagine/Home';
import GeneraEvento from './pagine/GeneraEvento'
import PrenotaBiglietto from './pagine/PrenotaBiglietto';
import Eventi from './pagine/Eventi';
import Logo from './assets/logo.svg?react';
import SelEventiModBiglietto from './pagine/SelEventiModBiglietto';
import ValidaCancCambiaNomeBiglietto from './pagine/ValidaCancCambiaNomeBiglietto';
    
function App() {
  return (
    <>
      <header className="navbar">
        <nav className="navbar-inner">

           {/* NAVLINK DEL LOGO:
              cliccando sul logo o sulla scritta Biglietteria
              si torna alla pagina iniziale */}
          <NavLink to="/" end className="nav-brand">
          <Logo className="nav-logo" />
          <span>Biglietteria</span>
          </NavLink>
          <div className="nav-links">
            <NavLink to="/" end className="nav-link">Home</NavLink>
            <NavLink to="/Eventi" className="nav-link">Eventi</NavLink>
            <NavLink to="/GeneraEvento" className="nav-link">Genera Evento</NavLink>
          </div>
        </nav>
      </header>
      
      {/* ROUTES:
          contiene tutte le rotte dell'applicazione.
          In base all'indirizzo URL, React Router
          decide quale componente visualizzare */}
    <Routes>
      <Route path='/' element={<Home />}/>
      <Route path='/GeneraEvento' element={<GeneraEvento />}/>
      <Route path='/Eventi' element={<Eventi />}/>
      <Route path='/SelEventiModBiglietto' element={<SelEventiModBiglietto />}/>
      <Route path='Eventi/PrenotaBiglietto' element={<PrenotaBiglietto />}/>
      <Route path='/SelEventiModBiglietto/ValidaCancNomeBiglietto' element={<ValidaCancCambiaNomeBiglietto />}/>
    </Routes>
    </>
  )
}

export default App
