import React, { useEffect, useState } from 'react'
import './Sala.css'
function Sala({inviaSelezione, postiDisponibili, visualizzaOccupati = false, reset}) {

    const [valSelezionato, setValSelezionato] = useState([]);


    useEffect(() => {
    setValSelezionato((old) => {
        const nuovi = old.filter(
            (p) => (!visualizzaOccupati ? !postiDisponibili.find((v) => v.posto === p)?.occupato : postiDisponibili.find((v) => v.posto === p)?.occupato)
        );
        
        // se non è cambiato niente, restituisco lo stesso array
        // così React non fa un re-render inutile
        return nuovi.length === old.length ? old : nuovi;
    });
    }, [postiDisponibili])

    useEffect(()=>{
        inviaSelezione(valSelezionato);
    },[valSelezionato, inviaSelezione]);

    useEffect(() => {
        setValSelezionato([])
    }, [reset])

    //funzione che memorizza i posti selezionati (parte da i+1 poichè il posto 0 non esiste) 
    const Sedute = Array.from({length: postiDisponibili.length }, (_, i)=>(
        <button
            className= {valSelezionato.includes(i + 1) ? 'BottoneSala attivo' : 'BottoneSala'}
            key={i}
            onClick={() => {
                // se i+1 era presente nell'array lo cancella altrimenti lo inserisce
                setValSelezionato(old => (
                    old.includes(i + 1) ? old.filter(id => id !== i + 1)
                    : [...old, i + 1]
                ));
            }}
            // disabilita i posti in base alla pagina, se siamo nella prenotazione, 
            // disabilita quelli già prenotati, viceversa se siamo nella modifica dei biglietti disabilita i posti liberi
            disabled ={!visualizzaOccupati ? postiDisponibili.find((valore)=> valore.posto === i + 1)?.occupato : !postiDisponibili.find((valore)=> valore.posto === i + 1)?.occupato}
        >
            <span className="numero">{i + 1}</span>
        </button>
        
    ));


    

  return (

    <section className="sala">
    <div className="palco">
        PALCO
    </div>
    <div className="Griglia_Sedute">{Sedute}</div>

    <div className="legenda">
            <span className="legenda-voce">
                <i className="legenda-box libero" /> { !visualizzaOccupati ? 'Libero' : 'Occupato'}
            </span>
            <span className="legenda-voce">
                <i className="legenda-box selezionato" /> Selezionato
            </span>
            <span className="legenda-voce">
                <i className="legenda-box occupato" /> { !visualizzaOccupati ? 'Occupato' : 'Libero'}
            </span>
        </div>

    </section>
  );

}

export default Sala