import React, { useEffect, useRef } from 'react'
import mqtt from 'mqtt'
export default function Aggiornamento({iscrizione,funzione}) {
    
    // Mantiene aggiornata la funzione utilizzata dal listener MQTT.
    // Il listener viene registrato solo quando cambia l'iscrizione ([iscrizione]), quindi non viene ricreato quando cambia la funzione.
    // Senza useRef potrebbe continuare a utilizzare la vecchia versione della funzione.
    const funcMessRec = useRef(funzione)
    useEffect(() => {
    funcMessRec.current = funzione
    }, [funzione])

    useEffect(() =>{

        let attivo = true
        if (!funzione) return

        const client = mqtt.connect('ws://127.0.0.1:9001')

        client.on('connect', () => {
             if (!attivo) return

            client.subscribe(iscrizione, (err) => {
                if (err) {
                    console.error('Errore sottoscrizione:', err)
                } else {
                    console.log('Sottoscritto a:', iscrizione)
                }
            })
        })

        client.on('message', (topic, payload) => {
                try {
                    const dato = JSON.parse(payload.toString())
                    console.log("ricevuto da MQTT:", dato);
                    funcMessRec.current?.(dato, topic)
                } catch (err) {
                    console.error('Errore parsing MQTT:', err)
                }
            })

        client.on('error', (err) => {
                console.error('Errore MQTT:', err)
            })

        return () => {
            attivo = false
            client.end()
        }

        }, [iscrizione])

    return null

}
