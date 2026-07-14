"""Audit défensif de configuration de routeur XML, basé sur XPath."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import sys

from lxml import etree


@dataclass(frozen=True)
class Constat:
    niveau: str
    titre: str
    detail: str
    recommandation: str


class AuditeurRouteur:
    """Évalue une configuration XML par rapport aux règles pédagogiques de l'exercice."""

    PROTOCOLES_FORTS = {"AES", "AES-128", "AES-192", "AES-256", "CHACHA20-POLY1305"}
    PORTS_ADMIN_PAR_DEFAUT = {"80", "443"}

    def __init__(self, xml_file: Path) -> None:
        self.arbre = etree.parse(str(xml_file))
        self.racine = self.arbre.getroot()

    def valeur_xpath(self, expression: str) -> str:
        """Extrait une valeur par XPath et retourne une chaîne vide si elle est absente."""
        valeur = self.racine.xpath(f"string({expression})")
        return str(valeur).strip()

    def auditer(self) -> list[Constat]:
        constats: list[Constat] = []
        telnet = self.valeur_xpath("/configuration_routeur/services/telnet/@enabled").lower()
        if telnet != "false":
            constats.append(Constat(
                "ÉLEVÉE",
                "Telnet est activé ou non déclaré comme désactivé",
                "Telnet transmet les identifiants et commandes sans chiffrement.",
                'Définir <telnet enabled="false"/> et administrer l’équipement via SSH.',
            ))

        protocole = self.valeur_xpath("/configuration_routeur/securite/chiffrement/@protocole").upper()
        bits = self.valeur_xpath("/configuration_routeur/securite/chiffrement/@bits")
        try:
            taille_cle = int(bits)
        except ValueError:
            taille_cle = 0
        if protocole not in self.PROTOCOLES_FORTS or taille_cle < 128:
            constats.append(Constat(
                "ÉLEVÉE",
                "Chiffrement insuffisant",
                f"Protocole détecté : {protocole or 'absent'} ; taille de clé : {bits or 'absente'} bits.",
                "Utiliser un protocole fort, par exemple AES avec une clé d’au moins 128 bits.",
            ))

        ssh_active = self.valeur_xpath("/configuration_routeur/services/ssh/@enabled").lower()
        ssh_version = self.valeur_xpath("/configuration_routeur/services/ssh/@version")
        if ssh_active != "true" or ssh_version != "2":
            constats.append(Constat(
                "ÉLEVÉE",
                "SSH version 2 n’est pas explicitement imposé",
                f"SSH activé : {ssh_active or 'non déclaré'} ; version : {ssh_version or 'non déclarée'}.",
                'Activer SSH et déclarer version="2".',
            ))

        port_ssh = self.valeur_xpath("/configuration_routeur/services/ssh/@port")
        if port_ssh == "22":
            constats.append(Constat(
                "MOYENNE",
                "Port SSH par défaut détecté",
                "Le port d’administration SSH est 22.",
                "Pour le critère de l’exercice, utiliser un port d’administration documenté différent de 22. Ce changement complète, mais ne remplace jamais, les contrôles d’accès.",
            ))

        protocole_admin = self.valeur_xpath("/configuration_routeur/securite/administration/@protocole").upper()
        port_admin = self.valeur_xpath("/configuration_routeur/securite/administration/@port")
        if protocole_admin != "HTTPS":
            constats.append(Constat(
                "ÉLEVÉE",
                "Interface d’administration non chiffrée",
                f"Protocole d’administration détecté : {protocole_admin or 'absent'}.",
                "Utiliser HTTPS pour l’interface Web d’administration.",
            ))
        if port_admin in self.PORTS_ADMIN_PAR_DEFAUT:
            constats.append(Constat(
                "MOYENNE",
                "Port Web d’administration par défaut détecté",
                f"Port détecté : {port_admin}.",
                "Pour le critère de l’exercice, choisir un port documenté différent des ports Web par défaut et restreindre l’accès par pare-feu.",
            ))
        return constats


def imprimer_rapport(auditeur: AuditeurRouteur, constats: list[Constat]) -> None:
    agence = auditeur.racine.get("agence", "Agence non renseignée")
    equipement = auditeur.racine.get("equipement", "Équipement non renseigné")
    print(f"RAPPORT D’AUDIT - {agence} / {equipement}")
    print("=" * 62)
    if not constats:
        print("Aucune vulnérabilité détectée selon les règles pédagogiques configurées.")
        return
    print(f"{len(constats)} vulnérabilité(s) détectée(s).\n")
    for numero, constat in enumerate(constats, start=1):
        print(f"[{numero}] {constat.niveau} - {constat.titre}")
        print(f"    Constat : {constat.detail}")
        print(f"    Action  : {constat.recommandation}\n")


def main() -> int:
    parser = argparse.ArgumentParser(description="Auditer une configuration de routeur XML avec XPath.")
    parser.add_argument("xml_file", type=Path, help="Fichier XML de configuration à analyser")
    args = parser.parse_args()
    try:
        auditeur = AuditeurRouteur(args.xml_file)
        constats = auditeur.auditer()
    except (OSError, etree.XMLSyntaxError) as erreur:
        print(f"ERREUR : impossible d’auditer ce fichier : {erreur}", file=sys.stderr)
        return 2
    imprimer_rapport(auditeur, constats)
    return 1 if constats else 0


if __name__ == "__main__":
    raise SystemExit(main())
