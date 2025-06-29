const express = require('express');
const path = require('path');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 3010;
let utilisateursConnectés = {};

// ✅ Middleware de log
app.use((req, res, next) => {
  console.log("➡ Nouvelle requête :", req.method, req.url);
  next();
});

// ✅ Encodage admin sécurisé
const ADMIN_KEY = Buffer.from("admin").toString("base64");   // "YWRtaW4="
const ADMIN_NAME = Buffer.from("Jerem").toString("base64");  // "SmVyZW0="

// ✅ Middlewares
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

// ✅ Routes
app.get('/', (req, res) => {
  res.redirect('/login');
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login2.html'));
});

// ✅ Traitement du formulaire
app.post('/login2', (req, res) => {
  const input = req.body.pseudo?.trim().toLowerCase();
  if (!input) return res.redirect('/');

  const isAdmin = Buffer.from(input).toString("base64") === ADMIN_KEY;
  const visibleName = isAdmin
    ? Buffer.from(ADMIN_NAME, "base64").toString("utf8")
    : req.body.pseudo.trim();

  res.send(`
    <html>
      <body>
        <script>
          sessionStorage.setItem("pseudo", ${JSON.stringify(visibleName)});
          sessionStorage.setItem("isAdmin", ${JSON.stringify(isAdmin)});
          window.location.href = "/index.html";
        </script>
      </body>
    </html>
  `);
});

app.get('/index.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ✅ Socket.io
io.on('connection', (socket) => {
  console.log("🔌 Connexion d’un utilisateur");

  socket.on('nouvel_utilisateur', ({ nom, estAdmin }) => {
    utilisateursConnectés[socket.id] = { nom, estAdmin, effetsActifs: false };
    io.emit('mise_a_jour_utilisateurs', Object.values(utilisateursConnectés));
  });

  socket.on('admin_toggle_effets', ({ cible }) => {
    for (let id in utilisateursConnectés) {
      if (utilisateursConnectés[id].nom === cible) {
        utilisateursConnectés[id].effetsActifs = !utilisateursConnectés[id].effetsActifs;
        io.to(id).emit('toggle_effets', utilisateursConnectés[id].effetsActifs);
        break;
      }
    }
    io.emit('mise_a_jour_utilisateurs', Object.values(utilisateursConnectés));
  });

  socket.on('disconnect', () => {
    const utilisateur = utilisateursConnectés[socket.id];
    if (utilisateur) {
      console.log(`👋 Déconnexion de ${utilisateur.nom}`);
      delete utilisateursConnectés[socket.id];
      io.emit('mise_a_jour_utilisateurs', Object.values(utilisateursConnectés));
    }
  });
});

// ✅ Démarrage du serveur
server.listen(PORT, () => {
  console.log(`✅ Serveur lancé sur http://localhost:${PORT}`);
});
