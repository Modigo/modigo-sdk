# @modigo/sdk

Vanilla JS/TypeScript SDK for embedding the Modigo sandboxed code editor into any website. Works in any framework — or no framework at all.

## Install

```bash
npm install @modigo/sdk
# or
yarn add @modigo/sdk
```

Or load directly from CDN:

```html
<script src="https://cdn.modigo.online/sdk/v1/modigo.js"></script>
```

## Get an API Key

Sign up at [modigo.online](https://modigo.online) → Settings → API Keys → New Key.

## Usage: Standalone Editor

```ts
import { init } from '@modigo/sdk';

const editor = await init({
  apiKey:      'mk_live_your_key',
  container:   '#editor',          // CSS selector or HTMLElement
  language:    'python',
  instruction: 'Write a function that returns the nth Fibonacci number.',
  starterCode: 'def fibonacci(n):\n    pass',
  onReady:     () => console.log('Editor ready'),
  onSubmit:    (result) => {
    console.log(result.status);   // 'Accepted' | 'Test Failed' | 'Runtime Error'
    console.log(result.stdout);
  },
});

// Later: clean up
editor.destroy();
```

## Usage: Group Challenge Session

First, create a session via the API:

```bash
curl -X POST https://api.modigo.online/api/v1/sessions \
  -H 'Authorization: Bearer mk_live_your_key' \
  -H 'Content-Type: application/json' \
  -d '{ "challenge_id": 7, "duration_minutes": 45 }'
# → { "id": 42, "code": "ABC123", ... }
```

Then embed for each participant:

```ts
import { init } from '@modigo/sdk';

const editor = await init({
  apiKey:    'mk_live_your_key',
  container: '#editor',
  session: {
    id:            42,           // from POST /api/v1/sessions
    participantId: 'user_jane',  // your own user identifier
    displayName:   'Jane Doe',
  },
  onSubmit:    (result) => console.log('Submitted:', result.status),
  onSessionEnd:(results) => {
    // results: Array<{ rank, participantId, displayName, score, challengesSolved }>
    console.log('Final leaderboard:', results);
  },
  onError:     (err) => console.error(err.code, err.message),
});
```

## Configuration Reference

| Option | Type | Required | Description |
|--------|------|----------|-------------|
| `apiKey` | `string` | ✅ | Your API key (`mk_live_...`) |
| `container` | `string \| HTMLElement` | ✅ | CSS selector or DOM element |
| `language` | `string` | — | Language identifier (python, javascript, go, etc.) |
| `instruction` | `string` | — | Task description shown above the editor |
| `starterCode` | `string` | — | Pre-filled code |
| `session` | `ModigoSessionConfig` | — | Join a group challenge session |
| `height` | `string \| number` | — | iframe height (default: `600px`) |
| `width` | `string \| number` | — | iframe width (default: `100%`) |
| `onReady` | `() => void` | — | Fires when the editor iframe is ready |
| `onSubmit` | `(result) => void` | — | Fires when the user submits code |
| `onSessionEnd` | `(results) => void` | — | Fires when a group session ends |
| `onError` | `(error) => void` | — | Fires on auth failure, session expired, etc. |

## Supported Languages

`python` · `javascript` · `go` · `php` · `java` · `c` · `cpp` · `rust`

## Instance Methods

```ts
const editor = await init(config);

editor.destroy();          // Remove the iframe and clean up listeners
editor.send('type', {});   // Send a custom postMessage to the iframe
```

## TypeScript

Full type declarations are included. Import the interfaces directly:

```ts
import type { ModigoConfig, ModigoSubmitResult, ModigoSessionResult } from '@modigo/sdk';
```

## Links

- [Full interactive docs](https://modigo.online/docs/sdk)
- [API reference](https://modigo.online/docs/api)
- [React wrapper (@modigo/react)](https://www.npmjs.com/package/@modigo/react)
