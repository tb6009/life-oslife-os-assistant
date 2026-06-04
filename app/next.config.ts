import type { NextConfig } from "next";
import { execSync } from "child_process";

function getGitInfo() {
  try {
    const sha = execSync("git rev-parse --short HEAD").toString().trim();
    const time = execSync("git log -1 --format=%ci").toString().trim();
    return { sha, time };
  } catch {
    return { sha: "unknown", time: new Date().toISOString() };
  }
}

const git = getGitInfo();

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_ID: git.sha,
    NEXT_PUBLIC_DEPLOY_TIME: git.time,
  },
};

export default nextConfig;
