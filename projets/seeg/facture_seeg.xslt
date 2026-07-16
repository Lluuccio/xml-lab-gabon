<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="UTF-8" indent="yes"/>
  <xsl:decimal-format name="fcfa" decimal-separator="." grouping-separator=" "/>

  <xsl:template match="/facture">
    <html lang="fr">
      <head>
        <meta charset="UTF-8"/>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Facture SEEG - <xsl:value-of select="client/nom"/></title>
        <style>
          body { margin: 0; color: #102a43; background: #f5f8fa; font: 15px Arial, sans-serif; }
          .invoice { max-width: 860px; margin: 36px auto; overflow: hidden; background: #fff; box-shadow: 0 12px 30px #d9e2ec; }
          header { display: flex; justify-content: space-between; padding: 34px 40px; color: #fff; background: #05616c; }
          .brand { font-weight: bold; font-size: 26px; letter-spacing: -1px; }.brand small { display: block; margin-top: 5px; font-size: 10px; letter-spacing: 2px; text-transform: uppercase; }
          .reference { text-align: right; font-size: 12px; line-height: 1.8; }.reference strong { display: block; font-size: 18px; }
          .content { padding: 32px 40px 40px; }.meta { display: grid; grid-template-columns: 1fr 1fr; gap: 22px; margin-bottom: 30px; }.label { margin-bottom: 6px; color: #627d98; font-size: 10px; font-weight: bold; letter-spacing: 1px; text-transform: uppercase; }.meta p { margin: 0; line-height: 1.6; }
          .consumption { display: flex; gap: 15px; margin-bottom: 26px; padding: 16px; border-left: 4px solid #f6ae2d; background: #fff8e9; }.consumption b { color: #05616c; font-size: 22px; }.consumption span { color: #486581; font-size: 12px; }
          table { width: 100%; border-collapse: collapse; font-size: 13px; } th { padding: 10px; color: #627d98; border-bottom: 1px solid #d9e2ec; text-align: left; font-size: 10px; letter-spacing: 1px; text-transform: uppercase; } td { padding: 11px 10px; border-bottom: 1px solid #edf2f7; } td:last-child, th:last-child { text-align: right; }
          .totals { width: 310px; margin: 26px 0 0 auto; }.total-line { display: flex; justify-content: space-between; padding: 7px 0; font-size: 13px; }.grand-total { margin-top: 7px; padding-top: 13px; border-top: 2px solid #05616c; color: #05616c; font-size: 18px; font-weight: bold; }.note { margin-top: 35px; padding-top: 16px; border-top: 1px solid #d9e2ec; color: #627d98; font-size: 11px; line-height: 1.6; }
        </style>
      </head>
      <body>
        <article class="invoice">
          <header>
            <div class="brand">SEEG<small>Facture de démonstration</small></div>
            <div class="reference"><strong><xsl:value-of select="reference"/></strong><span>Période : <xsl:value-of select="periode"/></span></div>
          </header>
          <main class="content">
            <section class="meta">
              <div><div class="label">Client</div><p><strong><xsl:value-of select="client/nom"/></strong><br/><xsl:value-of select="client/adresse"/></p></div>
              <div><div class="label">Contrat</div><p>Client : <xsl:value-of select="client/id"/><br/>Tarif : <xsl:value-of select="client/tarif"/><br/>Mode : <xsl:value-of select="client/mode_facturation"/></p></div>
            </section>
            <section class="consumption"><div><b><xsl:value-of select="consommation/volume"/> kWh</b><br/><span>Consommation de la période</span></div><div><b><xsl:value-of select="consommation/index_debut"/> → <xsl:value-of select="consommation/index_fin"/></b><br/><span>Index compteur</span></div></section>
            <table>
              <thead><tr><th>Détail de consommation</th><th>Volume</th><th>Prix unitaire</th><th>Montant</th></tr></thead>
              <tbody>
                <xsl:for-each select="tranches/tranche"><tr><td><xsl:value-of select="libelle"/></td><td><xsl:value-of select="volume"/> kWh</td><td><xsl:value-of select="prix_unitaire"/> FCFA</td><td><xsl:value-of select="format-number(montant, '# ##0', 'fcfa')"/> FCFA</td></tr></xsl:for-each>
                <tr><td>Frais de service</td><td>-</td><td>-</td><td><xsl:value-of select="format-number(totaux/frais_service, '# ##0', 'fcfa')"/> FCFA</td></tr>
              </tbody>
            </table>
            <section class="totals">
              <div class="total-line"><span>Total hors taxes</span><strong><xsl:value-of select="format-number(totaux/ht, '# ##0', 'fcfa')"/> FCFA</strong></div>
              <div class="total-line"><span>TVA (<xsl:value-of select="totaux/taux_tva"/> %)</span><strong><xsl:value-of select="format-number(totaux/tva, '# ##0', 'fcfa')"/> FCFA</strong></div>
              <div class="total-line"><span>Contribution ordures (<xsl:value-of select="totaux/taux_om"/> %)</span><strong><xsl:value-of select="format-number(totaux/om, '# ##0', 'fcfa')"/> FCFA</strong></div>
              <div class="total-line grand-total"><span>Total TTC</span><span><xsl:value-of select="format-number(totaux/ttc, '# ##0', 'fcfa')"/> FCFA</span></div>
            </section>
            <p class="note"></p>
          </main>
        </article>
      </body>
    </html>
  </xsl:template>
</xsl:stylesheet>
