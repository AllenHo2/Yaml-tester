// src/scripts/test-cli-spinup.ts
// This file tests the CLI spinup deployment script

import { spawn } from "child_process";

const DRY_RUN = process.argv.includes("--dry-run");
const ENVIRONMENT = process.argv[2]?.replace("--dry-run", "").trim() ?? "preview";

console.log(`
╔═══════════════════════════════════════════════════╗
║       Testing T3 App Deployment CLI              ║
╚═══════════════════════════════════════════════════╝
`);

console.log(`📋 Test Configuration:`);
console.log(`   Mode: ${DRY_RUN ? "🧪 DRY RUN (simulation)" : "🚀 REAL DEPLOYMENT"}`);
console.log(`   Environment: ${ENVIRONMENT}`);
console.log(`   Working Directory: ${process.cwd()}`);
console.log(``);

// Check environment variables
console.log("🔍 Environment Variables Check:");
const hasApiToken = !!process.env.CLOUDFLARE_API_TOKEN;
const hasAccountId = !!process.env.CLOUDFLARE_ACCOUNT_ID;

console.log(`   CLOUDFLARE_API_TOKEN: ${hasApiToken ? "✅ Set" : "❌ Not set"}`);
console.log(`   CLOUDFLARE_ACCOUNT_ID: ${hasAccountId ? "✅ Set" : "❌ Not set"}`);
console.log(``);

if (!hasApiToken || !hasAccountId) {
  console.log("⚠️  Warning: Cloudflare credentials not set!");
  console.log("   Set them with:");
  console.log("   export CLOUDFLARE_API_TOKEN='your-token'");
  console.log("   export CLOUDFLARE_ACCOUNT_ID='your-account-id'");
  console.log(``);
}

if (DRY_RUN) {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("🧪 DRY RUN MODE - Simulating commands");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(``);
  
  console.log("📦 Step 1: Would run: npm ci");
  console.log("   → Installs dependencies from package-lock.json");
  console.log(``);
  
  console.log("🔨 Step 2: Would run: npm run build");
  console.log("   → Builds Next.js app with @opennextjs/cloudflare");
  console.log("   → Creates .open-next/ directory with deployment artifacts");
  console.log(``);
  
  console.log(`☁️  Step 3: Would run: npx wrangler deploy --env=${ENVIRONMENT}`);
  console.log("   → Deploys to Cloudflare Workers");
  console.log("   → Uses wrangler.toml configuration");
  console.log(``);
  
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("✅ Dry run completed - no actual commands executed");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(``);
  console.log("To run for real, execute without --dry-run flag:");
  console.log(`   npx tsx src/scripts/test-cli-spinup.ts ${ENVIRONMENT}`);
  console.log("Or directly run the CLI:");
  console.log(`   npx tsx src/scripts/cli-spinup.ts . ${ENVIRONMENT}`);
  console.log(``);
  process.exit(0);
}

// Real execution
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(" REAL DEPLOYMENT MODE");
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
console.log(``);

// Countdown before starting
console.log("⏱️  Starting in:");
for (let i = 3; i > 0; i--) {
  console.log(`   ${i}...`);
  // Simple blocking delay
  const start = Date.now();
  while (Date.now() - start < 1000) {
    // Wait
  }
}
console.log("   🚀 GO!");
console.log(``);

// Run the actual CLI script
const child = spawn(
  "npx",
  ["tsx", "src/scripts/cli-spinup.ts", ".", ENVIRONMENT],
  {
    stdio: "inherit",
    env: process.env,
    cwd: process.cwd(),
  }
);

child.on("error", (err) => {
  console.error("❌ Error running deployment:", err);
  process.exit(1);
});

child.on("close", (code) => {
  if (code === 0) {
    console.log(``);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Test completed successfully!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log(``);
  } else {
    console.error(``);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`❌ Test failed with exit code ${code}`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(``);
    process.exit(code ?? 1);
  }
});
