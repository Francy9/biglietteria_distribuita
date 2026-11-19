pragma solidity ^0.8.20;
contract Ticketing {

enum TicketStatus{
    Prenoato,
    Utilizzato,
    Cancellato
}

struct Evento {
    string nome;
    uint24 postiDisponibili;
    uint64 dataInizio;
    uint64 dataFine;
}

struct Ticket{
      uint256 idBiglietto;
      uint256 idEvento;
      uint24 numeroPosto;
      string nomeAcquirente;
      TicketStatus stato; 
}

// Array che contiene tutti gli eventi creati.
// Ogni evento viene identificato dalla propria posizione nell'array.
Evento[] public listaEventi;

// Array che contiene tutti i biglietti generati.
// i biglietti vengono identificati tramite la posizione nell'array.
Ticket[] public listaBiglietti;
mapping(uint256 evento => mapping(uint24 posto => uint256 prenotato)) public postiPrenotati;

// Segnala la creazione di un nuovo evento.
event EventoCreato(uint256 indexed idEvento, string nome, uint32 postiDisponibili, uint64 dataInizio, uint64 dataFine);
// Segnala la prenotazione di un nuovo biglietto.
event BigliettoPrenotato(uint256 indexed idBiglietto, uint256 indexed idEvento, uint24 numeroPosto, string nomeAcquirente);
// Segnala che un biglietto è stato utilizzato.
event TicketObliterato(uint256 indexed idBiglietto, uint256 idEvento, uint24 numeroPosto, string nomeAcquirente, TicketStatus stato);
// Segnala la cancellazione di un biglietto.
event TicketCancellato(uint256 indexed idBiglietto, uint256 idEvento, uint24 numeroPosto, string nomeAcquirente, TicketStatus stato);
// Segnala il cambiamento del nome dell'acquirente.
event AcquirenteCambiato(uint256 indexed idBiglietto, uint256 idEvento, uint24 numeroPosto, string nomeAcquirente, TicketStatus stato);


// crea un evento e lo inserisce nell'array listaEventi.
// Emette invece l'evento EventoCreato contenente l'ID assegnato
function creaEvento(string calldata _nome, uint24 _postiDisponibili, uint64 _dataInizio, uint64 _datafine) external {
    // Verifica che la data di fine sia successiva a quella di inizio.
    require(_datafine > _dataInizio, "La data di fine deve essere successiva alla data di inizio");
    // Verifica che l'evento inizi dopo la data e l'ora attuali.
    require(_dataInizio > block.timestamp, "la data di inizio deve essere successiva a quella attuale");
    // Verifica che il numero di posti sia maggiore di zero.
    require(_postiDisponibili > 0, "Il numero di posti disponibili deve essere maggiore di zero");
    uint256 idEvento = listaEventi.length;
    // Inserisce il nuovo evento nell'array.
    listaEventi.push(Evento(_nome, _postiDisponibili,_dataInizio, _datafine));
    emit EventoCreato(idEvento, _nome, _postiDisponibili, _dataInizio, _datafine);
}

// prenota un posto per un determinato evento.
// Emette l'evento BigliettoPrenotato con i dati del biglietto.
function PrenotaBiglietto(uint256 _idEvento, uint24 _numeroPosto, string calldata _nomeAcquirente) external {
    // Verifica che l'ID dell'evento corrisponda a un evento esistente.
    require(_idEvento < listaEventi.length, "L'evento non esiste");
    // Verifica che il numero del posto sia valido, i posti partono da 1.
    require(_numeroPosto > 0 && _numeroPosto <= listaEventi[_idEvento].postiDisponibili, "Il posto non esiste");
    // Impedisce di prenotare un posto per un evento già terminato.
    require(listaEventi[_idEvento].dataFine > block.timestamp, "L'evento e' finito");
    // Verifica che il posto non sia già stato prenotato.
    require(postiPrenotati[_idEvento][_numeroPosto] == 0, "Il posto e' gia' prenotato");
    uint256 biglietto_id = listaBiglietti.length;
    // Crea il biglietto e lo inserisce nell'array.
    listaBiglietti.push(Ticket(biglietto_id, _idEvento, _numeroPosto, _nomeAcquirente, TicketStatus.Prenoato));
    // si aggiunge a postiPrenotati l'ID del biglietto + 1 perché 0 indica posto libero.
    postiPrenotati[_idEvento][_numeroPosto] = biglietto_id + 1;
    emit BigliettoPrenotato(biglietto_id, _idEvento, _numeroPosto, _nomeAcquirente);
}

// modifica lo stato del biglietto in Utilizzato.
// Emette l'evento TicketObliterato con i dati aggiornati.
function ObliterazioneBiglietto (uint256 _idBiglietto) external {
    // Verifica che il biglietto esista.
    require(_idBiglietto < listaBiglietti.length, "Il biglietto non esiste");

    // storage serve per crea un riferimento al dato originale dell'array.
    // In questo modo, modificando la variabile biglietto,
    // vengono modificati direttamente i dati del biglietto nell'array.
    Ticket storage biglietto = listaBiglietti[_idBiglietto];
    // Verifica che il biglietto sia ancora prenotato.
    require(biglietto.stato == TicketStatus.Prenoato, "Il biglietto non e' valido");
    // Verifica che l'evento sia già iniziato.
    require(listaEventi[biglietto.idEvento].dataInizio < block.timestamp, "Evento non ancora iniziato");
    // Verifica che l'evento non sia ancora terminato.
    require(listaEventi[biglietto.idEvento].dataFine > block.timestamp, "Evento finito");
    biglietto.stato = TicketStatus.Utilizzato;
    emit TicketObliterato(biglietto.idBiglietto, biglietto.idEvento, biglietto.numeroPosto, biglietto.nomeAcquirente, biglietto.stato);
}

// cancella una prenotazione.
// Emette l'evento TicketCancellato con i dati aggiornati.
function CancellaPrenotazioneBiglietto(uint256 _idBiglietto) external {
    // Verifica che il biglietto esista.
    require(_idBiglietto < listaBiglietti.length, "Il biglietto non esiste");
    
    Ticket storage biglietto = listaBiglietti[_idBiglietto];
    // Verifica che il biglietto sia ancora prenotato e non cancellato o usato.
    require(biglietto.stato == TicketStatus.Prenoato, "Il biglietto non e' valido");
    // Verifica che l'evento non sia terminato.
    require(listaEventi[biglietto.idEvento].dataFine > block.timestamp, "Evento finito");
    biglietto.stato = TicketStatus.Cancellato;
    
    // Libera il posto nel mapping.
    // Il valore 0 indica che il posto è nuovamente disponibile.
    postiPrenotati[biglietto.idEvento][biglietto.numeroPosto] = 0;
    emit TicketCancellato(biglietto.idBiglietto, biglietto.idEvento, biglietto.numeroPosto, biglietto.nomeAcquirente, biglietto.stato);
}

// modifica il nome dell'acquirente associato a un biglietto.
// Emette l'evento AcquirenteCambiato con i dati aggiornati.
function CambiaNomeAcquirente(uint256 _idBiglietto, string calldata _nuovoNome) external {
    // Verifica che il biglietto esista.
    require(_idBiglietto < listaBiglietti.length, "Il biglietto non esiste");
    
    Ticket storage biglietto = listaBiglietti[_idBiglietto];
    // Verifica che il biglietto sia ancora prenotato e non cancellato o usato.
    require(biglietto.stato == TicketStatus.Prenoato, "Il biglietto non e' valido");
    // Verifica che l'evento non sia terminato.
    require(listaEventi[biglietto.idEvento].dataFine > block.timestamp, "Evento finito");
    biglietto.nomeAcquirente = _nuovoNome;
    emit AcquirenteCambiato(biglietto.idBiglietto, biglietto.idEvento, biglietto.numeroPosto, biglietto.nomeAcquirente, biglietto.stato);
}

// legge il numero totale degli eventi creati.
// restituisce la lunghezza dell'array listaEventi.
// Essendo una view, non modifica la blockchain e non richiede
// una transazione per la lettura.
function NumeroEventiPresenti() external view returns(uint256){
    return listaEventi.length;
}

// legge il numero totale dei biglietti creati.
// restituisce la lunghezza dell'array listaBiglietti.
// Essendo una view, non modifica la blockchain e non richiede
// una transazione per la lettura.
function NumeroBigliettiGenerati() external view returns(uint256){
    return listaBiglietti.length;
}

}