import React, { useEffect, useState } from 'react'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import SelettoreDataOra from '../componenti/Calendario'
import PopupEsito from '../componenti/PopupEsito'
import './GeneraEvento.css'
function GeneraEvento() {
    const [nome, setNome] = useState('')
    const [inizio, setInizio] = useState(null)
    const [fine, setFine] = useState(null)
    const [posti, setPosti] = useState('')
    const [esito, setEsito] = useState(null);
    const [popup, setMostraPopup] = useState(false)
    
 // invia al server i dati del nuovo evento
const carica = async () => {

    try{
        
        const ritorno = await fetch('/api/eventi',{
            method: 'POST',
            headers:{'Content-type':'application/json'},
            body: JSON.stringify({
                nome: nome,
                postiDisponibili: Number.isNaN(parseInt(posti,10)) || posti < 10 ? 10 : posti,
                inizio: Math.floor(new Date(inizio).getTime() / 1000),
                fine: Math.floor(new Date(fine).getTime() / 1000),
            }),
        })
        const dati = await ritorno.json()
        if(!ritorno.ok){
            const testo = typeof dati.detail === 'string' ? dati.detail : JSON.stringify(dati.detail)
            setEsito({tipo: 'errore', testo})
            setMostraPopup (true)
            return
        }

        setEsito({tipo:'ok', testo: 'Evento creato con successo'})
        setMostraPopup (true)
        
    
    } catch(e){
        setEsito({ tipo: 'errore', testo: 'Impossibile contattare il server' })
        setMostraPopup (true)
    }
}
    

  return (
    <main className="pagina-GeneraEvento">
      {/*form per raccogliere le info necessarie a creare l'evento*/}
      <form
        className="input_GeneraEvento"
        // quando si preme il button Aggiungi chiama la funzione carica 
        onSubmit={(e) => { e.preventDefault(); carica() }}
      >
        <span className="gen-badge">Nuovo evento</span>
        <h1 className="gen-title">Genera evento</h1>
        <p className="gen-sub">Compila i dati per creare l'evento.</p>

        <div className="gen-campo">
          <label htmlFor="nome">Nome evento</label>
          <input
            id="nome"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Es. Concerto d'estate"
          />
        </div>

        <div className="gen-campo">
          <label>Data e ora di inizio</label>
          <SelettoreDataOra dataScelta={inizio} setData={setInizio} />
        </div>

        <div className="gen-campo">
          <label>Data e ora di fine</label>
          <SelettoreDataOra dataScelta={fine} setData={setFine} />
        </div>

        <div className="gen-campo">
          <label htmlFor="posti">Posti disponibili</label>
          <input
            id="posti"
            type="number"
            min="10"
            value={posti}
            onChange={(e) => setPosti(e.target.value)}
            placeholder="Minimo 10"
          />
        </div>

        <button type="submit" className="gen-btn" disabled={!nome.trim() || !inizio || !fine}>
          Aggiungi
        </button>
      </form>
      {/*popup per notificare l'aggiunta dell'evento o  l'errore*/}
      {popup && (
        <PopupEsito
          chiamante="GeneraEvento"
          apertura={popup}
          setApertura={setMostraPopup}
          esito={esito}
        />
      )}
    </main>
  )
}

export default GeneraEvento