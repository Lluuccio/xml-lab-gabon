# Projet 03 - Traducteur de menus en langues locales

Le programme utilise exclusivement `xml.dom.minidom`, l'API DOM demandée dans l'énoncé. Il parcourt les éléments XML qui contiennent un texte, demande la traduction de chaque terme dans le terminal, remplace les nœuds texte, puis crée un nouveau fichier XML.

Le script ne fournit pas de traduction automatique : les mots saisis doivent être vérifiés par un locuteur compétent de la langue choisie.

## Lancer le programme

Depuis ce dossier :

```powershell
python traduire_menu.py exemples/menu_fr.xml --langue Punu
```

Répondez à chaque question. Le fichier final est créé dans `exemples/menu_punu.xml` si aucune option `--output` n'est donnée.

```powershell
python traduire_menu.py exemples/menu_fr.xml --langue Fang --output menu_fang.xml
```
