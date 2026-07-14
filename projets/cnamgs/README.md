# Projet 01 - Validateur de fichiers CNAMGS

## Fichiers

- `cnamgs_schema.xsd` : schéma qui impose les règles de structure et de format.
- `exemples/facturation_valide.xml` : déclaration conforme au schéma.
- `exemples/facturation_invalide.xml` : déclaration qui contient volontairement plusieurs erreurs.
- `validate_cnamgs.py` : programme Python qui produit un rapport de validation lisible.

## Installation

```powershell
python -m pip install -r requirements.txt
```

## Lancer la validation

Depuis le dossier `projets/cnamgs` :

```powershell
python validate_cnamgs.py exemples/facturation_valide.xml
python validate_cnamgs.py exemples/facturation_invalide.xml
```

Le premier fichier doit afficher `Fichier valide, prêt à l'envoi.`. Le second doit afficher les erreurs, avec leurs lignes dans le document XML.
