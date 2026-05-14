---
name: mock-api
description: Start the local mock image API server and guide testing of failure scenarios. Use when testing API error handling, CORS issues, or response parsing edge cases.
disable-model-invocation: false
---

# Mock Image API

Start the server with:
```
npm run mock:api
```

Default port: `http://127.0.0.1:8787`. Override with env var: `MOCK_IMAGE_API_PORT=8788 npm run mock:api`

## App Setup

In Settings, create an OpenAI-compatible API profile:
- Base URL: one of the mode URLs below (e.g. `http://127.0.0.1:8787/url-cors-block`)
- API Key: any non-empty string (e.g. `mock`)
- API mode: `Images API`
- Model: any value (e.g. `mock`)

The server reads `n` from the request body and returns up to 10 results.

## Available Failure Modes

| URL path | What it tests |
|----------|--------------|
| `/url-cors-block` | API succeeds, but image URLs have no CORS headers — download fails in browser |
| `/url-ok` | API succeeds, image URL has CORS headers — should work end-to-end |
| `/b64` | API returns `b64_json` directly — should work end-to-end |
| `/wrong-shape` | Non-OpenAI JSON shape (`data.url` instead of `data[]`) — should show raw response viewer |
| `/no-recognizable` | Returns `data[]` but no `url` or `b64_json` — should show raw response viewer |
| `/empty` | Empty `data[]` — should show raw response viewer |
| `/url-404` | Image URL returns HTTP 404 |
| `/url-redirect-cors-block` | Redirect URL, final image has no CORS headers |
| `/http-error` | API returns HTTP 500 with error message |
| `/invalid-json` | API returns malformed JSON |
| `/slow` | Delayed response — lower timeout in settings to test timeout handling |
| `/api-no-cors` | API itself has no CORS headers — request fails at browser level |

## Custom Provider Testing

Import this provider config in Settings to test non-OpenAI response structures:

```json
{
  "id": "mock-failure-api",
  "name": "本地故障模拟",
  "template": "http-image",
  "submit": {
    "path": "custom/random-image",
    "method": "POST",
    "contentType": "json",
    "body": {
      "model": "$profile.model",
      "prompt": "$prompt",
      "size": "$params.size",
      "quality": "$params.quality",
      "output_format": "$params.output_format",
      "n": "$params.n"
    },
    "result": {
      "imageUrlPaths": ["data.url", "data.images.*.url"],
      "b64JsonPaths": []
    }
  }
}
```

After importing, set Base URL to `http://127.0.0.1:8787` and use model name `mock:url-cors-block`, `mock:url-ok`, `mock:no-recognizable`, or `mock:http-error`.
