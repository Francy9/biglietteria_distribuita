import json
import os
import re
import threading
from eth_account import Account
import paho.mqtt.client as mqtt

from fastapi import FastAPI, HTTPException
#BaseModel serve per le class:
from pydantic import BaseModel
from web3 import Web3
from web3.exceptions import ContractLogicError
from web3.middleware import ExtraDataToPOAMiddleware

RPC_URLS = os.environ.get("RPC_URLS", "http://localhost:8546").split(",")
DEPLOYED = os.path.join(os.path.dirname(__file__), "deployed.json")


# Scorre gli endpoint disponibili e seleziona il primo che risponde per satbilire una connessione alla rete blockchain. 
# Configura e restituisce Web3.py per interagire con la blockchain.
def crea_w3() -> Web3:
    for url in RPC_URLS:
        w3 = Web3(Web3.HTTPProvider(url.strip(), request_kwargs={"timeout": 3}))
        try:
            if w3.is_connected():
                 # nodo ancora in sincronizzazione: prova il prossimo
                if w3.eth.syncing:         
                    continue
                # i blocchi QBFT hanno un campo extraData lungo che Web3.py potrebbe non leggere bene, 
                # serve aggiungere il middleware ExtraData cosi da intervenire sulle risposte dei blocchi 
                # prima che Web3.py le elabori secondo il formato standard.
                # middleware_onion è il gestore della catena di middleware di Web3.py.
                w3.middleware_onion.inject(ExtraDataToPOAMiddleware, layer=0)
                print("Collegato a", url)
                return w3
        except Exception:
            pass
    raise RuntimeError("Nessun nodo raggiungibile")

w3 = crea_w3()


with open(DEPLOYED) as f:
    data = json.load(f)

#Collegamento allo smart contract presente nella blockchain
contratto = w3.eth.contract(address=data["address"], abi=data["abi"])
account = Account.from_key(os.environ["PRIVATE_KEY"]) 
lock = threading.Lock()           # una transazione alla volta dal backend (evita problemi di nonce)

STATUS = {0: "VALID", 1: "USED", 2: "CANCELLED"}

app = FastAPI(title="Biglietteria distribuita")

#Ricerca variabile d'ambiente
MQTT_HOST = os.environ.get("MQTT_HOST", "localhost")
#Creazione di un client MQTT.
mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
#Connessione asincrona al broker.
mqtt_client.connect_async(MQTT_HOST, 1883)
# avvio thread in background per gestire la comunicazione MQTT.
mqtt_client.loop_start()

#invia messaggi relativi a azioni su eventi esistenti, al broker.
def pubblica(id_evento: int, tipo: str, **dati):
    # pubblicazione del messaggio sul canale dedicato
    info = mqtt_client.publish(
        f"biglietteria/eventi/{id_evento}",
        json.dumps({"tipo": tipo, "idEvento": id_evento, **dati}),
    )
    print("MQTT publish -> codice:", info.rc, "| connesso:", mqtt_client.is_connected())

#invia messaggi per notificare la creazione di un nuovo evento al broker.
def pubblicaNuovoEvento(id_evento: int, **dati):
    info = mqtt_client.publish(
        f"biglietteria/nuovoEvento",
        json.dumps({"tipo": "nuovo", "idEvento": id_evento, **dati}),
    )
    print("MQTT publish -> codice:", info.rc, "| connesso:", mqtt_client.is_connected())

#pulire messaggi d'errore arriati dal contratto
def messaggio_errore(e: Exception):
    message = getattr(e, "message", None) or str(e)
        # formato di Hardhat: VM Exception while processing transaction: reverted with reason string '...'
    trovato = re.search(r"reverted with reason string '(.*)'\s*$", message, re.DOTALL)
    if trovato:
        return trovato.group(1)
    
    return message.replace("execution reverted: ", "").strip()

# invia una transazione nella blockchain
def invia_transazione(fn):
    """Invia una transazione, aspetta il blocco e traduce i revert in errore 409."""
    try:
        with lock:
            tx = fn.build_transaction({
                "from": account.address,
                "nonce": w3.eth.get_transaction_count(account.address, "pending"),
                "gasPrice": 0,
                "chainId": w3.eth.chain_id,
            })
            firmata = account.sign_transaction(tx)
            tx_hash = w3.eth.send_raw_transaction(firmata.raw_transaction)
        ricevuta = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=30)   # l'attesa è fuori dal lock
    except ContractLogicError as e:
        raise HTTPException(status_code=409, detail=messaggio_errore(e))
    if ricevuta.status != 1:
        raise HTTPException(status_code=409, detail="Transazione annullata dal contratto")
    return ricevuta

#legge i dati memorizzati nel contratto dall'ultimo blocco della blockchain
def lettura_variabili(fn):
    try:
        risposta = fn.call()
    except ContractLogicError as e:
        raise HTTPException(status_code=404, detail=messaggio_errore(e))
    return risposta



class NuovoEvento(BaseModel):
    nome: str
    inizio: int      # timestamp Unix in secondi
    fine: int
    postiDisponibili: int


class NuovoTiket(BaseModel):
    idEvento: int
    posto: int
    acquirente: str


class Acquirente(BaseModel):
    acquirente: str

#prende la lista degli eevnti presenti nella blockchain con lista_eventi() e controlla
# se il nuovo evento che si vuole inserire è gia presente
def evento_presente(t: NuovoEvento) -> bool:
    for evento in lista_eventi():
        if (t.nome == evento["nome"]
                and t.postiDisponibili == evento["postiDisponibili"]
                and t.inizio == evento["inizio"]
                and t.fine == evento["fine"]):
            return True
    return False

# recupera dalla blockchain tutti gli eventi presenti.
@app.get("/api/eventi")
def lista_eventi():
    n = contratto.functions.NumeroEventiPresenti().call()
    lista_eventi = []
    for i in range (n):
        nome, postiDisponibili,inizio,fine = lettura_variabili(contratto.functions.listaEventi(i))
        lista_eventi.append({"idEvento":i, "nome":nome, "postiDisponibili":postiDisponibili, "inizio":inizio, "fine":fine})
    return lista_eventi

# crea un nuovo evento sulla blockchain,
@app.post("/api/eventi", status_code=201)
def crea_evento(e: NuovoEvento):

    #controlla se è glia presente l'evento
    if evento_presente(e):
        raise HTTPException(status_code=409, detail="Evento già presente")
    
    print("data inizio:", e.inizio, "data fine:", e.fine)
    #crea l'evento sulla blockchain
    ricevuta = invia_transazione(contratto.functions.creaEvento(e.nome,e.postiDisponibili, e.inizio, e.fine))
    # Recupera dalla ricevuta della transazione l'evento EventoCreato emesso dallo smart contract
    eventoCreato = contratto.events.EventoCreato().process_receipt(ricevuta)
    idEvento = eventoCreato[0]["args"]["idEvento"]
    pubblicaNuovoEvento(idEvento, nome = e.nome, postiDisponibili = e.postiDisponibili, inizio = e.inizio, fine = e.fine)
    return {"idEvento": idEvento}

# restituisce tutti i posti di un determinato evento
# per ogni posto dichiara se libero o occupato
@app.get("/api/eventi/{event_id}/posti") 
def stato_posti(event_id: int):
    
    _, postiDisponibili, _,_,= lettura_variabili(contratto.functions.listaEventi(event_id))

    return [
        {"posto": s, "occupato": bool(lettura_variabili(contratto.functions.postiPrenotati(event_id, s)))}
        for s in range(1, postiDisponibili + 1)
    ]

# restituisce tutti gli ID dei biglietti di un evento
@app.get("/api/eventi/{event_id}/ticketGenerati") 
def ticket_generati(event_id: int):
    
    _, postiDisponibili, _,_,= lettura_variabili(contratto.functions.listaEventi(event_id))

    return [
        {"idBiglietto": lettura_variabili(contratto.functions.postiPrenotati(event_id, s)) - 1 }
        for s in range(1, postiDisponibili + 1)
        if lettura_variabili(contratto.functions.postiPrenotati(event_id, s)) != 0
    ]

# restituisce L'ID di un biglietto associato a un determinato posto di uno specifico evento.
@app.get("/api/eventi/{event_id}/idTicket") 
def cerca_idTicket(event_id: int, posto: int):
    
    idBiglietto = lettura_variabili(contratto.functions.postiPrenotati(event_id, posto)) - 1
    return{"idBiglietto": idBiglietto}
    
# registra sulla blockchain la prenotazione di un posto
@app.post("/api/tickets", status_code=201)
def prenota_biglietto(t: NuovoTiket):
    ricevuta = invia_transazione(contratto.functions.PrenotaBiglietto(t.idEvento, t.posto, t.acquirente))
    bigliettoPrenotato = contratto.events.BigliettoPrenotato().process_receipt(ricevuta)
    idBiglietto = bigliettoPrenotato[0]["args"]["idBiglietto"]
    pubblica(t.idEvento, "prenotato", posto = t.posto, idBiglietto = idBiglietto, nomeAcquirente = t.acquirente)
    return{"idBiglietto": idBiglietto}

# cerca sulla blockchain un biglietto attraverso
# il suo ID e restituisce tutte le info associate
@app.get("/api/tickets/{ticket_id}")
def informazioni_biglietto(ticket_id: int):
        
    idTicket, event_id, seat, holder, status = lettura_variabili(contratto.functions.listaBiglietti(ticket_id))

    return {"idBiglietto": idTicket, "idEvento": event_id, "numeroPosto": seat, "nomeAcquirente": holder, "stato": STATUS[status]}

# recupera tutti i biglietti generati per un determinato evento
# restituisce una lista contenente tutte le info realtive a tutti i biglietti.
@app.get("/api/tickets/bigliettiPrenotati/{event_id}")
def informazioni_biglietti(event_id: int):
    info_biglietti = []
    tickets = ticket_generati(event_id)

    for ticket_id in tickets:
        idTicket, idEvento, seat, holder, status = lettura_variabili(contratto.functions.listaBiglietti(ticket_id["idBiglietto"]))
        info_biglietti.append({"idBiglietto": idTicket, "idEvento": idEvento, "numeroPosto": seat, "nomeAcquirente": holder, "stato": STATUS[status]})
    
    return info_biglietti

# valida un biglietto sulla blockchain
@app.post("/api/tickets/{ticket_id}/valida")
def valida_ticket(ticket_id: int):
    ricevuta = invia_transazione(contratto.functions.ObliterazioneBiglietto(ticket_id))
    bigliettoUtilizzato = contratto.events.TicketObliterato().process_receipt(ricevuta)
    info = bigliettoUtilizzato[0]["args"]
    pubblica(info["idEvento"], "utilizzato",idBiglietto = info["idBiglietto"], posto = info["numeroPosto"],nomeAcquirente=info["nomeAcquirente"], stato = STATUS[info["stato"]])
    return {"ok": True}

# cancella la prenotazione di un biglietto
@app.delete("/api/tickets/{ticket_id}")
def cancella_ticket(ticket_id: int):
    ricevuta = invia_transazione(contratto.functions.CancellaPrenotazioneBiglietto(ticket_id))
    bigliettoUtilizzato = contratto.events.TicketCancellato().process_receipt(ricevuta)
    info = bigliettoUtilizzato[0]["args"]
    pubblica(info["idEvento"], "cancellato", idBiglietto = info["idBiglietto"], posto = info["numeroPosto"],nomeAcquirente=info["nomeAcquirente"], stato = STATUS[info["stato"]])
    return {"ok": True}

# modifica il nome dell'acquirente associato a un biglietto
@app.patch("/api/tickets/{ticket_id}/holder")
def change_holder(ticket_id: int, h: Acquirente):
    ricevuta = invia_transazione(contratto.functions.CambiaNomeAcquirente(ticket_id, h.acquirente))
    bigliettoUtilizzato = contratto.events.AcquirenteCambiato().process_receipt(ricevuta)
    info = bigliettoUtilizzato[0]["args"]
    pubblica(info["idEvento"], "nuovo_acquirente", idBiglietto = info["idBiglietto"], posto = info["numeroPosto"],nomeAcquirente=info["nomeAcquirente"], stato = STATUS[info["stato"]])
    return {"ok": True}





        
