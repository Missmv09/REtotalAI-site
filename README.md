# REtotalAI

Modular AI tool suite for real estate professionals.

## Features
- AI-powered listing generator to craft compelling property descriptions.
- Deal analyzer for evaluating investment opportunities.
- Lightweight modular design for adding future tools.
- Static site architecture ready for rapid deployment.

## Folder Structure
```
/ (root)
├── index.html                 # Landing page
└── tools/
    ├── deal-analyzer/
    │   └── index.html         # Deal analysis tool
    └── listing-generator/
        └── index.html         # Listing generator tool
```

## Deployment
The project is a fully static site that can be deployed on Netlify.
1. Connect the repository to Netlify.
2. Set the build command to `none` or leave empty.
3. Set the publish directory to the repository root (`/`).
4. Configure any required environment variables in the Netlify dashboard.

### Cloud Deployment (Vercel + Render)
1. In your Vercel project, set `NEXT_PUBLIC_API_URL=https://retotalai-site.onrender.com`.
2. Deploy the site on Vercel.
3. After the Vercel deploy finishes, add the deployed Vercel URL to the CORS `origin` array in `server/index.js` and commit the change to trigger a Render redeploy.

## Roadmap
- User authentication and profiles.
- Centralized dashboard for managing tools and data.
- Stripe integration for billing and subscriptions.
- Expand into a full SaaS offering with additional real estate AI services.

## Development

Run static analysis before committing changes:

```
npm run lint       # ESLint for code quality
npm run type-check # TypeScript type checking
```
