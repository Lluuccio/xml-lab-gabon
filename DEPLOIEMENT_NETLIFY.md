# Publier XML Lab Gabon sur Netlify

## Méthode conseillée : GitHub

1. Crée un dépôt GitHub, par exemple `xml-lab-gabon`.
2. Ajoute tous les fichiers du dossier du projet dans ce dépôt, puis envoie-les sur GitHub.
3. Connecte-toi à Netlify.
4. Depuis le tableau de bord, choisis **Add new project** puis **Import an existing project**.
5. Sélectionne GitHub, autorise Netlify à voir le dépôt, puis choisis `xml-lab-gabon`.
6. À l'écran de configuration, ne renseigne pas de commande de build. Le fichier `netlify.toml` indique déjà que le dossier à publier est `.`.
7. Clique sur **Publish**.

Le site reçoit immédiatement une adresse qui se termine par `.netlify.app`.

## Mettre le site à jour

Après une modification, envoie les nouveaux fichiers sur la branche principale de GitHub. Netlify détecte le changement et publie automatiquement une nouvelle version.

## Méthode rapide sans GitHub

Sur Netlify, ouvre l'option de dépôt manuel (Drop) puis dépose le dossier du projet complet. Vérifie que ce dossier contient directement `index.html` et le dossier `assets`.

## Vérification après publication

1. Ouvre l'adresse fournie par Netlify.
2. Teste les cinq onglets.
3. Vérifie que les liens vers les fichiers XML, XSD, XSLT et Python s'ouvrent.
4. Si une page est introuvable, confirme que le dossier de publication est bien `.` et que `index.html` est à sa racine.
