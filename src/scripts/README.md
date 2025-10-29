# CLI Spinup - T3 App Deployment Tool

This CLI tool automatically deploys your T3 app to Cloudflare Workers, mimicking the exact steps from your GitHub Actions `deploy.yml` workflow.

## What It Does

The CLI performs the following steps in order:

1. **Install Dependencies** - Runs `npm ci` to install all dependencies
2. **Build Project** - Runs `npm run build` which uses `@opennextjs/cloudflare` to build your Next.js app
3. **Deploy to Cloudflare** - Uses `wrangler deploy` to push your app to Cloudflare Workers

## Prerequisites

Before running the deployment, ensure you have:

1. **Cloudflare API Token** - Set the `CLOUDFLARE_API_TOKEN` environment variable
2. **Cloudflare Account ID** - Set the `CLOUDFLARE_ACCOUNT_ID` environment variable

You can get these from your [Cloudflare Dashboard](https://dash.cloudflare.com/).

## Usage

### Option 1: Using npm scripts (Recommended)

Add these scripts to your `package.json`:

```json
{
  "scripts": {
    "cli-deploy": "tsx src/scripts/cli-spinup.ts",
    "cli-deploy:prod": "tsx src/scripts/cli-spinup.ts . production"
  }
}
```

Then run:

```bash
# Deploy to preview environment
npm run cli-deploy

# Deploy to production environment
npm run cli-deploy:prod
```

### Option 2: Direct execution

```bash
# Deploy to preview (default)
npx tsx src/scripts/cli-spinup.ts

# Deploy to a specific directory and environment
npx tsx src/scripts/cli-spinup.ts /path/to/project production
```

## Environment Variables

Set these before running the deployment:

```bash
export CLOUDFLARE_API_TOKEN="your-api-token"
export CLOUDFLARE_ACCOUNT_ID="your-account-id"
```

Or create a `.env.local` file (make sure it's in `.gitignore`):

```env
CLOUDFLARE_API_TOKEN=your-api-token
CLOUDFLARE_ACCOUNT_ID=your-account-id
```

## Arguments

```bash
tsx src/scripts/cli-spinup.ts [repo-path] [environment]
```

- `repo-path` - Path to your project (default: `./`)
- `environment` - Target environment: `preview` or `production` (default: `preview`)

## Examples

```bash
# Deploy current directory to preview
npx tsx src/scripts/cli-spinup.ts

# Deploy to production
npx tsx src/scripts/cli-spinup.ts . production

# Deploy a different project
npx tsx src/scripts/cli-spinup.ts ../my-other-project preview
```

## Comparison with GitHub Actions

This CLI tool replicates the exact workflow from `.github/workflows/deploy.yml`:

| GitHub Actions Step | CLI Equivalent |
|---------------------|----------------|
| `npm ci` | ✅ Step 1: Install dependencies |
| `npm run build` | ✅ Step 2: Build project |
| `npx wrangler deploy --env=$ENV` | ✅ Step 3: Deploy to Cloudflare |

## Troubleshooting

### "CLOUDFLARE_API_TOKEN not set"

Make sure you've exported the environment variable:

```bash
export CLOUDFLARE_API_TOKEN="your-token"
```

### Build fails

Ensure all dependencies are correctly installed:

```bash
npm ci
```

### Deployment fails

1. Check that your wrangler.toml is configured correctly
2. Verify your Cloudflare credentials are valid
3. Ensure you have the correct permissions in your Cloudflare account

## Output

The CLI provides detailed output for each step:

```
╔═══════════════════════════════════════════════════╗
║       T3 App Cloudflare Deployment CLI           ║
╚═══════════════════════════════════════════════════╝

🚀 Starting T3 App Deployment
📍 Working directory: /Users/you/yaml-tester/yaml-tester
🌍 Environment: preview

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📦 Step 1: Installing dependencies
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[npm output...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🔨 Step 2: Building project
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[build output...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
☁️  Step 3: Deploying to Cloudflare Workers
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
[wrangler output...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Deployment completed successfully!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```
