# Projet 05 - Analyseur de tarifs de transport terrestre

Les prix de `exemples/tarifs_transport.xml` sont des données fictives et pédagogiques. Le script sélectionne les nœuds XML avec XPath, puis calcule le trajet le moins cher et les prix moyens à partir des résultats.

## Installation et lancement

```powershell
python -m pip install -r requirements.txt
python analyser_tarifs.py exemples/tarifs_transport.xml
```

## Commandes interactives

```text
moins-cher Bitam
moyenne Libreville Franceville
offres Oyem
quitter
```

Pour une commande directe :

```powershell
python analyser_tarifs.py exemples/tarifs_transport.xml --commande "moyenne Libreville Franceville"
```
