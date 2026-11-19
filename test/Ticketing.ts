import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.create();

async function now(): Promise<number> {
  const block = await ethers.provider.getBlock("latest");
  return block!.timestamp;
}

// sposta l'orologio della blockchain a un certo istante
async function goTo(ts: number) {
  // imposta il timestamp del prossimo blocco che verrà minato con evm_setNextBlockTimestamp
  // ts valore del prossimo timestamp in Unix
  await ethers.provider.send("evm_setNextBlockTimestamp", [ts]);
  // forza il mining di un nuovo blocco con evm_mine
  await ethers.provider.send("evm_mine", []);
}

describe("Ticketing", function () {
  // deploy + un evento con 3 posti, che inizia tra 1000s e finisce tra 2000s
  async function setup() {
    const ticketing = await ethers.deployContract("Ticketing");
    const t0 = await now();
    const start = t0 + 1000;
    const end = t0 + 2000;
    await ticketing.creaEvento("Concerto", 3, start, end);
    return { ticketing, start, end };
  }

  it("acquista un biglietto ed emette l'evento", async function () {
    const { ticketing } = await setup();
    await expect(ticketing.PrenotaBiglietto(0, 1, "Anna"))
      .to.emit(ticketing, "BigliettoPrenotato")
      .withArgs(0, 0, 1, "Anna");
  });

  it("non vende due volte lo stesso posto", async function () {
    const { ticketing } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await expect(ticketing.PrenotaBiglietto(0, 1, "Marco"))
      .to.be.revertedWith("Il posto e' gia' prenotato");
  });

  it("rifiuta posti fuori dalla capienza", async function () {
    const { ticketing } = await setup();
    await expect(ticketing.PrenotaBiglietto(0, 0, "Anna")).to.be.revertedWith("Il posto non esiste");
    await expect(ticketing.PrenotaBiglietto(0, 4, "Anna")).to.be.revertedWith("Il posto non esiste");
  });

  it("non valida un biglietto prima dell'inizio", async function () {
    const { ticketing } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await expect(ticketing.ObliterazioneBiglietto(0)).to.be.revertedWith("Evento non ancora iniziato");
  });

  it("valida il biglietto durante l'evento e non lo riutilizza", async function () {
    const { ticketing, start } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await goTo(start + 10);
    await expect(ticketing.ObliterazioneBiglietto(0)).to.emit(ticketing, "TicketObliterato");
    await expect(ticketing.ObliterazioneBiglietto(0)).to.be.revertedWith("Il biglietto non e' valido");
  });

  it("dopo la fine non si valida né si acquista", async function () {
    const { ticketing, start, end } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await goTo(end + 10);
    await expect(ticketing.ObliterazioneBiglietto(0)).to.be.revertedWith("Evento finito");
    await expect(ticketing.PrenotaBiglietto(0, 2, "Marco")).to.be.revertedWith("L'evento e' finito");
  });

  it("la cancellazione libera il posto e non si ripete", async function () {
    const { ticketing } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await ticketing.CancellaPrenotazioneBiglietto(0);
    await ticketing.PrenotaBiglietto(0, 1, "Marco"); // il posto è di nuovo vendibile
    await expect(ticketing.CancellaPrenotazioneBiglietto(0)).to.be.revertedWith("Il biglietto non e' valido");
  });

  it("cambia il nome sul biglietto", async function () {
    const { ticketing } = await setup();
    await ticketing.PrenotaBiglietto(0, 1, "Anna");
    await ticketing.CambiaNomeAcquirente(0, "Luca");
    const t = await ticketing.listaBiglietti(0);
    expect(t.nomeAcquirente).to.equal("Luca");
  });
});