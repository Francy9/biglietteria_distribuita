import React, { useEffect, useState } from 'react'
import CambiaPagina from '../componenti/Bottone';
import Iscrizione from '../componenti/Aggiornamento'
import './Eventi.css'
import RichiestaApi from '../componenti/RichiestaApi';

function SelEventiModBiglietto() {
    const [eventi, setEventi] = useState([])
    const [errore, setErrore] = useState(null);
    const [postiDisponibili, setPostiDisponibili] = useState({})

    // esegue il caricamento degli eventi quando il componente viene montato.
    useEffect (()=>{
        const caricaEventi = async () =>{
          const esito = await RichiestaApi({indirizzo:'/api/eventi', metodo: 'GET'})

          if (esito?.tipo === 'Errore'){
            setErrore(esito.testo);
            return;
          }
          setErrore('');
          setEventi(esito.dati)
          await caricaPostiDisponibili(esito.dati);    
        }
        caricaEventi()
    },[])

// Recupera dal server i posti appartenenti a un singolo evento.
const caricaPosti = async (evento) =>{
  // Richiede la lista dei posti dell'evento usando il suo id.
  const esito = await RichiestaApi({indirizzo:`/api/eventi/${evento.idEvento}/posti`, metodo: 'GET'})
  if (esito?.tipo === 'Errore'){
    setErrore(esito.testo);
    return;
    }
  setErrore('');
  return esito.dati;
}

// Recupera i posti di tutti gli eventi presenti nella lista.
const caricaPostiDisponibili = async (listaEventi) =>{
  // Cicla tutti gli eventi
  for (const evento of listaEventi){
        // Recupera i posti relativi all'evento corrente.
        const risposta =  await caricaPosti(evento)
        if (risposta === null) continue;
        // Filtra i posti occupati
        const numeroPosti = risposta.filter(id => id.occupato === true)
        setPostiDisponibili((prec) => ({...prec, [evento.idEvento]: numeroPosti.length}))
        }
        
      }

  return (
  <main className="pagina-eventi">
    {/* riceve gli aggiornamenti quando viene creato un nuovo evento. */}
    <Iscrizione
      iscrizione="biglietteria/nuovoEvento"
      funzione={async (nuovoEvento) => {
        // Aggiunge il nuovo evento alla lista senza cancellare quelli già presenti.
        setEventi(eventiPrecedenti => [
          ...eventiPrecedenti,
          nuovoEvento
        ])
        const risposta =  await caricaPosti(nuovoEvento)
        if (risposta === null) return;
        const numeroPosti = risposta.filter(id => id.occupato === true)
        setPostiDisponibili((prec) => ({...prec, [nuovoEvento.idEvento]: numeroPosti.length}))
      }}
    />

    <header className="intestazione-eventi">
      <span className="sottotitolo-eventi">
        GESTISCI IL TUO BIGLIETTO
      </span>

      <h1>Eventi disponibili</h1>

      <p>
        Valida Cancella o Cambia L'intestatario del biglietto.
      </p>

      <div className="linea-decorativa"></div>
    </header>

    <div className="lista-eventi">
      {eventi.map((elemento) => (
        <div
          className="scheda-evento"
          key={elemento.idEvento}
        >
          <Iscrizione
          iscrizione={`biglietteria/eventi/${elemento.idEvento}`}
          funzione={(dato) => {
            // Se un biglietto viene cancellato, diminuisce il numero dei posti prenotati.
            if (dato.tipo === "cancellato")
              setPostiDisponibili((prec) => ({...prec, [elemento.idEvento]: prec[elemento.idEvento] - 1})) 
            // Se un biglietto viene prenotato, aumenta il numero dei posti prenotati.
            if(dato.tipo === "prenotato")
              setPostiDisponibili((prec) => ({...prec, [elemento.idEvento]: prec[elemento.idEvento] + 1}))
            
          }}
          />
          <span className="etichetta-evento">
            EVENTO
          </span>

          <strong className="nome-evento">
            {elemento.nome}
          </strong>

          <span className="dettaglio-evento">
            Posti Prenotati: {postiDisponibili[elemento.idEvento]}
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
            pagina="/selEventiModBiglietto/ValidaCancNomeBiglietto"
            tipologia="btn-Evento"
            // con state passo informazioni alla pagina di destinazione.
            state={{
              idEvento: elemento.idEvento,
              postiTotali: elemento.postiDisponibili,
              nomeEvento: elemento.nome,
              dataInizio: elemento.inizio,
              dataFine: elemento.fine
            }}
          >
            Valida, Cancella, Cambia Intestatario →
          </CambiaPagina>
        </div>
      ))}
    </div>
  </main>
);
}

export default SelEventiModBiglietto