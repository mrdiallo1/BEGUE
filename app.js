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

function updateUI(listeBandes) {
    const container = document.getElementById('list-bandes');
    if (!container) return;

    if (listeBandes.length === 0) {
        container.innerHTML = '<p style="text-align:center; color:#999; margin-top:20px;">Aucune bande active.</p>';
        return;
    }

    container.innerHTML = ''; // On vide le message de chargement
    
    listeBandes.forEach(b => {
        // On calcule le taux de perte pour le style
        const perte = b.startQty - b.currentQty;
        
        container.innerHTML += `
            <div class="card-bande" onclick="ouvrirDetails('${b.id}', '${b.name}')" 
                 style="background:white; padding:15px; border-radius:15px; margin-bottom:15px; box-shadow:0 4px 6px rgba(0,0,0,0.05); border-left:5px solid #27ae60; cursor:pointer;">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <h3 style="margin:0; color:#2c3e50;">${b.name}</h3>
                        <small style="color:#7f8c8d;">Lancée le : ${b.createdAt ? b.createdAt.toDate().toLocaleDateString() : '...'}</small>
                    </div>
                    <div style="text-align:right;">
                        <span style="font-size:1.2rem; font-weight:bold; color:#27ae60;">${b.currentQty}</span>
                        <div style="font-size:0.7rem; color:#e74c3c;">-${perte} têtes</div>
                    </div>
                </div>
                <div style="margin-top:10px; font-size:0.85rem; color:#34495e;">
                    <strong>Dépenses :</strong> ${b.expenses ? b.expenses.toLocaleString() : 0} CFA
                </div>
                <div style="text-align:right; font-size:0.8rem; color:#3498db; margin-top:5px;">
                    Voir l'historique <i class="fa-solid fa-chevron-right"></i>
                </div>
            </div>
        `;
    });
}
