import path from "path";
import fs from "fs/promises";
import { fileURLToPath } from "url";
import { DeploymentEventEmitter, type DeploymentEvent } from "./cli-spinup";

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Injection configuration type
type InjectionConfig = {
  framework: string;
  platform: string;
  files: Array<{
    source: string;
    destination: string;
  }>;
};

// Define injection configurations
const INJECTION_CONFIGS: Record<string, InjectionConfig> = {
  "nextjs-cloudflare": {
    framework: "nextjs",
    platform: "cloudflare",
    files: [
      {
        source: "./sst.config.ts",
        destination: "sst.config.ts",
      },
      {
        source: "./wrangler.toml",
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
      const sourcePath = path.resolve(__dirname, "..", "..", file.source);
      const destPath = path.resolve(repoPath, file.destination);

      console.log(`📝 Injecting: ${file.destination}`);
      console.log(`   Source: ${sourcePath}`);
      console.log(`   Destination: ${destPath}`);

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

// Test function
async function testInjection() {
  console.log(`
╔═══════════════════════════════════════════════════╗
║          Injection Test Suite                    ║
╚═══════════════════════════════════════════════════╝
`);

  // Create event emitter
  const eventEmitter = new DeploymentEventEmitter();

  // Listen to events with proper typing
  eventEmitter.on("inject:start", (event: DeploymentEvent) => {
    console.log(`\n🎯 Test: Starting injection...`);
    if (event.type === "inject:start") {
      console.log(`   Framework: ${event.data.framework}`);
      console.log(`   Platform: ${event.data.platform}`);
    }
  });

  eventEmitter.on("inject:complete", (event: DeploymentEvent) => {
    console.log(`\n🎉 Test: Injection completed!`);
    if (event.type === "inject:complete") {
      console.log(`   Files injected:`, event.data.filesInjected);
    }
  });

  eventEmitter.on("inject:error", (event: DeploymentEvent) => {
    console.log(`\n❌ Test: Injection failed!`);
    if (event.type === "inject:error") {
      console.error(`   Error:`, event.error);
    }
  });

  // Test parameters
  const testCases = [
    {
      name: "Next.js on Cloudflare",
      repoPath: "./test-repos/nextjs-cloudflare",
      framework: "nextjs",
      platform: "cloudflare",
      context: {
        workerName: "nextjs-test-app",
        accountId: "test-account-123",
      },
    },
  ];

  for (const testCase of testCases) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🧪 Running Test: ${testCase.name}`);
    console.log(`${"=".repeat(50)}`);

    try {
      // Create test directory
      await fs.mkdir(testCase.repoPath, { recursive: true });

      // Run injection
      await injectFiles(
        testCase.repoPath,
        testCase.framework,
        testCase.platform,
        eventEmitter
      );

      console.log(`✅ Test passed: ${testCase.name}\n`);

      // Verify files were created
      console.log(`📋 Verifying created files...`);
      const configKey = `${testCase.framework}-${testCase.platform}`;
      const config = INJECTION_CONFIGS[configKey];

      if (config) {
        for (const file of config.files) {
          const filePath = path.resolve(testCase.repoPath, file.destination);
          try {
            const content = await fs.readFile(filePath, "utf-8");
            console.log(`   ✓ ${file.destination} exists (${content.length} bytes)`);
            
            // Show first 200 chars of content
            console.log(`   Preview: ${content.substring(0, 200)}...`);
          } catch (error) {
            console.log(`   ✗ ${file.destination} not found`);
          }
        }
      }
    } catch (error) {
      console.error(`❌ Test failed: ${testCase.name}`);
      console.error(error);
    }
  }

  console.log(`\n${"=".repeat(50)}`);
  console.log(`📊 All tests completed!`);
  console.log(`${"=".repeat(50)}\n`);

  // Cleanup
  console.log(`🧹 Cleaning up test directories...`);
  try {
    await fs.rm("./test-repos", { recursive: true, force: true });
    console.log(`✅ Cleanup completed\n`);
  } catch (error) {
    console.log(`⚠️  Cleanup skipped (directory may not exist)\n`);
  }
}

// Run tests
testInjection().catch((error) => {
  console.error("Test suite failed:", error);
  process.exit(1);
});