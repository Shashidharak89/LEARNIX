export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    try {
      const { getOrStartWsServer } = await import("@/lib/updatesWsServer");
      getOrStartWsServer();
    } catch (err) {
      console.warn("[Instrumentation] Could not auto-start updates WS server:", err.message);
    }
  }
}
