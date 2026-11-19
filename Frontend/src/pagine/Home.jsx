import CambiaPagina from "../componenti/Bottone";
import { useNavigate } from "react-router-dom";
import './Home.css';
function Home(){
    
    // Array che contiene le informazioni delle schede
    // Ogni elemento dell'array è un oggetto con tre proprietà:
        // pagina: indica l'indirizzo della pagina da raggiungere
        // titolo: indica il titolo della scheda
        // testo: contiene una breve descrizione della scheda
    const azioni = [
        {pagina: '/GeneraEvento', titolo: 'Genera Evento', testo: 'Crea un nuovo evento e imposta i posti.'},
        {pagina: '/Eventi', titolo: 'Prenota Biglietto', testo: "Scegli l'evento e il tuo posto in sala."},
        {pagina: '/SelEventiModBiglietto', titolo: 'Valida, Cancella o Cambia Intestazione Biglietto', testo: "Valida il biglietto o cancella la prenotazione."}
    ]
    

    return(
        <main className="pagina-home">
            <section className="home-hero">
                <span className="home-badge">Biglietteria</span>
                <h1 className="home-title">Gestisci i tuoi eventi</h1>
                <p className="home-sub">Crea eventi e prenota i posti.</p>
            </section>
            
            {/* Sezione che contiene le schede delle diverse pagine*/}
            <section className="home-cards">

                {/* per ogni elemento dell'array azioni, crea una scheda */}
                {azioni.map((a) => (
                    // CambiaPagina permette di navigare verso la pagina indicata nella proprietà pagina
                    <CambiaPagina pagina={a.pagina} tipologia={`home-card ${a.titolo}`} >
                    <h2>{a.titolo}</h2>
                    <p>{a.testo}</p>
                    <span className="home-card-cta">Vai →</span>
                    </CambiaPagina>
                ))}
            </section>
        </main>


    );



}

export default Home