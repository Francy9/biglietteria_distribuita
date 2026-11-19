import json
import os
import time

from eth_account import Account
from web3 import Web3
from web3.middleware import ExtraDataToPOAMiddleware

RPC_URLS = os.environ.get("RPC_URLS", "http://localhost:8546").split(",")
ARTIFACT = "/app/artifacts/contracts/Ticketing.sol/Ticketing.json"
OUT = "/app/Backend/deployed.json"


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



# aspetta che la rete sia pronta e produca blocchi
for _ in range(60):
    try:
        w3 = crea_w3()
        if w3.is_connected() and w3.eth.block_number >= 1:
            break
    except Exception:
        pass
    time.sleep(2)
else:
    raise SystemExit(f"Rete non pronta su {RPC_URLS}")

account = Account.from_key(os.environ["PRIVATE_KEY"])

with open(ARTIFACT) as f:
    artifact = json.load(f)

#Creazione del contratto.
#abi = info su nomi funzioni, parametri restituiti, tipi di dati ecc..
#bytecode = contratto compilato.
Contract = w3.eth.contract(abi=artifact["abi"], bytecode=artifact["bytecode"])

# preparazione transazione
tx = Contract.constructor().build_transaction({
    "from": account.address,
    "nonce": w3.eth.get_transaction_count(account.address),
    "gasPrice": 0,
    "chainId": w3.eth.chain_id,
})
signed = account.sign_transaction(tx)

# transazione per pubblicare il contratto sulla blockchain.
tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
receipt = w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

if receipt.status != 1:
    raise SystemExit("Deploy fallito")

with open(OUT, "w") as f:
    json.dump({"address": receipt.contractAddress, "abi": artifact["abi"]}, f, indent=2)

print("Contratto pubblicato a:", receipt.contractAddress)
