import { execSync } from "node:child_process";
import type { NextConfig } from "next";

// Build stamp for GET /version, read from git at build time so the value is
// deterministic per commit. The time is the commit's own, rendered in UTC.
// Falls back to "unknown" outside a git checkout.
function gitStamp(): { sha: string; time: string } {
  try {
    const [sha, time] = execSync(
      "git show -s --date=format-local:%Y-%m-%dT%H:%M:%SZ --format=%H%n%cd HEAD",
      { stdio: ["ignore", "pipe", "ignore"], env: { ...process.env, TZ: "UTC" } },
    )
      .toString()
      .trim()
      .split("\n");
    return { sha: sha || "unknown", time: time || "unknown" };
  } catch {
    return { sha: "unknown", time: "unknown" };
  }
}
const stamp = gitStamp();

const nextConfig: NextConfig = {
  env: {
    BUILD_COMMIT_SHA: stamp.sha,
    BUILD_COMMIT_TIME: stamp.time,
  },
  // OpenNext handles deployment to AWS Lambda
  experimental: {
    // Stops FileSystemCache writes to read-only /var/task on Lambda (OpenNext #1232).
    isrFlushToDisk: false,
  },
};

export default nextConfig;
