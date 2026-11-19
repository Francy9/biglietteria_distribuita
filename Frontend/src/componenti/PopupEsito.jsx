import React, { useEffect, useState, useRef } from 'react'
import "./PopupEsito.css"
function PopupEsito({chiamante, apertura,setApertura, ...dati}) {

const[nominativo, setNominativo] = useState('')
const [inCorso, setInCorso] = useState(false)

const esegui = async (azione) => {
  if (inCorso) return            // ignora i click mentre è già in corso
  setInCorso(true)
  try {
    await azione()
  } finally {
    setInCorso(false)            // spegne la rotella anche se c'è un errore
  }
}

// possibilità di chiudere il popup premendo il tasto ESC della tastiera
useEffect(() => {
  if (!apertura) return
  const chiudi = (e) => { if (e.key === 'Escape' && !inCorso) setApertura(false) }
  window.addEventListener('keydown', chiudi)
  return () => window.removeEventListener('keydown', chiudi)
}, [apertura, inCorso])

// con useRef iniziatoSulSfondo mantiene il valore anche quando il componente viene aggiornato
// serve a ricordare dove è iniziato il click del mouse
const iniziatoSulSfondo = useRef(false);

  // Variabile che conterrà il l'intestazione da mostrare nel popup
  // Il contenuto cambia in base al chiamante
  let intestazione
  switch (chiamante){
    
    case 'PrenotaBiglietto':
       intestazione = (
        <>
        <span className = {`intestazione ${chiamante}`}>Prenotazione</span>
        <h2 className = {`titolo-${chiamante}`} >{'Intesta il biglietto'}</h2> 
        <input type='text' 
        className = {`input ${chiamante}`}
        value={nominativo} 
        onChange={e => setNominativo(e.target.value)} 
        placeholder='inserisci nominativo biglietto'/>
        <button className = {`btn ${chiamante}`}  
        onClick={() => esegui(async () => {
          const ok = await dati.acquista(nominativo)
          if (ok !== false) setApertura(false)
        })}>Prenota!</button>
        </>
       ); 
      break;

    case 'valida':
       intestazione = (
        <>
        <span className = {`intestazione ${chiamante}`}>Valida Biglietto</span>
        <h2 className = {`titolo-${chiamante}`} >{'Valida il tuo Biglietto'}</h2> 
        <div className="popup-actions">
          <button className = {`btn ${chiamante}`}  
            onClick={() => esegui(async () => {
              // Richiama la funzione ricevuta e attende il risultato
              const ok = await dati.funzione()
              // Se il risultato non è false, chiude il popup
              if (ok !== false) setApertura(false)
            })}>
              Valida!</button>
          <button className= {`btn annulla ${chiamante}`}onClick={() => setApertura(false)}>Annulla</button>
        </div>
        </>
       )
      break;
    case 'cancella':
       intestazione = (
        <>
        <span className = {`intestazione ${chiamante}`}>Cancella Biglietto</span>
        <h2 className = {`titolo-${chiamante}`} >{'cancellare il Biglietto?'}</h2>
        <div className="popup-actions">
          <button className = {`btn ${chiamante}`}  
            onClick={() => esegui(async () => {
              const ok = await dati.funzione()
              if (ok !== false) setApertura(false)
            })}>
                  Cancella!
          </button>
          <button className= {`btn annulla ${chiamante}`}onClick={() => setApertura(false)}>Annulla</button>
        </div> 
        
        </>
       )
      break;
    case 'cambiaIntestazione':
      if(!dati.esito){
       intestazione = (
        <>
        <span className = {`intestazione ${chiamante}`}>Cambia Intestatario Biglietto</span>
        <h2 className = {`titolo-${chiamante}`} >{'Nuovo Intestatario del Biglietto'}</h2> 
        <input type='text' 
        className = {`input ${chiamante}`}
        value={nominativo} 
        onChange={e => setNominativo(e.target.value)} 
        placeholder='inserisci nominativo biglietto'/>
        <div className="popup-actions">
          <button className = {`btn ${chiamante}`}  
            onClick={() => esegui(async () => {
              const ok = await dati.funzione(nominativo)
              if (ok !== false) setApertura(false)
            })}>
            Cambia intestatario!
          </button>
          <button className= {`btn annulla ${chiamante}`}onClick={() => setApertura(false)}>Annulla</button>
        </div>
        
        </>
        
       ); 
      }
      break;
    default:
     intestazione = (
        <>
        <h2 className = {`titolo-Evento ${chiamante}`} >
            {dati.esito?.tipo === 'ok' ? 'Fatto' : 'Errore'}</h2>
        <p className = {`Esito-Evento ${chiamante}`}>
          {dati.esito?.testo}</p>
        </>
       );

  }

if (!apertura) return null
  return ( 
  <div className="popup-sfondo" 

  // onMouseDown viene eseguito quando si preme il pulsante del mouse
    onMouseDown={(e) => {

      // Memorizza true se il click è iniziato sullo sfondo esterno
      // e non sul contenuto interno del popup
      //e.target é il div che effettivamente si clicca 
      //e.currentTarget è il div dello sfondo quindi : div.popup-sfondo
      iniziatoSulSfondo.current = e.target === e.currentTarget;
    }}

    // onClick viene eseguito quando si rilascia il click
    onClick={(e) => {
      // Controlla tre condizioni:
        // 1. Il click è avvenuto sullo sfondo esterno
        // 2. Anche la pressione del mouse era iniziata sullo sfondo
        // 3. Non è in corso un'operazione
      if (
        e.target === e.currentTarget &&
        iniziatoSulSfondo.current && 
        !inCorso
      ) {
        // Se tutte le condizioni sono vere, chiude il popup
        setApertura(false);
      }
      // Azzera il riferimento dopo il click
      iniziatoSulSfondo.current = false;
    }}>
    <div
      className={dati.esito?.tipo === 'ok' || dati.esito?.tipo === undefined ? 'popup' : 'popup Errore'}
      onClick={(e) => e.stopPropagation()}
    >
      {intestazione}
      
      <button className= {`chiudi-popup ${chiamante}`}onClick={() => setApertura(false)}>Chiudi</button>
    
    {inCorso && (
      <div className="popup-caricamento">
        <div className="rotella" />
      </div>
    )}
    
    </div>
  </div>
  )
  
}

export default PopupEsito