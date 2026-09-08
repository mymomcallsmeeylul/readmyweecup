/**
 * The transport every agent calls through.
 *
 * Raw fetch rather than @anthropic-ai/sdk on purpose: this project ships with
 * no dependencies and no build step, which is a stated product constraint, and
 * one endpoint does not justify breaking it. The cost of that choice is that
 * the request shape below has to be right by hand, so the four things the
 * current API rejects are enforced here once rather than trusted to each of
 * the agents:
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
 * One model per call, each overridable, all defaulting to the same place.
 * Splitting them is what makes it cheap to find out whether the Eye really
 * needs the big model; nothing in the pipeline assumes they match.
 *
 * Four entries, not six. The Context Queen and the Fairy had one each until
 * they stopped being calls and became sections of the Fortune Teller's prompt,
 * and a knob wired to nothing is worse than no knob: it reads as a supported
 * way to change behaviour that in fact does nothing at all.
 */
const DEFAULT_MODEL = process.env.DESTINY_MODEL || 'claude-opus-5';

export const MODELS = {
  eye: process.env.EYE_MODEL || DEFAULT_MODEL,
  searcher: process.env.SEARCHER_MODEL || DEFAULT_MODEL,
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
 * A chain of calls against a 60s function ceiling means the last one can be
 * starved by the ones before it. Passing the deadline down lets each stage ask
 * how much time it may spend and degrade on purpose, rather than every stage
 * spending optimistically and the Fortune Teller being the one that dies.
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

  /**
   * What a stage may spend when other stages still have to run after it.
   *
   * slice() alone is why a reading once burned all 50s and died: the Eye and
   * the Searcher spent 48.6s between them, and the Context Queen was then
   * handed the 1.35s that happened to be left. A 1.35s timeout is not a stage
   * degrading on purpose, it is a guaranteed failure that has already spent
   * the whole budget.
   *
   * So a stage asks for its own cap minus what it owes the stages behind it.
   * Unlike slice() this returns 0 rather than a floor, because 0 is real
   * information: there is no room, and the caller decides whether that means
   * skip (an optional stage) or stop now (a required one). Spending 20s to
   * discover you had 1s is the outcome being designed out.
   */
  budget(capMs, reserveMs = 0) {
    const spare = this.remaining - reserveMs;
    if (spare < 1000) return 0;
    return Math.min(capMs, spare);
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
 * every count it drops is already enforced in the code that parses the answer:
 * the Eye clamps and slices to three shapes, the Fortune Teller throws below
 * three passages and trims to three themes.
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

    // Truncation is worth naming rather than letting the JSON parse fail three
    // frames later: "malformed JSON" sends you looking at the schema when the
    // fix is a token ceiling. Thinking counts against max_tokens, so a stage
    // tuned for speed can hit this without the answer itself being long.
    if (json.stop_reason === 'max_tokens') {
      throw new AgentError(agent, `ran out of tokens (max_tokens too low for this answer)`);
    }

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
