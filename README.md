Welcome to your new TanStack app!

# Getting Started

To run this application:

```bash
pnpm install
pnpm dev
```

# Building For Production

To build this application for production:

```bash
pnpm build
```

## Contact form protection

The contact form (`src/server/contact/`) runs every submission through an Effect pipeline; cheap local checks run first:

1. **Schema** (`schema.ts`) – zod validation; CR/LF rejected in name/email/phone, control/zero-width/bidi characters stripped, header-safe subject.
2. **Honeypot** – hidden `subject` field, ignored by password managers.
3. **Signed form token** (`formToken.ts`) – `issueFormToken` returns `issuedAt.nonce.HMAC`; accepted only 3 s – 2 h after issue, measured on the server clock. Payloads without tokens are direct POSTs.
4. **Content classifier** (`checks.ts`) – mixed-case gibberish, dot-stuffed Gmail, long tokens, >2 URLs, SEO/backlink and scam phrases (EN + CS), mostly non-Latin text, URLs in the name.
5. **Rate limit** (`rateLimit.ts`) – 3/h per IP, 2/day per normalized email. Upstash Redis when configured, otherwise in-memory (per serverless instance only).
6. **Vercel BotID** (`botId.ts`) – only on Vercel; fails open on errors.
7. **Turnstile** (`turnstile.ts`) – strict siteverify: `remoteip`, `idempotency_key`, `action === "contact"`, hostname allowlist, `challenge_ts` < 300 s, `cdata` = form token nonce.
8. **Email domain** (`emailDomain.ts`) – disposable-domain list + MX lookup (2 s timeout, fails open).
9. **Send** via Resend (idempotency key = nonce) or, with `CONTACT_DRY_RUN=true`, a redacted log line.

Bot and spam verdicts (2, 3, 4, 6, 8) get a fake `success` and one `contact_form` JSON log line (`outcome`, `reason`, `ip`, `hostname`, hashed email); message bodies and addresses are never logged.

### Environment

| Variable                                              | Purpose                                                                                                                               |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `VITE_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET_KEY`    | Turnstile keys. Locally use the test keys `1x00000000000000000000AA` / `1x0000000000000000000000000000000AA` (refused in production). |
| `FORM_TOKEN_SECRET`                                   | HMAC secret for form tokens (`openssl rand -hex 32`). Required.                                                                       |
| `CONTACT_ALLOWED_HOSTNAMES`                           | Hostnames Turnstile may report. Default `jandrly.cz,www.jandrly.cz` (+ `localhost` outside production).                               |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Optional shared rate limiting.                                                                                                        |
| `CONTACT_DRY_RUN`                                     | `true` logs instead of sending. Local testing only.                                                                                   |
| `RESEND_SEND` / `RESEND_FROM` / `RESEND_TO`           | Resend API key, sender, recipient.                                                                                                    |

Copy `.env.example` to `.env` for local development. Set the same variables in Vercel and redeploy so Vite embeds the public sitekey. Never expose secrets through a `VITE_` variable.

### Dashboard steps

Step-by-step setup for every external service (all on free plans) is in [docs/production-setup.md](docs/production-setup.md). In short:

- **Cloudflare Turnstile**: hostnames `jandrly.cz` and `www.jandrly.cz` only, no `localhost` (local dev uses the test keys).
- **Vercel Firewall**: one rate-limit rule for `POST` requests whose path starts with `/_serverFn/` (10 requests / 10 min per IP, action: deny).
- **Vercel BotID**: runs in free Basic mode from the code; nothing to enable. Don't turn on Deep Analysis (paid). The challenge proxy rewrites are generated from the `routeRules` in `vite.config.ts`.
- **Upstash** (optional): create a Redis database and add its REST URL/token to Vercel.

### Form spam or inbox spam?

Every form message is sent by Resend from `RESEND_FROM` with the subject _"New portfolio contact request from …"_. If a spam email shows up in the Resend log (Emails), it came through the form – check the matching `contact_form` log line in Vercel. If it is not in the Resend log, it was sent straight to the inbox; the address is no longer in the page HTML or JSON-LD, but older scraped copies will keep receiving spam.

## Testing

This project uses [Vitest](https://vitest.dev/) for testing. You can run the tests with:

```bash
pnpm test
```

## Styling

This project uses [Tailwind CSS](https://tailwindcss.com/) for styling.

## Linting & Formatting

This project uses [eslint](https://eslint.org/) and [prettier](https://prettier.io/) for linting and formatting. Eslint is configured using [tanstack/eslint-config](https://tanstack.com/config/latest/docs/eslint). The following scripts are available:

```bash
pnpm lint
pnpm format
pnpm check
```

## Routing

This project uses [TanStack Router](https://tanstack.com/router). The initial setup is a file based router. Which means that the routes are managed as files in `src/routes`.

### Adding A Route

To add a new route to your application just add another a new file in the `./src/routes` directory.

TanStack will automatically generate the content of the route file for you.

Now that you have two routes you can use a `Link` component to navigate between them.

### Adding Links

To use SPA (Single Page Application) navigation you will need to import the `Link` component from `@tanstack/react-router`.

```tsx
import { Link } from '@tanstack/react-router'
```

Then anywhere in your JSX you can use it like so:

```tsx
<Link to="/about">About</Link>
```

This will create a link that will navigate to the `/about` route.

More information on the `Link` component can be found in the [Link documentation](https://tanstack.com/router/v1/docs/framework/react/api/router/linkComponent).

### Using A Layout

In the File Based Routing setup the layout is located in `src/routes/__root.tsx`. Anything you add to the root route will appear in all the routes. The route content will appear in the JSX where you use the `<Outlet />` component.

Here is an example layout that includes a header:

```tsx
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'

import { Link } from '@tanstack/react-router'

export const Route = createRootRoute({
    component: () => (
        <>
            <header>
                <nav>
                    <Link to="/">Home</Link>
                    <Link to="/about">About</Link>
                </nav>
            </header>
            <Outlet />
            <TanStackRouterDevtools />
        </>
    ),
})
```

The `<TanStackRouterDevtools />` component is not required so you can remove it if you don't want it in your layout.

More information on layouts can be found in the [Layouts documentation](https://tanstack.com/router/latest/docs/framework/react/guide/routing-concepts#layouts).

## Data Fetching

There are multiple ways to fetch data in your application. You can use TanStack Query to fetch data from a server. But you can also use the `loader` functionality built into TanStack Router to load the data for a route before it's rendered.

For example:

```tsx
const peopleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: '/people',
    loader: async () => {
        const response = await fetch('https://swapi.dev/api/people')
        return response.json() as Promise<{
            results: {
                name: string
            }[]
        }>
    },
    component: () => {
        const data = peopleRoute.useLoaderData()
        return (
            <ul>
                {data.results.map((person) => (
                    <li key={person.name}>{person.name}</li>
                ))}
            </ul>
        )
    },
})
```

Loaders simplify your data fetching logic dramatically. Check out more information in the [Loader documentation](https://tanstack.com/router/latest/docs/framework/react/guide/data-loading#loader-parameters).

### React-Query

React-Query is an excellent addition or alternative to route loading and integrating it into you application is a breeze.

First add your dependencies:

```bash
pnpm add @tanstack/react-query @tanstack/react-query-devtools
```

Next we'll need to create a query client and provider. We recommend putting those in `main.tsx`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

// ...

const queryClient = new QueryClient()

// ...

if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement)

    root.render(
        <QueryClientProvider client={queryClient}>
            <RouterProvider router={router} />
        </QueryClientProvider>,
    )
}
```

You can also add TanStack Query Devtools to the root route (optional).

```tsx
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

const rootRoute = createRootRoute({
    component: () => (
        <>
            <Outlet />
            <ReactQueryDevtools buttonPosition="top-right" />
            <TanStackRouterDevtools />
        </>
    ),
})
```

Now you can use `useQuery` to fetch your data.

```tsx
import { useQuery } from '@tanstack/react-query'

import './App.css'

function App() {
    const { data } = useQuery({
        queryKey: ['people'],
        queryFn: () =>
            fetch('https://swapi.dev/api/people')
                .then((res) => res.json())
                .then((data) => data.results as { name: string }[]),
        initialData: [],
    })

    return (
        <div>
            <ul>
                {data.map((person) => (
                    <li key={person.name}>{person.name}</li>
                ))}
            </ul>
        </div>
    )
}

export default App
```

You can find out everything you need to know on how to use React-Query in the [React-Query documentation](https://tanstack.com/query/latest/docs/framework/react/overview).

## State Management

Another common requirement for React applications is state management. There are many options for state management in React. TanStack Store provides a great starting point for your project.

First you need to add TanStack Store as a dependency:

```bash
pnpm add @tanstack/store
```

Now let's create a simple counter in the `src/App.tsx` file as a demonstration.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

function App() {
    const count = useStore(countStore)
    return (
        <div>
            <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
        </div>
    )
}

export default App
```

One of the many nice features of TanStack Store is the ability to derive state from other state. That derived state will update when the base state updates.

Let's check this out by doubling the count using derived state.

```tsx
import { useStore } from '@tanstack/react-store'
import { Store, Derived } from '@tanstack/store'
import './App.css'

const countStore = new Store(0)

const doubledStore = new Derived({
    fn: () => countStore.state * 2,
    deps: [countStore],
})
doubledStore.mount()

function App() {
    const count = useStore(countStore)
    const doubledCount = useStore(doubledStore)

    return (
        <div>
            <button onClick={() => countStore.setState((n) => n + 1)}>Increment - {count}</button>
            <div>Doubled - {doubledCount}</div>
        </div>
    )
}

export default App
```

We use the `Derived` class to create a new store that is derived from another store. The `Derived` class has a `mount` method that will start the derived store updating.

Once we've created the derived store we can use it in the `App` component just like we would any other store using the `useStore` hook.

You can find out everything you need to know on how to use TanStack Store in the [TanStack Store documentation](https://tanstack.com/store/latest).

# Demo files

Files prefixed with `demo` can be safely deleted. They are there to provide a starting point for you to play around with the features you've installed.

# Learn More

You can learn more about all of the offerings from TanStack in the [TanStack documentation](https://tanstack.com).
