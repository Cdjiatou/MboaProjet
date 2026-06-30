// Fichier d'entrée pour Phusion Passenger (cPanel / O2Switch)
// Passenger utilise ce fichier pour démarrer l'application Node.js.
// Il s'attend à ce que l'application écoute sur le port fourni par process.env.PORT.

// On charge simplement notre application compilée (dist/index.js)
require('./dist/index.js');
