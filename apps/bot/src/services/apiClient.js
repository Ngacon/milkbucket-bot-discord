const {
  resolveCoinflipFallback,
  resolveFishingFallback
} = require("./localRngFallback");

class ApiClient {
  constructor(baseUrl, timeoutMs = 4_000, options = {}) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
    this.timeoutMs = timeoutMs;
    this.mode = options.mode || "auto";
    this.fallbackCooldownMs = options.fallbackCooldownMs || 60_000;
    this.fallbackWarningsShown = new Set();
    this.unavailableUntil = 0;
  }

  async post(path, body) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`RNG service ${response.status}: ${text}`);
      }

      return response.json();
    } finally {
      clearTimeout(timeout);
    }
  }

  isRetryableNetworkError(error) {
    if (!error) {
      return false;
    }

    if (error.name === "AbortError") {
      return true;
    }

    if (error.cause && typeof error.cause === "object") {
      const causeCode = error.cause.code;
      if (["ECONNREFUSED", "ECONNRESET", "EHOSTUNREACH", "ENOTFOUND", "UND_ERR_CONNECT_TIMEOUT"].includes(causeCode)) {
        return true;
      }
    }

    return /fetch failed|connect|network|timeout/i.test(error.message || "");
  }

  warnFallbackOnce(kind, error) {
    if (this.fallbackWarningsShown.has(kind)) {
      return;
    }

    this.fallbackWarningsShown.add(kind);
    console.warn(
      `[rng:fallback:${kind}] primary RNG service unreachable at ${this.baseUrl}. Using local fallback. ${error.message}`
    );
  }

  isInLocalMode() {
    return this.mode === "local" || !this.baseUrl;
  }

  isServiceCoolingDown() {
    return this.mode === "auto" && this.unavailableUntil > Date.now();
  }

  markServiceUnavailable() {
    if (this.mode !== "auto") {
      return;
    }

    this.unavailableUntil = Date.now() + this.fallbackCooldownMs;
  }

  async withFallback(kind, requestFn, fallbackFn) {
    if (this.isInLocalMode() || this.isServiceCoolingDown()) {
      return fallbackFn();
    }

    try {
      return await requestFn();
    } catch (error) {
      if (!this.isRetryableNetworkError(error) || this.mode === "service") {
        throw error;
      }

      this.markServiceUnavailable();
      this.warnFallbackOnce(kind, error);
      return fallbackFn();
    }
  }

  async coinflip(payload) {
    return this.withFallback(
      "coinflip",
      () => this.post("/v1/gamble/coinflip", payload),
      () => resolveCoinflipFallback(payload)
    );
  }

  async fish(payload) {
    return this.withFallback(
      "fish",
      () => this.post("/v1/fishing/cast", payload),
      () => resolveFishingFallback(payload)
    );
  }
}

module.exports = { ApiClient };
