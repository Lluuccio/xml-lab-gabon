"""Traduit les textes d'un menu XML avec l'API DOM minidom."""

from __future__ import annotations

import argparse
from pathlib import Path
import re
import sys
from xml.dom import Node, minidom
from xml.parsers.expat import ExpatError


def feuille_elements_texte(node: Node):
    """Parcourt l'arbre DOM et retourne les éléments feuilles ayant du texte."""
    for enfant in node.childNodes:
        if enfant.nodeType != Node.ELEMENT_NODE:
            continue

        contient_element = any(
            petit_enfant.nodeType == Node.ELEMENT_NODE for petit_enfant in enfant.childNodes
        )
        texte = "".join(
            petit_enfant.data for petit_enfant in enfant.childNodes if petit_enfant.nodeType == Node.TEXT_NODE
        ).strip()
        if texte and not contient_element:
            yield enfant, texte
        yield from feuille_elements_texte(enfant)


def remplacer_texte(element: Node, nouveau_texte: str) -> None:
    """Remplace tous les nœuds texte directs de l'élément par la traduction."""
    for enfant in list(element.childNodes):
        if enfant.nodeType == Node.TEXT_NODE:
            element.removeChild(enfant)
    element.appendChild(element.ownerDocument.createTextNode(nouveau_texte))


def nom_fichier_langue(langue: str) -> str:
    """Transforme le nom de la langue en nom de fichier sûr et lisible."""
    slug = re.sub(r"[^a-z0-9]+", "_", langue.lower()).strip("_")
    return slug or "traduction"


def traduire(source: Path, langue: str, destination: Path) -> int:
    try:
        document = minidom.parse(str(source))
    except (OSError, ExpatError) as erreur:
        print(f"ERREUR : impossible de lire le XML : {erreur}", file=sys.stderr)
        return 1

    elements = list(feuille_elements_texte(document.documentElement))
    if not elements:
        print("Aucun texte à traduire n'a été trouvé dans le fichier XML.")
        return 1

    print(f"\nLangue cible : {langue}")
    print("Laissez une réponse vide pour conserver le texte français.\n")
    for position, (element, texte_source) in enumerate(elements, start=1):
        identifiant = element.getAttribute("id") or f"{element.tagName}-{position}"
        try:
            traduction = input(f"[{identifiant}] {texte_source} -> ").strip()
        except (EOFError, KeyboardInterrupt):
            print("\nTraduction interrompue. Aucun fichier n'a été enregistré.")
            return 1
        if traduction:
            remplacer_texte(element, traduction)

    destination.parent.mkdir(parents=True, exist_ok=True)
    with destination.open("w", encoding="UTF-8") as fichier:
        document.writexml(fichier, addindent="  ", newl="\n", encoding="UTF-8")
    print(f"\nFichier traduit enregistré : {destination.resolve()}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description="Traduire les textes d'un menu XML avec minidom.")
    parser.add_argument("xml_file", type=Path, help="Fichier XML source en français")
    parser.add_argument("--langue", help="Langue cible, par exemple Punu ou Fang")
    parser.add_argument("--output", type=Path, help="Chemin du nouveau fichier XML")
    args = parser.parse_args()

    langue = args.langue or input("Langue locale cible : ").strip()
    if not langue:
        print("ERREUR : une langue cible est nécessaire.", file=sys.stderr)
        return 1
    destination = args.output or args.xml_file.with_name(f"menu_{nom_fichier_langue(langue)}.xml")
    return traduire(args.xml_file, langue, destination)


if __name__ == "__main__":
    raise SystemExit(main())
