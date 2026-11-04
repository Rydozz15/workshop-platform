import path from 'node:path';
import fs from 'node:fs';
import { pathToFileURL } from 'node:url';

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    return nextResolve('next/server.js', context);
  }
  if (specifier.startsWith('@/')) {
    const root = process.cwd();
    let target = path.join(root, specifier.slice(2));
    if (!path.extname(target) && !fs.existsSync(target)) {
      target += '.js';
    }
    return {
      url: pathToFileURL(target).href,
      shortCircuit: true,
    };
  }
  return nextResolve(specifier, context);
}
