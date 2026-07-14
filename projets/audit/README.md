# Projet 04 - Audit de sécurité des routeurs

Ce projet analyse des fichiers XML de configuration avec XPath. C'est un outil pédagogique et défensif : il inspecte un fichier local, sans se connecter à un routeur et sans modifier de configuration.

Les règles vérifiées sont celles de l'énoncé : désactivation de Telnet, chiffrement fort, administration SSH version 2 et respect du critère pédagogique de changement des ports par défaut. Un changement de port est une mesure complémentaire ; il ne remplace pas un contrôle d'accès ou le chiffrement.

## Installation et lancement

```powershell
python -m pip install -r requirements.txt
python audit_routeur.py exemples/routeur_non_conforme.xml
python audit_routeur.py exemples/routeur_conforme.xml
```

Le premier exemple doit produire six constats. Le second ne doit produire aucun constat.
