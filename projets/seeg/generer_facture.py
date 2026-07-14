"""Génère une facture SEEG de démonstration à partir d'un fichier XML."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from decimal import Decimal, ROUND_HALF_UP
from pathlib import Path
import sys

from lxml import etree


ROOT = Path(__file__).resolve().parent
XSLT_PATH = ROOT / "facture_seeg.xslt"
FCFA = Decimal("1")


@dataclass(frozen=True)
class Tranche:
    """Une tranche tarifaire : limite de kWh et prix unitaire en FCFA."""

    limite: int | None
    prix_unitaire: Decimal


@dataclass(frozen=True)
class LigneFacture:
    libelle: str
    volume: int
    prix_unitaire: Decimal

    @property
    def montant(self) -> Decimal:
        return (self.prix_unitaire * self.volume).quantize(FCFA, rounding=ROUND_HALF_UP)


class CalculateurSEEG:
    """Regroupe la logique de calcul des consommations et taxes de l'exercice."""

    # Paramètres pédagogiques, à adapter si un barème officiel est fourni.
    TRANCHES = {
        "SOCIAL": (Tranche(50, Decimal("50")), Tranche(None, Decimal("85"))),
        "DOMESTIQUE": (Tranche(100, Decimal("70")), Tranche(150, Decimal("95")), Tranche(None, Decimal("125"))),
        "PROFESSIONNEL": (Tranche(150, Decimal("130")), Tranche(250, Decimal("160")), Tranche(None, Decimal("190"))),
    }
    FRAIS_SERVICE = {"CLASSIQUE": Decimal("1000"), "EDAN": Decimal("750")}
    TAUX_TVA = Decimal("0.18")
    TAUX_ORDURES = Decimal("0.02")

    def __init__(self, tarif: str, mode_facturation: str) -> None:
        self.tarif = tarif.upper()
        self.mode_facturation = mode_facturation.upper()
        if self.tarif not in self.TRANCHES:
            raise ValueError(f"Tarif inconnu : {tarif}")
        if self.mode_facturation not in self.FRAIS_SERVICE:
            raise ValueError(f"Mode de facturation inconnu : {mode_facturation}")

    def calculer_lignes(self, consommation: int) -> list[LigneFacture]:
        if consommation < 0:
            raise ValueError("L'index final ne peut pas être inférieur à l'index initial.")
        reste = consommation
        lignes: list[LigneFacture] = []
        for numero, tranche in enumerate(self.TRANCHES[self.tarif], start=1):
            volume = reste if tranche.limite is None else min(reste, tranche.limite)
            if volume:
                borne = "au-delà" if tranche.limite is None else f"jusqu'à {tranche.limite} kWh"
                lignes.append(LigneFacture(f"Tranche {numero} ({borne})", volume, tranche.prix_unitaire))
            reste -= volume
            if not reste:
                break
        return lignes

    def calculer_totaux(self, lignes: list[LigneFacture]) -> dict[str, Decimal]:
        frais_service = self.FRAIS_SERVICE[self.mode_facturation]
        hors_taxes = sum((ligne.montant for ligne in lignes), frais_service).quantize(FCFA)
        tva = (hors_taxes * self.TAUX_TVA).quantize(FCFA, rounding=ROUND_HALF_UP)
        ordures = (hors_taxes * self.TAUX_ORDURES).quantize(FCFA, rounding=ROUND_HALF_UP)
        return {
            "frais_service": frais_service,
            "ht": hors_taxes,
            "tva": tva,
            "om": ordures,
            "ttc": hors_taxes + tva + ordures,
        }


def child_text(element: etree._Element, xpath: str) -> str:
    """Extrait, par XPath relatif, le contenu obligatoire d'une balise."""
    values = element.xpath(xpath)
    if not values or not str(values[0]).strip():
        raise ValueError(f"Valeur XML manquante pour XPath : {xpath}")
    return str(values[0]).strip()


def add_element(parent: etree._Element, tag: str, value: object, **attributes: str) -> etree._Element:
    element = etree.SubElement(parent, tag, **attributes)
    element.text = str(value)
    return element


def construire_xml_facture(source: Path, client_id: str) -> etree._Element:
    """Extrait le client demandé avec XPath, calcule sa facture, puis retourne son XML."""
    tree = etree.parse(str(source))
    clients = tree.xpath("/releves/client[@id=$identifiant]", identifiant=client_id)
    if not clients:
        raise ValueError(f"Aucun client avec l'identifiant {client_id} n'a été trouvé.")

    client = clients[0]
    tarif = child_text(client, "./tarif/text()")
    mode = child_text(client, "./mode_facturation/text()")
    index_debut = int(child_text(client, "./index_debut/text()"))
    index_fin = int(child_text(client, "./index_fin/text()"))
    consommation = index_fin - index_debut
    calculateur = CalculateurSEEG(tarif, mode)
    lignes = calculateur.calculer_lignes(consommation)
    totaux = calculateur.calculer_totaux(lignes)

    facture = etree.Element("facture")
    add_element(facture, "reference", f"SEEG-{tree.xpath('string(/releves/@mois)')}-{client_id}")
    add_element(facture, "periode", tree.xpath("string(/releves/@mois)"))
    client_xml = etree.SubElement(facture, "client")
    add_element(client_xml, "id", client_id)
    for field in ("nom", "adresse", "tarif", "mode_facturation"):
        add_element(client_xml, field, child_text(client, f"./{field}/text()"))
    consommation_xml = etree.SubElement(facture, "consommation")
    add_element(consommation_xml, "index_debut", index_debut)
    add_element(consommation_xml, "index_fin", index_fin)
    add_element(consommation_xml, "volume", consommation)
    tranches_xml = etree.SubElement(facture, "tranches")
    for ligne in lignes:
        tranche_xml = etree.SubElement(tranches_xml, "tranche")
        add_element(tranche_xml, "libelle", ligne.libelle)
        add_element(tranche_xml, "volume", ligne.volume)
        add_element(tranche_xml, "prix_unitaire", ligne.prix_unitaire)
        add_element(tranche_xml, "montant", ligne.montant)
    totaux_xml = etree.SubElement(facture, "totaux")
    for name, value in totaux.items():
        add_element(totaux_xml, name, value)
    add_element(totaux_xml, "taux_tva", CalculateurSEEG.TAUX_TVA * 100)
    add_element(totaux_xml, "taux_om", CalculateurSEEG.TAUX_ORDURES * 100)
    return facture


def generer_html(facture: etree._Element, output: Path) -> None:
    """Applique la feuille XSLT au XML de facture et écrit la page HTML finale."""
    transformation = etree.XSLT(etree.parse(str(XSLT_PATH)))
    html = transformation(etree.ElementTree(facture))
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_bytes(etree.tostring(html, method="html", pretty_print=True, encoding="UTF-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Générer une facture SEEG HTML depuis un XML de relevés.")
    parser.add_argument("xml_file", type=Path, help="Fichier XML contenant les relevés")
    parser.add_argument("client_id", help="Identifiant du client à facturer, par exemple CL-1001")
    parser.add_argument("--output", type=Path, help="Nom de la page HTML créée")
    args = parser.parse_args()
    output = args.output or (ROOT / "sorties" / f"facture_{args.client_id}.html")

    try:
        facture = construire_xml_facture(args.xml_file, args.client_id)
        generer_html(facture, output)
    except (OSError, ValueError, etree.XMLSyntaxError, etree.XSLTError) as error:
        print(f"ERREUR : {error}", file=sys.stderr)
        return 1

    print(f"Facture générée : {output.resolve()}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
