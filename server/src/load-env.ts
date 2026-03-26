/**
 * Loads the single root-level .env file before any other module reads process.env.
 *
 * This MUST be imported as the very first side-effect import in index.ts.
 * In ESM, all imports are hoisted and evaluated before top-level code, so a
 * plain `config()` call inside index.ts runs too late — env.ts has already
 * read process.env by then. Isolating it here ensures this module is fully
 * evaluated (and process.env is populated) before env.ts is evaluated.
 *
 * Path: server/src/load-env.ts → ../../.env → project root .env
 */
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

config({ path: resolve(__dirname, '../../.env') });
