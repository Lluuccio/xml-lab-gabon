# XML Lab Gabon

Application web pédagogique qui réunit cinq travaux XML inspirés de cas locaux : CNAMGS, SEEG, traduction de menus, audit de routeurs et analyse de tarifs de transport.

## Ouvrir le site

Ouvrez `index.html` dans un navigateur. Aucune installation JavaScript n'est nécessaire : le site utilise uniquement HTML, CSS et JavaScript.

Les interfaces web permettent de tester les démonstrations dans le navigateur. Les scripts Python associés sont les livrables académiques : ils s'exécutent localement depuis leur propre dossier.

## Structure

```text
assets/
  css/styles.css                 Interface responsive
  js/app.js                      Interactions des cinq ateliers
projets/
  cnamgs/                        XML + XSD + validateur Python
  seeg/                          XML + XPath + POO + XSLT
  traduction/                    XML + DOM minidom
  audit/                         XML + XPath de sécurité
  transport/                     XML + XPath + statistiques
index.html                       Application web
netlify.toml                     Configuration de publication Netlify
```

Chaque dossier `projets/...` contient un `README.md`, des fichiers XML d'exemple et le code Python correspondant.

## Publication sur Netlify

La méthode recommandée est GitHub + Netlify : elle permet de republier automatiquement le site à chaque modification.

1. Créez un dépôt GitHub vide, puis placez-y tous les fichiers de ce dossier.
2. Sur Netlify, choisissez **Add new project**, puis **Import an existing project**.
3. Autorisez l'accès à GitHub, choisissez le dépôt et la branche principale.
4. Laissez la commande de build vide. Le dossier de publication est déjà défini à `.` dans `netlify.toml`.
5. Cliquez sur **Publish**. Netlify fournit une adresse `*.netlify.app`.

Une fois le dépôt relié, chaque envoi de modifications vers la branche principale déclenche une nouvelle publication.

Pour publier ponctuellement sans GitHub, utilisez le dépôt manuel de Netlify et sélectionnez ce dossier contenant `index.html`.

## Important

- Les données de tarifs et les paramètres de facturation sont pédagogiques, pas des données officielles.
- Les traductions de langues locales doivent être validées par un locuteur compétent.
- L'audit de routeur lit uniquement un fichier XML local ; il ne contacte ni ne modifie aucun équipement réseau.
