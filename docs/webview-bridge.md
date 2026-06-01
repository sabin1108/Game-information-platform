# Webview bridge contract

Mobile webview mode is enabled with `?webview=1`. The client stores that mode in `localStorage` and marks the root element with `data-webview-mode="true"` so safe-area spacing and bottom tabs use the mobile viewport.

## Store open event

Store links keep their normal `href`. If no native bridge exists, the browser follows the link as a normal anchor.

When a bridge exists, the click is intercepted and this JSON message is sent through `window.ReactNativeWebView.postMessage(message)` or `window.GameDealWatchBridge.postMessage(message)`:

```json
{
  "type": "gdw.store.open",
  "payload": {
    "gameId": "elden-ring",
    "gameTitle": "ELDEN RING",
    "store": "steam",
    "storeName": "Steam",
    "url": "https://store.steampowered.com/app/1245620",
    "source": "store-price"
  }
}
```

`window.GameDealWatchBridge.openStore(payload)` is also supported. The same event is dispatched in the browser as `gdw.store.open` with the full event in `event.detail`, which lets tests and debug tooling inspect the payload.

Fields:

- `type`: always `gdw.store.open`
- `payload.gameId`: app game id
- `payload.gameTitle`: display title
- `payload.store`: `steam`, `epic`, or `itad`
- `payload.storeName`: display store name
- `payload.url`: external store URL
- `payload.source`: `store-price` for a row link, `game-card` for the primary store button
