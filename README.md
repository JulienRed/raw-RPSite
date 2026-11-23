# RAW RP — site + panel admin (version locale)

## Ouvrir le site
Double-clique sur **index.html**. Ça s'ouvre dans ton navigateur, sans rien installer.

## Modifier le site
1. Clique sur la **petite étoile ★** en haut à droite du logo RAW (ou ouvre directement **admin.html**).
2. Première fois : choisis un mot de passe (6 caractères minimum). Ensuite il te sera demandé à chaque ouverture.
3. Choisis une partie à gauche, modifie les champs : l'aperçu à droite change en direct.
4. Clique sur **Enregistrer**, puis rafraîchis le site (F5) : les changements sont là.

Pour sortir du panel : bouton **Déconnexion** en haut à droite.

Mise en forme : `*texte*` = en couleur, `**texte**` = gras. Flèches ↶ ↷ (ou Ctrl+Z) pour annuler. Ctrl+S pour enregistrer.

## Où sont enregistrées les modifications ?
- **Enregistrer** les garde dans ton navigateur : le site ouvert **sur ce PC, dans ce navigateur** les affiche.
- Pour les écrire dans les fichiers du dossier (indispensable avant de mettre le site sur GitHub) :
  - **Chrome ou Edge** : bandeau en haut du panel › **Relier le dossier du site**, choisis ce dossier. Ensuite chaque « Enregistrer » met à jour `content.js` et range tes images dans `images/`.
  - **Autre navigateur** : menu **⋯** › **Télécharger content.js**, puis remplace le `content.js` de ce dossier par celui téléchargé.

## Fichiers
| Fichier | Rôle |
|---|---|
| `index.html`, `style.css`, `script.js` | Le site |
| `content.js` | Tout le contenu du site (écrit par le panel admin) |
| `defaults.js` | Contenu de secours |
| `admin.html`, `admin.css`, `admin.js` | Le panel admin |
| `images/` | Le logo, l'icône d'onglet et tes images |

## En ligne (GitHub Pages)
Adresse du site : https://julienred.github.io/raw-RPSite/
Pour l'activer : dépôt › Settings › Pages › Deploy from a branch › branche `main`, dossier `/(root)` › Save.
Pour mettre à jour le site en ligne : modifie en local, puis renvoie `content.js` (et `images/`) dans le dépôt.
Attention : en ligne, le panel n'enregistre que dans le navigateur de la personne qui l'utilise, il ne modifie pas le site pour les autres. Pour mettre le site à jour, tu modifies en local puis tu renvoies `content.js` (et `images/`) sur GitHub. Le mot de passe protège seulement l'accès au panel sur ton appareil : ce n'est pas une vraie sécurité de serveur.
