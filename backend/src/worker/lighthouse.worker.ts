/**
 * Deprecated Lighthouse Worker Shim.
 * FAIE v3 replaces dynamic browser execution with GitHub API + AST Static Intelligence.
 */
export async function startLighthouseWorker() {
  console.log("[LighthouseWorker] Deprecated in FAIE v3 (AST Static Intelligence Engine). Zero background dynamic browser tasks required.");
  return {
    close: async () => {}
  };
}

if (require.main === module) {
  startLighthouseWorker();
}