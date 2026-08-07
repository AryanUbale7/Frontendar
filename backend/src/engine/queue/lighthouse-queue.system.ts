/**
 * Deprecated Lighthouse Queue System.
 * FAIE v3 executes all evaluations synchronously in RAM via WASM AST static analysis.
 */
export class LighthouseQueue {
  async addJob(data: any): Promise<{ id: string }> {
    return { id: `deprecated_lh_${Date.now()}` };
  }
  async close(): Promise<void> {}
}