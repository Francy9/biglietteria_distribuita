import React, { useEffect, useState } from 'react'
import { CheckCircle, Trash2, UserRoundPen } from "lucide-react";
import Sedie from '../componenti/Sala'
import Iscrizione from '../componenti/Aggiornamento'
import { useNavigate, useLocation, UNSAFE_createClientRoutesWithHMRRevalidationOptOut } from 'react-router-dom';
import './PrenotaBiglietto.css'
import './ValidaCancCambiaNomeBiglietto.css'
import RichiestaApi from '../componenti/RichiestaApi';
import CercaPerNome from '../componenti/CercaPerNome';
import PopupNominativo from '../componenti/PopupEsito';

function ValidaCancCambiaNomeBiglietto() {

  const [postiSelezionati, setPostiselezionati] = useState([]);
  const [idSelezionati, setIdSelezionati] = useState([]);
  const [postiOccupati, setPostiOccupati] = useState([]);
  const [reset, setReset] = useState(false)
  const[popup ,setMostraPopup] = useState(false);
  const[azionePopup, setAzionePopup] = useState();
  const[funzioneDaChiamare, setFunzioneDaChiamare] = useState();
  const [errore, setErrore] = useState('');
  const [numPosti, setNumPosti] = useState([]);
  const [modalita, setModalita] = useState('posti');
  const navigate = useNavigate();
  const location = useLocation()
  const { idEvento } = location.state
  const { postiTotali } = location.state
  const { nomeEvento } = location.state
  const { dataInizio } = location.state
  const { dataFine } = location.state


  useEffect(() =>{
    // Crea un nuovo array contenente solamente i posti occupati.
    const occupati = postiOccupati.filter((id) => id.occupato === true)
    occupati.length
    setNumPosti(occupati.length)
  }, [postiOccupati])

  // carica dal server tutti i posti dell'evento.
  useEffect(()=>{

    const caricaPosti = async () =>{
      // Effettua una richiesta GET per ottenere i posti dell'evento e il loro stato.
      const esito = await RichiestaApi({indirizzo:`/api/eventi/${idEvento}/posti`, metodo: 'GET'})

      if (esito?.tipo === 'Errore'){
        setErrore(esito.testo);
        return;
      }
        
      setErrore('');
      setPostiOccupati(esito.dati)
    }
    caricaPosti()
  },[])
 
 // Recupera dal server l'ID del biglietto associato a un determinato posto.
  const trovaIdTicket = async (Evento, posto) =>{
    const esito = await RichiestaApi({indirizzo:`/api/eventi/${Evento}/idTicket?posto=${posto}`, metodo: 'GET'})
        if (esito?.tipo === 'Errore'){
          return mostraStato('Errore', esito.testo);
        }
        return esito.dati.idBiglietto
  }
  // Valida uno o più biglietti selezionati.
  const validaBiglietto = async (selezionati) =>{
    // Scorre tutti gli elementi selezionati.
    for(const posto of selezionati){
      // Se modalità è 'posti', recupera l'ID del biglietto partendo dal posto.
      // Se modalità è 'nome', l'elemento selezionato è già l'ID del biglietto.
      const idTicket = modalita === 'posti'
      ? await trovaIdTicket(idEvento,posto)
      : posto
      if (idTicket === false) return false;
      
      const esito = await RichiestaApi({indirizzo:`/api/tickets/${idTicket}/valida`, metodo: 'POST'})
      if (esito?.tipo === 'Errore'){
        return mostraStato('Errore', esito.testo);
      }
    }
    azzera(); 
    return true
  }
  // Cancella uno o più biglietti selezionati.
  const cancellaBiglietto = async (selezionati) =>{
    for(const posto of selezionati){
      const idTicket = modalita === 'posti' 
      ? await trovaIdTicket(idEvento,posto) 
      : posto
      if (idTicket === false) return false;

      const esito = await RichiestaApi({indirizzo:`/api/tickets/${idTicket}`, metodo: 'DELETE'})
      if (esito?.tipo === 'Errore'){
        return mostraStato('Errore', esito.testo);
      }
    }
    azzera();
    return true
  }
  // Modifica l'intestatario di uno o più biglietti selezionati.
  const cambiaIntestatario = async (nuovoIntestatario, selezionati) =>{
    for(const posto of selezionati){
      const idTicket = modalita === 'posti'
      ? await trovaIdTicket(idEvento,posto)
      : posto
      const corpojson = JSON.stringify({ 
        acquirente: nuovoIntestatario 
      })
      if (idTicket === false) return false;

      const esito = await RichiestaApi({indirizzo:`/api/tickets/${idTicket}/holder`, metodo: 'PATCH', corpojson})
      if (esito?.tipo === 'Errore'){
        return mostraStato('Errore', esito.testo);
      }
    }
    azzera();
    return true
  }

// Azzera entrambe le selezioni e richiede il reset del componente Sedie.
const azzera = () =>{
  // Elimina i posti selezionati.
  setPostiselezionati([]) 
  // Elimina gli ID dei biglietti selezionati.
  setIdSelezionati([])
  
  setReset (!reset)
}
  
  // Cambia la modalità di selezione tra posti e nome.
  const cambiaModalita = (m) => {
  setModalita(m);
  // Azzera le selezioni quando si passa da una modalità all'altra.
  azzera()
};

// Mostra nel popup un messaggio.
const mostraStato = (tipo, testo) => {
  setErrore({ tipo: tipo, testo });
  setAzionePopup('esito');       
  setMostraPopup(true);
  // il popup di conferma non si chiude da solo
  return false;                  
};

const apriPopup = (azione, funzione) => {
  setErrore('');
  setAzionePopup(azione);
  setFunzioneDaChiamare(() => funzione);   
  setMostraPopup(true);
};

const selezionati = modalita === 'posti' ? postiSelezionati : idSelezionati;


  const viste = {
    posti: (<>
              <Sedie 
              inviaSelezione = {setPostiselezionati}
              postiDisponibili = {postiOccupati}
              visualizzaOccupati = {true}
              reset = {reset}
              />
            </> 
    ),
    nome:(<>
            <CercaPerNome
            idEvento = {idEvento}
            ticketSelezionato = {idSelezionati}
            setTicketSelezionato = {setIdSelezionati}
            />
          </> 
    )  

  };


  return (
    <main className="pagina-prenotazione">
      {/* riceve gli aggiornamenti dello stato dei biglietti di un determinato evento */}
      <Iscrizione
        iscrizione = {`biglietteria/eventi/${idEvento}`}
        funzione = {(datiArrivati) =>{
          setPostiOccupati((arrayPrev) => (
            arrayPrev.map((elemento) => {
              if (elemento.posto !== datiArrivati.posto) {
                return elemento;
              }

              if (datiArrivati.tipo === 'prenotato') {
                return { ...elemento, occupato: true };
              }

              if (datiArrivati.tipo === 'nuovo_acquirente') {
                return { ...elemento, occupato: true };
              } 

              if (datiArrivati.tipo === 'utilizzato') {
                return { ...elemento, occupato: true };
              }

              if (datiArrivati.tipo === 'cancellato') {
                return { ...elemento, occupato: false };
              }
              // Se nessuna condizione corrisponde, lascia tutto invariato
              return elemento;
            })
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
    <span className="seats-label">posti Occupati</span>
  </div>
</header>
      <div className="switch-modalita" role="tablist" aria-label="Modalità di selezione">
        <button
          type="button"
          role="tab"
          aria-selected={modalita === 'posti'}
          className={modalita === 'posti' ? 'switch-opzione attiva' : 'switch-opzione'}
          onClick={() => cambiaModalita('posti')}
        >
        Per posto
        </button>
        <button
        type="button"
        role="tab"
        aria-selected={modalita === 'nome'}
        className={modalita === 'nome' ? 'switch-opzione attiva' : 'switch-opzione'}
        onClick={() => cambiaModalita('nome')}
        >
        Per nome
        </button>
      </div>

      {viste[modalita]}

      <div className='azioni-prenotazione'>
        <button className = {'btn-valida'} 
          disabled = {selezionati.length === 0}
          onClick= {() => apriPopup('valida', () => validaBiglietto(selezionati))}>
          <CheckCircle size={26} strokeWidth={2} /> 
          Valida Biglietto
        </button>

        <button className = {'btn-cancella'} 
          disabled = {selezionati.length === 0}
          onClick= {() => apriPopup('cancella', () => cancellaBiglietto(selezionati))}>
          <Trash2 size={26} strokeWidth={2} /> 
          Cancella Biglietto
        </button>
        <button className = {'btn-Intestazione'} 
          disabled = {selezionati.length === 0}
          onClick= {() => apriPopup('cambiaIntestazione', (nome) => cambiaIntestatario(nome,selezionati))}>
            <UserRoundPen size={26} strokeWidth={2} />
            Cambia Intestazione 
            <br />
            Biglietto
        </button>
        </div>
        {/* Popup per confermare le operazioni. */}
          <PopupNominativo 
            chiamante = {azionePopup}
            apertura = {popup}
            setApertura = {setMostraPopup}
            funzione = {funzioneDaChiamare}
            esito = {errore}
        />
    </main>
        
  )
}
   
export default ValidaCancCambiaNomeBiglietto