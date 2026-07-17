# E2E Testing Guide - Learnimals

## Overview

This project uses Playwright Test for end-to-end testing with shared configuration from `@austinorphan/e2e-core`.

## Prerequisites

- Node.js 20.15.1 (see .nvmrc)
- npm or equivalent package manager
- Playwright browsers installed

## Installation

```bash
npm install
npx playwright install
```

## Running Tests

### Local Development

```bash
# Start dev server
npm run serve

# In another terminal, run E2E tests
npm run test:e2e
```

### Watch Mode (UI)

```bash
npm run test:e2e:ui
```

### Headed Mode (see browser)

```bash
npm run test:e2e:headed
```

### CI Mode

```bash
npm run test:e2e:ci
```

## Selector Strategy

Use `data-testid` attributes for reliable selectors:

```html
<button data-testid="submit-button">Submit</button>
```

```typescript
await page.getByTestId('submit-button').click();
```

## Test Organization

- `e2e/tests/smoke.spec.ts` - Basic smoke tests
- Add more test files in `e2e/tests/` as needed

## Environment Variables

- `BASE_URL`: Application base URL (default: <http://localhost:3000>)

## Browser Support

Tests run on:

- Chromium (desktop)
- Firefox (desktop)
- WebKit (desktop)
- Mobile Chrome (Pixel 5)
- Mobile Safari (iPhone 12)

## CI Integration

E2E tests run automatically on:

- Pull requests (reduced matrix: Chromium + Mobile Chrome)
- Push to main (full browser matrix)
- Nightly schedule (full matrix)

## Troubleshooting

### Tests timing out

Increase timeout in test:

```typescript
test('slow operation', async ({ page }) => {
  test.setTimeout(60000); // 60 seconds
  // ...
});
```

### Playwright not installed

```bash
npx playwright install
```

### Server not running

Ensure dev server is running on port 3000 before running tests.
