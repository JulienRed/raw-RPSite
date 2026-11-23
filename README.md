# RAW RP — site + panel admin

Site en ligne : https://julienred.github.io/raw-RPSite/
(à activer une fois : dépôt › Settings › Pages › Deploy from a branch › `main` › `/(root)` › Save)

## Modifier le site
1. Clique sur la **petite étoile ★** en haut à droite du logo RAW (ou ouvre `admin.html`).
2. Entre le mot de passe admin.
3. Modifie ce que tu veux : l'aperçu change en direct.
4. Clique sur **Publier** : le site est mis à jour **pour tout le monde** d'ici 1 à 2 minutes.

Onglets utiles :
- **Arrière-plan** : change la photo de fond de l'accueil en un clic (envoyer une photo, ou « Images du site… » pour reprendre une image déjà en ligne), choisis la partie visible et assombris-la si besoin.
- **Blocs de l'accueil** : toutes les parties de l'accueil dans l'ordre. « Ajouter un bloc » : texte, image, texte + image, liste, cartes, galerie, boutons, annonce, chiffres clés, questions/réponses, vidéo YouTube, espace. Flèches ↑ ↓ pour déplacer, ✕ pour supprimer, case à cocher pour masquer.
- **Pages** : crée des pages en plus (Staff, Recrutement…) remplies de blocs. Adresse : `…/#p-nom-de-la-page`, à utiliser dans les liens des boutons.

Si le site a été modifié ailleurs depuis l'ouverture du panel, « Publier » te prévient avant d'écraser quoi que ce soit.

Bouton **Déconnexion** en haut à droite. Flèches ↶ ↷ pour annuler. Ctrl+S pour publier.
Mise en forme : `*texte*` = en couleur, `**texte**` = gras, `[texte](https://…)` = lien, ligne vide = nouveau paragraphe.

## Première connexion (une seule fois)
Le panel demande un **jeton GitHub** (il permet de publier), puis tu choisis :
- un **mot de passe admin** (12 caractères minimum), le même sur tous les appareils ;
- une **phrase secrète** (20 caractères minimum) pour « Mot de passe oublié » ;
- un **indice** facultatif (visible par tous, donc ne mets pas la réponse).

Créer le jeton : github.com › Settings › Developer settings › Fine-grained tokens › Generate new token.
Accès : *Only select repositories* › `raw-RPSite`. Permission : **Contents : Read and write**, rien d'autre. Expiration : la plus longue possible.

## Mot de passe oublié
Sur l'écran de connexion › **Mot de passe oublié ?** › entre ta phrase secrète (majuscules, accents et ponctuation ne comptent pas) › choisis un nouveau mot de passe. Sans la phrase, impossible de réinitialiser.

## Sécurité : comment ça marche
- Le jeton GitHub est enregistré dans `admin.json`, **chiffré deux fois** : une copie avec ton mot de passe, une avec ta phrase secrète (AES-256, clé dérivée par PBKDF2, 600 000 tours). Sans l'un des deux, ce fichier est inutilisable.
- Le dépôt est public : quelqu'un pourrait récupérer `admin.json` et essayer des milliers de mots de passe sur son ordinateur. Ça reste impraticable **si le mot de passe et la phrase sont longs et pas devinables**. N'utilise pas un mot de passe que tu as déjà ailleurs.
- Le jeton ne peut modifier **que ce dépôt**. S'il y a un doute : supprime-le sur GitHub (Fine-grained tokens), crée-en un nouveau, puis menu ⋯ › **Remplacer le jeton GitHub**.
- Menu ⋯ : changer le mot de passe, changer la phrase secrète, historique des versions (chaque publication est gardée sur GitHub et peut être restaurée).
- Quand le jeton expire, le panel te demande d'en coller un nouveau.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html`, `style.css`, `script.js` | Le site |
| `content.js` | Tout le contenu du site (écrit par le panel) |
| `admin.json` | Accès admin chiffré (créé à la première connexion) |
| `admin.html`, `admin.css`, `admin.js` | Le panel admin |
| `depot.js` | Nom du dépôt GitHub utilisé par le panel |
| `defaults.js` | Contenu de secours |
| `images/` | Logo, icône et images envoyées depuis le panel |
