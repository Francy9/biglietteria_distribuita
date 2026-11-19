import { useEffect, useRef, useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./Calendario.css";

function SelettoreDataOra({ dataScelta, setData }) {
  const [aperto, setAperto] = useState(false);
  const [schermata, setSchermata] = useState("giorni");
  const [giornoScelto, setGiornoScelto] = useState(null);
  const contenitoreRef = useRef(null);


  useEffect(() => {
  if (!aperto) return;
 // chiude la finestra in caso si preme con il mouse fuori dalla finestra del calendario
  const fuori = (e) => {
    if (contenitoreRef.current && !contenitoreRef.current.contains(e.target)) {
      setAperto(false);
    }
  };
  // in caso si preme il tasto esc chiude la finestra
  const esc = (e) => e.key === 'Escape' && setAperto(false);

  document.addEventListener('mousedown', fuori);
  document.addEventListener('keydown', esc);
  return () => {
    document.removeEventListener('mousedown', fuori);
    document.removeEventListener('keydown', esc);
  };
  }, [aperto]);


  // cra un array di hh:mm partendo da 00:00 un elemento ogni 15 minuti fino a 23:45
  const orari = Array.from({ length: 96 }, (_, i) => {
    const ore = Math.floor(i / 4);
    //modulo : 0 mod 4 = 0, 1 mod 4 = 1, 4 mod 4 = 0, 5 mod 4 = 1 ... 
    const minuti = (i % 4) * 15;
    // con padStart in caso di una singola cifra mette davanti uno 0
    return `${String(ore).padStart(2, "0")}:${String(minuti).padStart(2, "0")}`;
  });
 // scompone data e lo trasforma in gg/mm/hh ore:min
  const formattaData = (data) => {
    if (!data) return "";
    const giorno = String(data.getDate()).padStart(2, "0");
    const mese = String(data.getMonth() + 1).padStart(2, "0");
    const anno = data.getFullYear();
    const ore = String(data.getHours()).padStart(2, "0");
    const minuti = String(data.getMinutes()).padStart(2, "0");
    return `${giorno}/${mese}/${anno} ${ore}:${minuti}`;
  };

  //giorno scelto, si passa alla scelta dell' ora
  const scegliGiorno = (data) => {
    if (!data) return;
    setGiornoScelto(data);
    setSchermata("orari");
  };
 // una volta confermato l'orario viene impostato nella variabile setData e si chiude il calendario
  const scegliOrario = (orario) => {
    // bisogna aver scelto il giorno
    if (!giornoScelto) return;

    const [ore, minuti] = orario.split(":").map(Number);
    const risultato = new Date(giornoScelto);
    risultato.setHours(ore, minuti, 0, 0);

    setData(risultato);
    setAperto(false);
    setSchermata("giorni");
  };

 // ritorna alla schermata della scelta dei giorni
  const tornaAiGiorni = () => {
    setSchermata("giorni");
  };

  return (
    <div className="selettore-dataora" ref={contenitoreRef}>
      <input
        className="campo-data"
        value={formattaData(dataScelta)}
        placeholder="Seleziona data e ora"
        readOnly
        onClick={() => {
          setGiornoScelto(dataScelta ? new Date(dataScelta) : null);
          setSchermata("giorni");
          setAperto(!aperto);
        }}
      />

      {aperto && (
        <div className="popup-dataora">
          {schermata === "giorni" ? (
            <>
              <div className="titolo-dataora">
                Seleziona una data
              </div>

              <DatePicker
                inline
                selected={giornoScelto}
                onChange={scegliGiorno}
                onSelect={scegliGiorno}
                calendarClassName="calendario-personalizzato"
                minDate={new Date()}
                dateFormat="dd/MM/yyyy"
              />
            </>
          ) : (
            <>
              <div className="intestazione-orari">
                <button
                  type="button"
                  className="bottone-indietro"
                  onClick={tornaAiGiorni}
                >
                  ← Indietro
                </button>

                <div className="titolo-dataora">
                  Scegli un orario
                </div>

                <div className="data-scelta">
                  {giornoScelto?.toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </div>
              </div>

              <div className="lista-orari">
                {/* Crea un bottone per ogni orario presente nell'array:
                  (00:00, 00:15, 00:30, 00:45, 01:00...) */}
                {orari.map((orario) => (
                  <button
                    type="button"
                    key={orario}
                    className={
                      dataScelta &&
                      giornoScelto &&
                      dataScelta.toDateString() === giornoScelto.toDateString() &&
                      `${String(dataScelta.getHours()).padStart(2, "0")}:${String(dataScelta.getMinutes()).padStart(2, "0")}` === orario
                        ? "orario-opzione orario-selezionato"
                        : "orario-opzione "
                    }
                    onClick={() => scegliOrario(orario)}
                  >
                    {orario}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default SelettoreDataOra;