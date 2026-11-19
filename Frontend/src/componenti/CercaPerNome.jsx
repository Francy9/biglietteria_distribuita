import React, { useEffect, useState } from 'react'
import RichiestaApi from './RichiestaApi'
import Iscrizione from './Aggiornamento'
import './CercaPerNome.css'

 // permette di cercare i biglietti tramite il nome dell'acquirente
function CercaPerNome({idEvento,ticketSelezionato, setTicketSelezionato}) {

    const [nomeAcquirente, setNomeAcquirente] = useState('')
    const [errore, setErrore] = useState()
    const [biglietti, setBiglietti] = useState([])
    // useEffect esegue il caricamento dei biglietti quando il componente viene montato
    useEffect(() => {
        const bigliettiPrenotati = async () => {
            // Effettua una richiesta GET all'API passando l'id dell'evento
            const risultato = await RichiestaApi({indirizzo: `/api/tickets/bigliettiPrenotati/${idEvento}`, metodo: 'GET'})
            if (risultato?.tipo === 'Errore'){
                setErrore(risultato.testo);
                return;
            }
            setErrore('')
            setBiglietti(risultato.dati)
        } 
        bigliettiPrenotati()
    },[])

    // Filtra i biglietti confrontando il nome dell'acquirente
    // con quello inserito dall'utente nel campo di ricerca
    const bigliettiAcquirente = biglietti.filter((bigl) => bigl.nomeAcquirente === nomeAcquirente)

    return (
    <section className="ricerca-nome">
        <Iscrizione
            iscrizione = {`biglietteria/eventi/${idEvento}`} 
            funzione={(nuovoBiglietto) =>{
                setBiglietti((prec) =>{
                    // Controlla se il biglietto ricevuto è già presente nell'array
                    const esiste = prec.some((ticket) => ticket.idBiglietto === nuovoBiglietto.idBiglietto);
                    
                    // Se il biglietto non esiste, lo aggiunge all'array
                    if (!esiste) {
                        return [...prec, nuovoBiglietto];
                    }
                    // Se il biglietto esiste già, cerca quello da aggiornare
                    return prec.map((elem) => {

                        // Se l'id è diverso, restituisce il biglietto senza modificarlo
                        if(elem.idBiglietto !== nuovoBiglietto.idBiglietto){
                            return elem
                        }
                        // Se il tipo è nuovo_acquirente, aggiorna il nome dell'acquirente
                        if(nuovoBiglietto.tipo === 'nuovo_acquirente'){
                            return {...elem, nomeAcquirente : nuovoBiglietto.nomeAcquirente}
                        }
                        // Negli altri casi aggiorna lo stato del biglietto
                        return {...elem, stato : nuovoBiglietto.stato}
                    })  
                    
                }) 
            }}
        />   
      <span className="ricerca-badge">Ricerca</span>
      <h2 className="ricerca-title">Inserisci nome acquirente</h2>

      <input
        className="ricerca-input"
        type="text"
        placeholder="Es. Mario Rossi"
        value={nomeAcquirente}
        // Quando l'utente scrive:
            // 1. Aggiorna il nome dell'acquirente
            // 2. Azzera i biglietti precedentemente selezionati
        onChange={(e) => {setNomeAcquirente(e.target.value); setTicketSelezionato([])}}
      />
      {/* Se il campo nomeAcquirente non è vuoto e non ci sono risultati,
        mostra un messaggio che informa l'utente */}
      {nomeAcquirente.trim() !== '' && bigliettiAcquirente.length === 0 && (
        <p className="ricerca-vuoto">Nessun biglietto trovato</p>
      )}

      <ul className="ricerca-lista">
        {bigliettiAcquirente.map((ticket) => {
          // Controlla se l'id del biglietto è presente
          // nell'array dei biglietti selezionati
          const scelto = ticketSelezionato.includes(ticket.idBiglietto);
          return (
            <li key={ticket.idBiglietto}>
              <button
                type="button"
                className={scelto ? 'ricerca-voce attiva' : 'ricerca-voce'}
                aria-pressed={scelto}
                onClick={() =>
                    setTicketSelezionato((prec) =>
                        // Se il biglietto è già selezionato,
                        // lo rimuove dall'array
                        prec.includes(ticket.idBiglietto)
                        ? prec.filter((i) => i !== ticket.idBiglietto)
                        // Altrimenti aggiunge il suo id all'array
                        : [...prec, ticket.idBiglietto]
                    )
                }
              >
                <span className="voce-id">#{ticket.idBiglietto}</span>
                <span className="voce-posto">Posto {ticket.numeroPosto}</span>
                <span className={`voce-stato stato-${ticket.stato}`}>{ticket.stato}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  )
}

export default CercaPerNome
