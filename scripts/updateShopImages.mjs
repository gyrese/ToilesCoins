// Script pour associer les images WebP aux rewards Firestore
// Usage: node scripts/updateShopImages.mjs
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyD76tyqK8E3YxEVK_dN3yG29bOM9EID7h0",
  authDomain: "toilescoins.firebaseapp.com",
  projectId: "toilescoins",
  storageBucket: "toilescoins.firebasestorage.app",
  messagingSenderId: "8523289016",
  appId: "1:8523289016:web:10a1e30afdd98c84113f4d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Mapping : mots-clés dans le nom du reward → fichier image
const imageMap = [
  { keywords: ['soft', 'soda', 'boisson', 'coca', 'jus', 'limonade'],  file: '/shop/soft.webp' },
  { keywords: ['bière', 'biere', 'beer', 'pinte', 'alcool'],           file: '/shop/beer.webp' },
  { keywords: ['burger', 'sandwich', 'food', 'repas', 'menu'],         file: '/shop/burger.webp' },
  { keywords: ['nachos', 'chips', 'snack', 'pop-corn', 'popcorn'],     file: '/shop/nachos.webp' },
  { keywords: ['shot', 'cocktail', 'verre', 'shooter'],                file: '/shop/shot.webp' },
  { keywords: ['fifa', 'jeu', 'game', 'partie', 'console'],            file: '/shop/fifa.webp' },
];

function findImage(name = '', icon = '') {
  const text = (name + ' ' + icon).toLowerCase();
  for (const { keywords, file } of imageMap) {
    if (keywords.some(k => text.includes(k))) return file;
  }
  return null;
}

const snap = await getDocs(collection(db, 'rewards'));

console.log(`\n${snap.size} reward(s) trouvé(s) :\n`);

const updates = [];
snap.forEach(d => {
  const data = d.data();
  const image = findImage(data.name, data.icon);
  const current = data.imageUrl || '—';
  console.log(`[${d.id}] "${data.name}" ${data.icon}`);
  console.log(`  actuel: ${current}`);
  console.log(`  → ${image || '(aucune correspondance)'}`);
  if (image) updates.push({ id: d.id, image });
});

if (updates.length === 0) {
  console.log('\nAucune mise à jour à faire.');
  process.exit(0);
}

console.log(`\nMise à jour de ${updates.length} reward(s)...`);
await Promise.all(updates.map(({ id, image }) =>
  updateDoc(doc(db, 'rewards', id), { imageUrl: image })
));

console.log('✓ Images associées avec succès.\n');
process.exit(0);
