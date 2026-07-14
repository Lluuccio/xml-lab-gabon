# Projet 02 - Moteur de facturation SEEG

Le programme lit un fichier XML de relevés, sélectionne un client par **XPath**, applique la logique de calcul avec des **classes Python**, puis transforme le XML de facture en page HTML avec **XSLT**.

Les tarifs, frais de service et taux de taxe inscrits dans `generer_facture.py` sont des paramètres pédagogiques. Ils sont clairement séparés dans la classe `CalculateurSEEG` pour pouvoir être adaptés au barème demandé par l'enseignant.

## Installation

```powershell
python -m pip install -r requirements.txt
```

## Générer une facture

Depuis ce dossier :

```powershell
python generer_facture.py exemples/consommations.xml CL-1001
```

Le fichier HTML est créé dans `sorties/facture_CL-1001.html`. Pour choisir un autre emplacement :

```powershell
python generer_facture.py exemples/consommations.xml CL-1002 --output facture_sociale.html
```
