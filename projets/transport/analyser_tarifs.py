"""Analyse des tarifs de transport stockés dans un fichier XML avec XPath."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal
from pathlib import Path
import sys

from lxml import etree


@dataclass(frozen=True)
class Offre:
    agence: str
    depart: str
    arrivee: str
    vehicule: str
    prix: Decimal


class AnalyseurTarifs:
    """Extrait les trajets XML avec XPath et calcule les indicateurs demandés."""

    def __init__(self, xml_file: Path) -> None:
        self.arbre = etree.parse(str(xml_file))

    def offres(self, depart: str | None = None, arrivee: str | None = None) -> list[Offre]:
        """Retourne les offres qui correspondent aux critères, grâce à XPath."""
        expression = "//trajet"
        variables: dict[str, str] = {}
        conditions: list[str] = []
        if depart:
            conditions.append("@depart=$depart")
            variables["depart"] = depart
        if arrivee:
            conditions.append("@arrivee=$arrivee")
            variables["arrivee"] = arrivee
        if conditions:
            expression += "[" + " and ".join(conditions) + "]"

        resultats: list[Offre] = []
        for trajet in self.arbre.xpath(expression, **variables):
            agence = trajet.getparent().get("nom", "Agence sans nom")
            for offre in trajet.xpath("./offre"):
                resultats.append(Offre(
                    agence=agence,
                    depart=trajet.get("depart", ""),
                    arrivee=trajet.get("arrivee", ""),
                    vehicule=offre.get("vehicule", ""),
                    prix=Decimal(offre.get("prix", "0")),
                ))
        return resultats

    def moins_cher(self, destination: str) -> Offre | None:
        resultats = self.offres(arrivee=destination)
        return min(resultats, key=lambda offre: offre.prix) if resultats else None

    def prix_moyen(self, depart: str, arrivee: str) -> Decimal | None:
        resultats = self.offres(depart, arrivee)
        if not resultats:
            return None
        return sum((offre.prix for offre in resultats), Decimal("0")) / len(resultats)


def afficher_offres(offres: list[Offre]) -> None:
    if not offres:
        print("Aucune offre ne correspond à cette recherche.")
        return
    for offre in sorted(offres, key=lambda ligne: ligne.prix):
        print(f"- {offre.agence} | {offre.depart} -> {offre.arrivee} | {offre.vehicule} | {offre.prix:,.0f} FCFA")


def executer_commande(analyseur: AnalyseurTarifs, commande: str) -> bool:
    """Exécute une requête saisie au terminal. Retourne False pour arrêter la boucle."""
    morceaux = commande.strip().split()
    if not morceaux:
        return True
    action = morceaux[0].lower()
    if action in {"quitter", "exit", "q"}:
        return False
    if action == "aide":
        print("Commandes : moins-cher DESTINATION | moyenne DEPART DESTINATION | offres DESTINATION | quitter")
        return True
    if action == "moins-cher" and len(morceaux) == 2:
        offre = analyseur.moins_cher(morceaux[1])
        if offre:
            print(f"Le trajet le moins cher vers {morceaux[1]} : {offre.agence}, {offre.vehicule}, {offre.prix:,.0f} FCFA.")
        else:
            print("Aucune offre ne correspond à cette destination.")
        return True
    if action == "moyenne" and len(morceaux) == 3:
        moyenne = analyseur.prix_moyen(morceaux[1], morceaux[2])
        if moyenne is None:
            print("Aucune offre ne correspond à ce trajet.")
        else:
            print(f"Prix moyen {morceaux[1]} -> {morceaux[2]} : {moyenne:,.0f} FCFA.")
        return True
    if action == "offres" and len(morceaux) == 2:
        afficher_offres(analyseur.offres(arrivee=morceaux[1]))
        return True
    print("Commande non reconnue. Écrivez aide pour voir les exemples.")
    return True


def main() -> int:
    parser = argparse.ArgumentParser(description="Interroger une base XML de tarifs de transport.")
    parser.add_argument("xml_file", type=Path, help="Fichier XML contenant les tarifs")
    parser.add_argument("--commande", help="Exécute une commande puis s’arrête")
    args = parser.parse_args()
    try:
        analyseur = AnalyseurTarifs(args.xml_file)
    except (OSError, etree.XMLSyntaxError) as erreur:
        print(f"ERREUR : impossible de lire le fichier XML : {erreur}", file=sys.stderr)
        return 1

    if args.commande:
        executer_commande(analyseur, args.commande)
        return 0

    print("Analyseur de tarifs. Écrivez aide pour connaître les commandes.")
    while True:
        try:
            continuer = executer_commande(analyseur, input("tarifs> "))
        except (EOFError, KeyboardInterrupt):
            print("\nFin de l’analyse.")
            break
        if not continuer:
            break
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
