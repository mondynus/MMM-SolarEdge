# MMM-SolarEdge

Jednoduchý modul pre MagicMirror² (kompatibilný s v2.29.0+), ktorý zobrazuje dnešnú vyrobenú energiu a aktuálny výkon zo SolarEdge Monitoring API.

## Inštalácia

Skopíruj tento priečinok do `MagicMirror/modules/MMM-SolarEdge` a pridaj do `config/config.js`:

```js
{
  module: "MMM-SolarEdge",
  position: "top_right",
  config: {
    title: "Moja FVE",
    apiKey: "TVOJ_SOLAREDGE_API_KEY",
    siteId: "TVOJE_SITE_ID",
    updateInterval: 5 * 60 * 1000
  }
}
```

`apiKey` vytvoríš v SolarEdge Monitoring portáli v časti **Admin > API Access**. `siteId` nájdeš v URL alebo v detailoch elektrárne. `title` ti umožňuje nastaviť vlastný nadpis modulu (napr. `"Moja FVE"`). Ak chceš použiť názov elektrárne zo SolarEdge API, nastav `showSiteName: true`.

## Poznámky

- Kompatibilný s **MagicMirror² v2.29.0** a Node.js 18+.
- Hodnota **Dnes** je v kWh.
- Hodnota **Teraz** je vo wattoch.
- SolarEdge API má limity požiadaviek, preto modul aktualizuje dáta najskôr každú minútu (odporúčané 5 minút).
- API kľúč ostáva v `node_helper.js` na serverovej strane a neposiela sa do DOM.