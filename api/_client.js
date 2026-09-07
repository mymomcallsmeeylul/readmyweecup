/**
 * The transport every agent calls through.
 *
 * Raw fetch rather than @anthropic-ai/sdk on purpose: this project ships with
 * no dependencies and no build step, which is a stated product constraint, and
 * one endpoint does not justify breaking it. The cost of that choice is that
 * the request shape below has to be right by hand, so the three things the
 * current API rejects are enforced here once rather than trusted to each of
 * the five agents:
 *
 *   1. No assistant prefill. Ending a request on an assistant turn to force
 *      JSON returns a 400 on every current Opus- and Sonnet-tier model. The
 *      replacement is structured outputs, which is stricter anyway: the schema
 *      is enforced server-side instead of hoped for.
 *   2. No temperature / top_p / top_k. Removed on the same models, 400 if sent.
 *      Reach for `effort` instead, which is what actually trades thinking
 *      depth against tokens.
 *   3. stop_reason is checked before content is read, because a refusal comes
 *      back as a 200 with no usable body.
 *   4. Structured outputs accept a subset of JSON Schema. Count and range
 *      constraints are rejected outright, so they are stripped on the way out.
 *      See schemaForApi.
 */

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * One model per agent, each overridable, all defaulting to the same place.
 * Splitting them is what makes it cheap to find out whether the Context Queen
 * really needs the big model; nothing in the pipeline assumes they match.
 */
const DEFAULT_MODEL = process.env.DESTINY_MODEL || 'claude-opus-5';

export const MODELS = {
  eye: process.env.EYE_MODEL || DEFAULT_MODEL,
  searcher: process.env.SEARCHER_MODEL || DEFAULT_MODEL,
  contextQueen: process.env.CONTEXT_QUEEN_MODEL || DEFAULT_MODEL,
  fairy: process.env.FAIRY_MODEL || DEFAULT_MODEL,
  fortuneTeller: process.env.FORTUNE_TELLER_MODEL || DEFAULT_MODEL,
  triage: process.env.TRIAGE_MODEL || DEFAULT_MODEL,
};

export class AgentError extends Error {
  constructor(agent, message, options = {}) {
    super(`${agent}: ${message}`);
    this.name = 'AgentError';
    this.agent = agent;
    this.status = options.status;
    this.retryable = Boolean(options.retryable);
  }
}

/**
 * A single wall-clock budget shared by the whole pipeline.
 *
 * Five agents in a chain against a 60s function ceiling means the last one can
 * be starved by the first four. Passing the deadline down lets each stage ask
 * how much time is left and degrade on purpose, rather than every stage
 * optimistically spending and the Fortune Teller being the one that dies.
 */
export class Deadline {
  constructor(totalMs) {
    this.start = Date.now();
    this.totalMs = totalMs;
  }

  get elapsed() {
    return Date.now() - this.start;
  }

  get remaining() {
    return Math.max(0, this.totalMs - this.elapsed);
  }

  /** Is there room for a stage that usually needs `needMs`? */
  affords(needMs) {
    return this.remaining > needMs;
  }

  /**
   * Per-request timeout: whatever is left, capped so one stage cannot eat the
   * whole budget. The 1s floor wins over both, deliberately: handing fetch a
   * 0ms timeout aborts before the connection opens, which turns a tight budget
   * into a guaranteed failure instead of a long shot. Callers are not expected
   * to pass a cap below the floor.
   */
  slice(capMs) {
    return Math.max(1000, Math.min(capMs, this.remaining));
  }
}

/**
 * Structured outputs take a subset of JSON Schema, and anything outside it is
 * a 400 rather than a warning:
 *
 *   output_config.format.schema: For 'array' type, property 'maxItems' is not
 *   supported
 *
 * That was a live outage, not a hypothetical. The Eye carried maxItems on its
 * shapes array, so the very first call of every reading failed and the seeker
 * got "The cup went quiet" every time.
 *
 * The official SDKs strip these and validate them client-side. We call the API
 * over raw fetch, so we do it here. The agents keep writing the constraint they
 * mean, because a schema is documentation as much as it is enforcement, and
 * every count it drops is already enforced in the agent that parses the answer:
 * the Eye clamps and slices, the Context Queen throws below three themes, the
 * Fortune Teller throws below three passages.
 */
const UNSUPPORTED_KEYWORDS = new Set([
  // Counts. This is the one that took production down.
  'minItems',
  'maxItems',
  'uniqueItems',
  'minProperties',
  'maxProperties',
  // Ranges.
  'minimum',
  'maximum',
  'exclusiveMinimum',
  'exclusiveMaximum',
  'multipleOf',
  // String shapes. `format` stays: it is on the supported list.
  'minLength',
  'maxLength',
  'pattern',
]);

/** Property-name maps, whose keys are field names rather than keywords. */
const NAME_MAPS = new Set(['properties', '$defs', 'definitions']);

export function schemaForApi(node) {
  if (Array.isArray(node)) return node.map(schemaForApi);
  if (!node || typeof node !== 'object') return node;

  const out = {};
  for (const [key, value] of Object.entries(node)) {
    if (UNSUPPORTED_KEYWORDS.has(key)) continue;
    // Under `properties`, "pattern" is a field the model will emit, not a
    // constraint on one. Recurse past the names before filtering again.
    out[key] = NAME_MAPS.has(key)
      ? Object.fromEntries(Object.entries(value).map(([n, sub]) => [n, schemaForApi(sub)]))
      : schemaForApi(value);
  }
  return out;
}

/**
 * Ask one agent a question and get its structured answer back.
 *
 * `schema` is a JSON Schema. Passing it turns on structured outputs, which is
 * the supported replacement for the prefill-and-pray pattern: the response is
 * guaranteed to parse and to match the shape, so downstream agents can trust
 * their input without defensive re-parsing.
 */
export async function ask({
  agent,
  model,
  system,
  content,
  schema,
  maxTokens = 2000,
  effort,
  tools,
  timeoutMs = 30_000,
  retries = 1,
}) {
  const body = {
    model,
    max_tokens: maxTokens,
    system,
    messages: [{ role: 'user', content }],
  };

  const outputConfig = {};
  if (effort) outputConfig.effort = effort;
  // Schema and tools are kept apart here by choice, not by a documented API
  // rule: a tool-using turn has to stay free to emit tool_use blocks and loop,
  // and constraining its final turn to a schema is at best unclear. The one
  // agent that holds a tool, the Searcher, parses its own JSON instead.
  if (schema && !tools) {
    outputConfig.format = { type: 'json_schema', schema: schemaForApi(schema) };
  }
  if (Object.keys(outputConfig).length) body.output_config = outputConfig;

  if (tools) body.tools = tools;

  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await once(agent, body, timeoutMs);
    } catch (err) {
      lastError = err;
      if (!err.retryable || attempt === retries) throw err;
      await pause(400 * (attempt + 1));
    }
  }
  throw lastError;
}

async function once(agent, body, timeoutMs) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(ANTHROPIC_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => '');
      throw new AgentError(agent, `HTTP ${res.status}: ${detail.slice(0, 400)}`, {
        status: res.status,
        retryable: res.status === 429 || res.status >= 500,
      });
    }

    const json = await res.json();

    // A refusal is a 200 with nothing usable in it. Read stop_reason first.
    if (json.stop_reason === 'refusal') {
      throw new AgentError(agent, `refused (${json.stop_details?.category || 'unspecified'})`, {
        status: 200,
      });
    }

    const text = (json.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    if (!text) throw new AgentError(agent, `returned nothing (stop: ${json.stop_reason})`);

    return { text, raw: json, usage: json.usage };
  } catch (err) {
    if (err instanceof AgentError) throw err;
    if (err?.name === 'AbortError') {
      throw new AgentError(agent, `timed out after ${timeoutMs}ms`, { retryable: false });
    }
    throw new AgentError(agent, err?.message || String(err), { retryable: true });
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Parse an agent's answer.
 *
 * With a schema the response is already guaranteed to be valid JSON, so this
 * is a plain parse. It stays tolerant anyway for the one agent that cannot use
 * structured outputs, the Searcher, because it is holding a server tool.
 */
export function parseAnswer(agent, text) {
  const cleaned = text
    .replace(/^```(?:json)?/i, '')
    .replace(/```$/, '')
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start === -1 || end <= start) {
      throw new AgentError(agent, 'returned no parseable JSON');
    }
    try {
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch {
      throw new AgentError(agent, 'returned malformed JSON');
    }
  }
}

export const pause = (ms) => new Promise((r) => setTimeout(r, ms));
export const str = (v) => (typeof v === 'string' ? v.trim() : '');
