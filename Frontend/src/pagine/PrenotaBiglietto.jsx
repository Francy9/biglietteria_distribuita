import React, { useEffect, useState } from 'react'
import { Ticket } from "lucide-react";
import Sedie from '../componenti/Sala'
import Iscrizione from '../componenti/Aggiornamento'
import { useNavigate, useLocation, UNSAFE_createClientRoutesWithHMRRevalidationOptOut } from 'react-router-dom';
import './PrenotaBiglietto.css'
import RichiestaApi from '../componenti/RichiestaApi';
import PopupNominativo from '../componenti/PopupEsito';

function PrenotaBiglietto() {

  const [postiSelezionati, setPostiselezionati] = useState([]);
  const [postiDisponibili, setPostiDisponibili] = useState([]);
  const[azionePopup, setAzionePopup] = useState();
  const[popup ,setMostraPopup] = useState(false);
  const [errore, setErrore] = useState('');
  const [numPosti, setNumPosti] = useState([]);
  const navigate = useNavigate();
  const location = useLocation()
  const { idEvento } = location.state
  const { postiTotali } = location.state
  const { nomeEvento } = location.state
  const { dataInizio} = location.state
  const { dataFine } = location.state

      useEffect(() =>{
        // Filtra i posti mantenendo solamente quelli non occupati
        const liberi = postiDisponibili.filter((id) => id.occupato === false)
        liberi.length
        setNumPosti(liberi.length)
      }, [postiDisponibili])

      // recupera dal server i posti dell'evento
      useEffect(()=>{
          const caricaPosti = async () =>{
          // GET per ottenere tutti i posti associati all'evento
          const esito = await RichiestaApi({indirizzo:`/api/eventi/${idEvento}/posti`, metodo: 'GET'})
         if (esito?.tipo === 'Errore'){
            setErrore({tipo: 'Errore', testo: esito.testo});
            setAzionePopup('esito')
            setMostraPopup(true)
            
            return false;
         }

        setErrore('');
        setPostiDisponibili(esito.dati)
        
        }
        caricaPosti()
      },[])

          // invia al server la prenotazione dei posti selezionati
          const inviaPostiScelti = async (acquirente) =>{
            for(const posto of postiSelezionati){
              const corpojson = JSON.stringify({
                idEvento : idEvento,
                posto : posto,
                acquirente: acquirente
              })

              // Invia una richiesta POST al backend per prenotare il singolo posto
              const esito = await RichiestaApi({indirizzo:'/api/tickets', metodo: 'POST', corpojson})
              
              if (esito?.tipo === 'Errore'){
                setErrore({tipo: 'Errore', testo: esito.testo})
                setAzionePopup('esito')
                setMostraPopup(true)
                return false;
              }
            setErrore('');
            } 
          }


  return (
    <main className="pagina-prenotazione">
      {/* riceve gli aggiornamenti relativi ai posti dell'evento */}
      <Iscrizione
        iscrizione = {`biglietteria/eventi/${idEvento}`}
        funzione = {(datiArrivati) =>{
          setPostiDisponibili((arrayPrev) => (
            arrayPrev.map((elemento) => (
              elemento.posto === datiArrivati.posto ? {...elemento, occupato: datiArrivati.tipo === 'prenotato'} 
              : elemento
            ))
          ))
        }  
      }
      />
<header className="event-header">
  <button
    className="back-button"
    onClick={() => navigate(-1)}
    aria-label="Torna alla lista eventi"
    title="Torna alla lista eventi"
  >
    {/* disegno di una freccia tramite SVG */}
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor"
         strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 19l-7-7 7-7" />
    </svg>
  </button>

  <div className="event-info">
    <div className="event-meta">
      <span className="category-badge">prova</span>
      <time className="event-date">
        {new Date(Number(dataInizio) * 1000).toLocaleString("it-IT", {
          dateStyle: "long",
          timeStyle: "short",
        })}
      </time>
    </div>
    <h1 className="event-title">{nomeEvento}</h1>
  </div>

  <div className="event-seats">
    <span className="seats-number">{numPosti}</span>
    <span className="seats-label">posti</span>
  </div>
</header>
      
      <div>
            <Sedie 
            num_posti = {postiTotali}
            inviaSelezione = {setPostiselezionati}
            postiDisponibili = {postiDisponibili}
            />
      </div>
      <div className='azioni-prenotazione'>

        <button className = {'btn-prenota'} 
        disabled = {postiSelezionati.length === 0}
        onClick={() => {
          setErrore('');
          setAzionePopup('PrenotaBiglietto')
          setMostraPopup(true);
          
          }}> 
        <Ticket size={26} strokeWidth={2} />
        Prenota</button>
      </div>
      {/* Popup utilizzato per inserire il nominativo e mostrare il risultato */}
      <PopupNominativo 
        chiamante = {azionePopup}
        apertura = {popup}
        setApertura = {setMostraPopup}
        acquista = {inviaPostiScelti}
        esito = {errore}
      /> 

    </main>
        
  )
}
   
export default PrenotaBiglietto