"""Valide une déclaration de facturation CNAMGS avec le schéma XSD du projet."""

from __future__ import annotations

import argparse
from pathlib import Path
import sys

from lxml import etree


ROOT = Path(__file__).resolve().parent
DEFAULT_SCHEMA = ROOT / "cnamgs_schema.xsd"


def format_error(error: etree._LogEntry) -> str:
    """Transforme une erreur lxml en message lisible pour l'utilisateur."""
    location = f"ligne {error.line}"
    if error.column:
        location += f", colonne {error.column}"
    message = error.message.strip()
    return f"Erreur à la {location} : {message}"


def validate(xml_path: Path, schema_path: Path) -> list[str]:
    """Retourne la liste des erreurs XSD du fichier XML, ou une liste vide s'il est valide."""
    try:
        schema_document = etree.parse(str(schema_path))
        schema = etree.XMLSchema(schema_document)
    except (OSError, etree.XMLSyntaxError, etree.XMLSchemaParseError) as error:
        raise RuntimeError(f"Impossible de charger le schéma XSD : {error}") from error

    try:
        xml_document = etree.parse(str(xml_path))
    except OSError as error:
        raise RuntimeError(f"Impossible de lire le fichier XML : {error}") from error
    except etree.XMLSyntaxError as error:
        return [format_error(entry) for entry in error.error_log]

    if schema.validate(xml_document):
        return []

    return [format_error(entry) for entry in schema.error_log]


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Valider un fichier XML de facturation CNAMGS avec un schéma XSD."
    )
    parser.add_argument("xml_file", type=Path, help="Chemin du fichier XML à contrôler")
    parser.add_argument(
        "--schema",
        type=Path,
        default=DEFAULT_SCHEMA,
        help="Chemin du schéma XSD (par défaut : cnamgs_schema.xsd)",
    )
    arguments = parser.parse_args()

    try:
        errors = validate(arguments.xml_file, arguments.schema)
    except RuntimeError as error:
        print(f"ERREUR TECHNIQUE : {error}", file=sys.stderr)
        return 2

    if not errors:
        print("Fichier valide, prêt à l'envoi.")
        return 0

    print(f"Fichier invalide : {len(errors)} erreur(s) détectée(s).")
    for error in errors:
        print(f"- {error}")
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
