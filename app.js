import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    addDoc, 
    onSnapshot, 
    query, 
    orderBy, 
    where, // <--- AJOUTÉ : INDISPENSABLE POUR LE FILTRE
    serverTimestamp, 
    doc, 
    updateDoc 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

// Ta config (gardée intacte)
const firebaseConfig = {
    apiKey: "AIzaSyAkfiKolE2zZoqZfLCtSvmcgcwwXuR5jsE",
    authDomain: "bege-poulet.firebaseapp.com",
    projectId: "bege-poulet",
    storageBucket: "bege-poulet.firebasestorage.app",
    messagingSenderId: "203671154040",
    appId: "1:203671154040:web:5f7bdfc9a784cfcb166c8d"
};

// Initialisation
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- FONCTIONNALITÉ 1 : SYNC DES DONNÉES (TEMPS RÉEL AVEC FILTRE) ---
function chargerDonneesReelles() {
    // 1. Écouter les productions (UNIQUEMENT LES POULETS)
    // On ajoute 'where' pour ne pas afficher le stock dans le suivi
    const qProductions = query(
        collection(db, "productions"), 
        where("type", "==", "poulet"), 
        orderBy("createdAt", "desc")
    );

    onSnapshot(qProductions, (snapshot) => {
        let listeBandes = [];
        snapshot.forEach((doc) => {
            listeBandes.push({ id: doc.id, ...doc.data() });
        });
        if (typeof updateUI === "function") updateUI(listeBandes); 
    });

    // 2. Écouter le Magasin (STOCK)
    // On écoute la collection 'stocks' que l'on a créée
    onSnapshot(collection(db, "stocks"), (snapshot) => {
        const container = document.getElementById('inventory-list');
        if (!container) return;
        container.innerHTML = "";
        snapshot.forEach(docSnap => {
            const s = docSnap.data();
            container.innerHTML += `
                <div class="card" style="margin-bottom:10px; padding:15px; border-left:4px solid #3498db;">
                    <strong>${s.article}</strong> : ${s.quantite} Unités
                    <br><small>${(s.prixTotal || 0).toLocaleString()} CFA</small>
                </div>`;
        });
    });
}

// --- FONCTIONNALITÉ 2 : ENREGISTRER DU STOCK ---
window.ajouterAuMagasin = async function() {
    const item = document.getElementById('st-item').value;
    const qty = parseInt(document.getElementById('st-qty').value);
    const cost = parseInt(document.getElementById('st-cost').value);

    if (qty && cost) {
        try {
            await addDoc(collection(db, "stocks"), {
                article: item,
                quantite: qty,
                prixTotal: cost,
                createdAt: serverTimestamp()
            });
            alert("Stock mis à jour !");
            if (typeof closeModal === "function") closeModal('modal-stock-add');
        } catch (e) {
            console.error(e);
        }
    }
};

// --- FONCTIONNALITÉ 3 : CRÉER UNE BANDE (AVEC LE TYPE POULET) ---
window.creerNouvelleBande = async function() {
    const name = document.getElementById('b-name').value;
    const qty = parseInt(document.getElementById('b-qty').value);
    const cost = parseInt(document.getElementById('b-cost').value);

    if(name && qty) {
        await addDoc(collection(db, "productions"), {
            name: name,
            type: "poulet", // <--- C'EST CA QUI PERMET LE FILTRAGE
            startQty: qty,
            currentQty: qty,
            expenses: cost,
            createdAt: serverTimestamp()
        });
        if (typeof closeModal === "function") closeModal('modal-bande');
    }
}

// Lancer le chargement
chargerDonneesReelles();