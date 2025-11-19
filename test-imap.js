// Script de test de connexion IMAP
import Imap from 'imap';

console.log('🔍 Test de connexion IMAP à Gandi...\n');

const imap = new Imap({
  user: 'contact@allure-creation.fr',
  password: 'sovmij-nebbuk-0kexJy',
  host: 'mail.gandi.net',
  port: 993,
  tls: true,
  tlsOptions: {
    rejectUnauthorized: true,
    minVersion: 'TLSv1.2'
  },
  authTimeout: 10000,
  connTimeout: 10000,
  keepalive: false,
  debug: console.log
});

imap.once('ready', () => {
  console.log('✅ Connexion IMAP réussie !');

  imap.getBoxes((err, boxes) => {
    if (err) {
      console.error('❌ Erreur lors de la récupération des boîtes:', err);
      imap.end();
      return;
    }

    console.log('\n📬 Boîtes mail disponibles:');
    console.log(JSON.stringify(boxes, null, 2));

    imap.end();
  });
});

imap.once('error', (err) => {
  console.error('❌ Erreur de connexion IMAP:', err.message);
  console.error('Détails:', err);
});

imap.once('end', () => {
  console.log('\n👋 Connexion fermée');
  process.exit(0);
});

console.log('⏳ Tentative de connexion...');
imap.connect();

// Timeout de sécurité
setTimeout(() => {
  console.error('⏰ Timeout après 30 secondes');
  process.exit(1);
}, 30000);
