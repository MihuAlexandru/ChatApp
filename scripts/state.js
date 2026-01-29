/// ceva state pentru aplicatie, mostly contacte

export const state = {
  contacts: [], // lista de contacte
  activeContactId: null, //id-ul conversatiei curente deschise
  contactRowEls: new Map(), // tine id-ul contactului si elementul efectiv de <li>
};
