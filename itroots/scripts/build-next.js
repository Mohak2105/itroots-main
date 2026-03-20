const exportModulePath = require.resolve("next/dist/export");
const exportModule = require(exportModulePath);
const nextBuildModule = require("next/dist/cli/next-build");

function sanitizeForWorker(value, seen = new WeakMap()) {
  if (typeof value === "function") {
    return undefined;
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags);
  }

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (Array.isArray(value)) {
    const copy = [];
    seen.set(value, copy);

    for (const item of value) {
      copy.push(sanitizeForWorker(item, seen));
    }

    return copy;
  }

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);

    for (const [key, entryValue] of value.entries()) {
      copy.set(sanitizeForWorker(key, seen), sanitizeForWorker(entryValue, seen));
    }

    return copy;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);

    for (const item of value.values()) {
      copy.add(sanitizeForWorker(item, seen));
    }

    return copy;
  }

  const copy = {};
  seen.set(value, copy);

  for (const [key, entryValue] of Object.entries(value)) {
    const sanitized = sanitizeForWorker(entryValue, seen);

    if (sanitized !== undefined) {
      copy[key] = sanitized;
    }
  }

  return copy;
}

function patchStaticWorker(staticWorker) {
  if (!staticWorker || staticWorker.__codexPatchedForWorkerThreads) {
    return staticWorker;
  }

  // Next's worker_threads export path chokes on function values in the payload.
  const methodNames = [
    "hasCustomGetInitialProps",
    "getDefinedNamedExports",
    "isPageStatic",
    "exportPages",
  ];

  for (const methodName of methodNames) {
    const originalMethod = staticWorker[methodName];

    if (typeof originalMethod !== "function") {
      continue;
    }

    staticWorker[methodName] = (...args) =>
      originalMethod.apply(
        staticWorker,
        args.map((arg) => sanitizeForWorker(arg))
      );
  }

  staticWorker.__codexPatchedForWorkerThreads = true;
  return staticWorker;
}

const originalExportApp = exportModule.default;

async function patchedExportApp(
  dir,
  options,
  span,
  staticWorker
) {
  return originalExportApp(dir, options, span, patchStaticWorker(staticWorker));
}

require.cache[exportModulePath].exports = {
  ...exportModule,
  default: patchedExportApp,
};

nextBuildModule.nextBuild({ mangling: true }, process.cwd()).catch((error) => {
  console.error(error);
  process.exit(1);
});
