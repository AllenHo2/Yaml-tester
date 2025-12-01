// src/scripts/cli-spinup.ts
import { spawn } from "child_process";
import path from "path";
import { EventEmitter } from "events";
import fs from "fs/promises";

// Event types
export type DeploymentEvent =
  | { type: "start"; data: { repoPath: string; environment: string } }
  | { type: "install:start" }
  | { type: "install:complete" }
  | { type: "install:error"; error: Error }
  | { type: "build:start" }
  | { type: "build:complete" }
  | { type: "build:error"; error: Error }
  | { type: "inject:start"; data: { framework: string; platform: string } }
  | { type: "inject:complete"; data: { filesInjected: string[] } }
  | { type: "inject:error"; error: Error }
  | { type: "deploy:start" }
  | { type: "deploy:complete"; data?: { url?: string } }
  | { type: "deploy:error"; error: Error }
  | { type: "complete"; data: { duration: number } }
  | { type: "error"; error: Error };

export class DeploymentEventEmitter extends EventEmitter {
  dispatch(event: DeploymentEvent): void {
    console.log(`📡 Event: ${event.type}`, event);
    this.emit("deployment", event);
    this.emit(event.type, event);
  }
}

// Injection configuration type
type InjectionConfig = {
  framework: string;
  platform: string;
  files: Array<{
    source: string;      // Path to template file
    destination: string; // Where to place it in the repo
  }>;
};

// Define injection configurations
const INJECTION_CONFIGS: Record<string, InjectionConfig> = {
  "nextjs-cloudflare": {
    framework: "nextjs",
    platform: "cloudflare",
    files: [
      {
        source: "templates/sst.config.ts",
        destination: "sst.config.ts",
      },
      {
        source: "templates/wrangler.toml",
        destination: "wrangler.toml",
      },
    ],
  },
};

async function injectFiles(
  repoPath: string,
  framework: string,
  platform: string,
  eventEmitter?: DeploymentEventEmitter
): Promise<void> {
  const configKey = `${framework}-${platform}`;
  const config = INJECTION_CONFIGS[configKey];

  if (!config) {
    throw new Error(
      `No injection configuration found for ${framework} on ${platform}. Available: ${Object.keys(INJECTION_CONFIGS).join(", ")}`
    );
  }

  eventEmitter?.dispatch({
    type: "inject:start",
    data: { framework, platform },
  });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`💉 Injecting files for ${framework} on ${platform}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  const injectedFiles: string[] = [];

  try {
    for (const file of config.files) {
      const sourcePath = path.resolve(__dirname, "..", file.source);
      const destPath = path.resolve(repoPath, file.destination);

      console.log(`📝 Injecting: ${file.destination}`);

      // Read template file
      const content = await fs.readFile(sourcePath, "utf-8");


      // Ensure destination directory exists
      await fs.mkdir(path.dirname(destPath), { recursive: true });

      // Write file
      await fs.writeFile(destPath, content, "utf-8");
      injectedFiles.push(file.destination);

      console.log(`   ✓ Created ${file.destination}`);
    }

    eventEmitter?.dispatch({
      type: "inject:complete",
      data: { filesInjected: injectedFiles },
    });

    console.log(`\n✅ Successfully injected ${injectedFiles.length} file(s)\n`);
  } catch (error) {
    eventEmitter?.dispatch({ type: "inject:error", error: error as Error });
    throw error;
  }
}

async function runCommandSafe(
  command: string,
  args: string[],
  options?: {
    cwd?: string;
    env?: Record<string, string>;
  }
): Promise<void> {
  return new Promise((resolve, reject) => {
    console.log(`\n Running: ${command} ${args.join(" ")}`);
    
    const child = spawn(command, args, {
      stdio: "inherit",
      cwd: options?.cwd ? path.resolve(options.cwd) : undefined,
      // Merge process.env with custom env, allowing custom env to override
      env: { ...process.env, ...options?.env },
      shell: false,
    });

    child.on("error", (err) => reject(err));
    child.on("close", (code) =>
      code === 0
        ? resolve()
        : reject(new Error(`${command} exited with ${code}`))
    );
  });
}

async function deployT3App(
  repoPath: string,
  environment = "preview",
  framework = "t3",
  platform = "cloudflare",
  eventEmitter?: DeploymentEventEmitter
): Promise<void> {
  const startTime = Date.now();
  
  try {
    eventEmitter?.dispatch({
      type: "start",
      data: { repoPath: path.resolve(repoPath), environment },
    });

    console.log("🚀 Starting T3 App Deployment");
    console.log(`📁 Working directory: ${path.resolve(repoPath)}`);
    console.log(`🌍 Environment: ${environment}`);
    console.log(`🏗️  Framework: ${framework}`);
    console.log(`☁️  Platform: ${platform}\n`);

    // Get commands from environment variables with defaults
    const packageManager = process.env.PACKAGE_MANAGER ?? "npm";
    const installCommand = process.env.INSTALL_COMMAND ?? "ci";
    const buildCommand = process.env.BUILD_COMMAND ?? "run";
    const buildScript = process.env.BUILD_SCRIPT ?? "build";
    const deployCommand = process.env.DEPLOY_COMMAND ?? "npx";
    const deployTool = process.env.DEPLOY_TOOL ?? "wrangler";
    const deployAction = process.env.DEPLOY_ACTION ?? "deploy";

    // Step 1: Install dependencies
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📦 Step 1: Installing dependencies");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
      eventEmitter?.dispatch({ type: "install:start" });
      await runCommandSafe(packageManager, [installCommand], { cwd: repoPath });
      eventEmitter?.dispatch({ type: "install:complete" });
    } catch (error) {
      eventEmitter?.dispatch({ type: "install:error", error: error as Error });
      throw error;
    }

    // Step 2: Build project
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔨 Step 2: Building project");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
      eventEmitter?.dispatch({ type: "build:start" });
      await runCommandSafe(packageManager, [buildCommand, buildScript], { cwd: repoPath });
      eventEmitter?.dispatch({ type: "build:complete" });
    } catch (error) {
      eventEmitter?.dispatch({ type: "build:error", error: error as Error });
      throw error;
    }

    // Step 3: Inject configuration files
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("💉 Step 3: Injecting configuration files");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
      await injectFiles(
        repoPath,
        framework,
        platform,
        eventEmitter
      );
    } catch (error) {
      eventEmitter?.dispatch({ type: "inject:error", error: error as Error });
      throw error;
    }

    // Step 4: Deploy to Cloudflare Workers
    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🚢 Step 4: Deploying to Cloudflare Workers");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    // Check for required environment variables
    if (!process.env.CLOUDFLARE_API_TOKEN) {
      console.warn("⚠️  Warning: CLOUDFLARE_API_TOKEN not set");
    }
    if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
      console.warn("⚠️  Warning: CLOUDFLARE_ACCOUNT_ID not set");
    }

    try {
      eventEmitter?.dispatch({ type: "deploy:start" });
      await runCommandSafe(deployCommand, [deployTool, deployAction, `--env=${environment}`], {
        cwd: repoPath,
      });
      eventEmitter?.dispatch({ type: "deploy:complete", data: {} });
    } catch (error) {
      eventEmitter?.dispatch({ type: "deploy:error", error: error as Error });
      throw error;
    }

    const duration = Date.now() - startTime;
    eventEmitter?.dispatch({ type: "complete", data: { duration } });

    console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("✅ Deployment completed successfully!");
    console.log(`⏱️  Duration: ${(duration / 1000).toFixed(2)}s`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
  } catch (error) {
    eventEmitter?.dispatch({ type: "error", error: error as Error });
    console.error("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error("❌ Deployment failed:", error);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    throw error;
  }
}

// CLI execution
const targetRepoPath = process.argv[2] ?? "./";
const environment = process.argv[3] ?? "preview";
const framework = process.argv[4] ?? "t3";
const platform = process.argv[5] ?? "cloudflare";

console.log(`
╔═══════════════════════════════════════════════════╗
║       T3 App Cloudflare Deployment CLI           ║
╚═══════════════════════════════════════════════════╝
`);

// Create event emitter and set up listeners
const eventEmitter = new DeploymentEventEmitter();

// Example: Listen to all events
eventEmitter.on("deployment", (event: DeploymentEvent) => {
  // You can send these events to a webhook, logging service, etc.
  // For example: await fetch('https://your-webhook-url.com', { method: 'POST', body: JSON.stringify(event) });
});

deployT3App(targetRepoPath, environment, framework, platform, eventEmitter).catch((_error) => {
  process.exit(1);
});

