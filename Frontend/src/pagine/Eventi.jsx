import React, { useEffect, useState } from 'react'
import CambiaPagina from '../componenti/Bottone';
import Iscrizione from '../componenti/Aggiornamento'
import './Eventi.css'
import RichiestaApi from '../componenti/RichiestaApi';
function Eventi() {
    const [eventi, setEventi] = useState([])
    const [errore, setErrore] = useState(null);
    const [postiDisponibili, setPostiDisponibili] = useState({})

    useEffect (()=>{

      // recupera dal server la lista degli eventi
        const caricaEventi = async () =>{
          // Richiede al backend tutti gli eventi tramite una richiesta GET
          const esito = await RichiestaApi({indirizzo:'/api/eventi', metodo: 'GET'})

          if (esito?.tipo === 'Errore'){
            setErrore(esito.testo);
            return;
          }
          setErrore('');

          // Salva nello stato la lista degli eventi ricevuta dal server
          setEventi(esito.dati)

          await caricaPostiDisponibili(esito.dati);    
        }
        caricaEventi()
    },[])

// recupera i posti di un singolo evento
const caricaPosti = async (evento) =>{

  // GET per ottenere i posti associati all'evento
  const esito = await RichiestaApi({indirizzo:`/api/eventi/${evento.idEvento}/posti`, metodo: 'GET'})
  if (esito?.tipo === 'Errore'){
    setErrore(esito.testo);
    return;
    }
  setErrore('');
  return esito.dati;
}

 // recupera i posti disponibili per tutti gli eventi
const caricaPostiDisponibili = async (listaEventi) =>{
  // Cicla tutti gli eventi ricevuti
  for (const evento of listaEventi){
        // Recupera i posti del singolo evento
        const risposta =  await caricaPosti(evento)
        if (risposta === null) continue;
        // Filtra solamente i posti che non sono occupati
        const numeroPosti = risposta.filter(id => id.occupato === false)
        setPostiDisponibili((prec) => ({...prec, [evento.idEvento]: numeroPosti.length}))
        }
        
      }

  return (
  <main className="pagina-eventi">
    
    <Iscrizione
      iscrizione="biglietteria/nuovoEvento"
      // Funzione eseguita quando viene ricevuto un nuovo evento
      funzione={async (nuovoEvento) => {
        // Aggiunge il nuovo evento alla lista senza eliminare quelli già presenti
        setEventi(eventiPrecedenti => [
          ...eventiPrecedenti,
          nuovoEvento
        ])
         // Recupera i posti del nuovo evento
        const risposta =  await caricaPosti(nuovoEvento)
        if (risposta === null) return;
        // prende solamente i posti non occupati
        const numeroPosti = risposta.filter(id => id.occupato === false)
        // Aggiorna il numero di posti disponibili per il nuovo evento
        setPostiDisponibili((prec) => ({...prec, [nuovoEvento.idEvento]: numeroPosti.length}))
      }}
    />

    <header className="intestazione-eventi">
      <span className="sottotitolo-eventi">
        SCOPRI LE PROSSIME ESPERIENZE
      </span>

      <h1>Eventi disponibili</h1>

      <p>
        Scegli il tuo evento e assicurati il tuo posto.
      </p>

      <div className="linea-decorativa"></div>
    </header>

    <div className="lista-eventi">
      {/* map crea una scheda per ogni evento presente nell'array */}
      {eventi.map((elemento) => (
        <div
          className="scheda-evento"
          key={elemento.idEvento}
        >
          {/* Aggiorna il numero di posti disponibili dell'evento */}
          <Iscrizione
          iscrizione={`biglietteria/eventi/${elemento.idEvento}`}
          funzione={(dato) => {
            // Se un posto è stato cancellato, aumenta i posti disponibili di 1
            if (dato.tipo === "cancellato")
              setPostiDisponibili((prec) => ({...prec, [elemento.idEvento]: prec[elemento.idEvento] + 1})) 
            // Se un posto è stato prenotato, diminuisce i posti disponibili di 1
            if(dato.tipo === "prenotato")
              setPostiDisponibili((prec) => ({...prec, [elemento.idEvento]: prec[elemento.idEvento] - 1}))

          }}
          />
          <span className="etichetta-evento">
            EVENTO
          </span>

          <strong className="nome-evento">
            {elemento.nome}
          </strong>

          <span className="dettaglio-evento">
            Posti Disponibili: {postiDisponibili[elemento.idEvento]}
          </span>

          <span className="dettaglio-evento">
            Inizio:{" "}
            {new Date(Number(elemento.inizio) * 1000)
              .toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
          </span>

          <span className="dettaglio-evento">
            Fine:{" "}
            {new Date(Number(elemento.fine) * 1000)
              .toLocaleString("it-IT", {
                dateStyle: "short",
                timeStyle: "short",
              })}
          </span>

          <CambiaPagina
            pagina="/Eventi/PrenotaBiglietto"
            tipologia="btn-Evento"
            state={{
              idEvento: elemento.idEvento,
              postiTotali: elemento.postiDisponibili,
              nomeEvento: elemento.nome,
              dataInizio: elemento.inizio,
              dataFine: elemento.fine
            }}
          >
            Prenota i posti →
          </CambiaPagina>
        </div>
      ))}
    </div>
  </main>
);
}

export default Eventi