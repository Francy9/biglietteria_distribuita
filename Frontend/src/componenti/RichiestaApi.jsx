import React, { useState } from 'react'

async function RichiestaApi({ indirizzo, metodo, corpojson }) {
         try{
            
            const risposta = await fetch(indirizzo, {
                method: metodo,
                headers:{'Content-type':'application/json'},
                // mette il corpo solo in caso di get, inoltre corpojson non deve essere vuoto 
                ...(metodo !== 'GET' && corpojson
                    ? { body: corpojson }
                    : {}
                ),
                
            })
            
            const ritorno = await risposta.json();
            if(!risposta.ok)
            {
                // in caso il backend risponde con un errore
                const testo = typeof ritorno.detail === 'string' ? ritorno.detail : JSON.stringify(ritorno.detail)
                return {tipo: 'Errore', testo}
            }
            return { tipo: 'Successo', dati: ritorno }
        }catch(e){
            console.error("Errore nella richiesta API:", e);
            return{ tipo: 'errore', testo: 'Impossibile contattare il server' }
        }
}

export default RichiestaApi