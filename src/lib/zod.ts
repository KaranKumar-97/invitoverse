/**
 * Zod configured for our CSP: `jitless` stops Zod probing `new Function` (which a strict CSP
 * reports as an eval violation even though Zod catches it). Modules that may run in the browser
 * import `z` from here instead of "zod".
 */
// eslint-disable-next-line no-restricted-imports -- the one place that configures Zod
import { z } from "zod";

z.config({ jitless: true });

export { z };
