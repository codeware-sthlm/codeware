import * as fs from 'fs';
import * as path from 'path';

import type Anthropic from '@anthropic-ai/sdk';
import type { ExecutorContext, ProjectGraph } from '@nx/devkit';

import type { AnalyzeCategory, AnalyzeFormat, AnalyzeSchema } from './schema';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_MAX_FILES = 20;
const DEFAULT_MODEL = 'claude-sonnet-4-6';
const PER_FILE_CHAR_LIMIT = 3000;
const MAX_DEP_PROJECTS = 3;
const SEPARATOR = '─'.repeat(60);

const ALL_CATEGORIES: Array<AnalyzeCategory> = [
  'architecture',
  'typing',
  'maintainability',
  'refactoring'
];

const CATEGORY_DESCRIPTIONS: Record<AnalyzeCategory, string> = {
  architecture:
    'Module boundaries, separation of concerns, dependency direction, cohesion and coupling.',
  typing:
    'TypeScript type coverage, use of `any`, overly broad types, missing generics, type assertions.',
  maintainability:
    'Code clarity, naming conventions, comment quality, complexity, testability.',
  refactoring:
    'Duplication, dead code, overly large functions or files, opportunities to simplify.'
};

const EXCLUDED_DIRS = new Set([
  'node_modules',
  'dist',
  '.next',
  'coverage',
  '.nx',
  'out'
]);

const EXCLUDED_FILE_PATTERNS: Array<RegExp> = [
  /\.spec\.[tj]sx?$/,
  /\.test\.[tj]sx?$/,
  /\.d\.ts$/,
  /jest\.config\.[tj]s$/,
  /vite(st)?\.config\.[tj]sx?$/,
  /eslint\.config\.[mc]?[jt]s$/
];

const SOURCE_EXTENSIONS = new Set(['.ts', '.tsx']);

// ---------------------------------------------------------------------------
// File collection
// ---------------------------------------------------------------------------

function shouldSkipDir(name: string): boolean {
  return name.startsWith('.') || EXCLUDED_DIRS.has(name);
}

function shouldSkipFile(relativePath: string): boolean {
  return EXCLUDED_FILE_PATTERNS.some((re) => re.test(relativePath));
}

function walkDir(rootDir: string): Array<string> {
  if (!fs.existsSync(rootDir)) return [];

  const results: Array<string> = [];

  function walk(dir: string): void {
    let entries: Array<fs.Dirent>;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!shouldSkipDir(entry.name)) walk(fullPath);
      } else if (entry.isFile()) {
        const relative = path.relative(rootDir, fullPath).replace(/\\/g, '/');
        const ext = path.extname(entry.name);
        if (SOURCE_EXTENSIONS.has(ext) && !shouldSkipFile(relative)) {
          results.push(fullPath);
        }
      }
    }
  }

  walk(rootDir);
  return results;
}

/**
 * Priority bucket for a file (lower = higher priority).
 *  0 – entry points: src/index.ts, src/main.ts
 *  1 – src/lib/**
 *  2 – src/**
 *  3 – everything else
 */
function filePriority(projectRoot: string, absolutePath: string): number {
  const rel = path.relative(projectRoot, absolutePath).replace(/\\/g, '/');
  if (rel === 'src/index.ts' || rel === 'src/main.ts') return 0;
  if (rel.startsWith('src/lib/')) return 1;
  if (rel.startsWith('src/')) return 2;
  return 3;
}

function collectFiles(projectRoot: string, limit: number): Array<string> {
  const all = walkDir(projectRoot);

  all.sort((a, b) => {
    const diff = filePriority(projectRoot, a) - filePriority(projectRoot, b);
    return diff !== 0 ? diff : a.localeCompare(b);
  });

  return all.slice(0, limit);
}

// ---------------------------------------------------------------------------
// Dependency files
// ---------------------------------------------------------------------------

function getInternalDeps(
  projectName: string,
  projectGraph: ProjectGraph,
  maxDeps: number
): Array<string> {
  return (projectGraph.dependencies[projectName] ?? [])
    .filter((dep) => !dep.target.startsWith('npm:'))
    .slice(0, maxDeps)
    .map((dep) => dep.target);
}

// ---------------------------------------------------------------------------
// Prompt building
// ---------------------------------------------------------------------------

interface FileEntry {
  relativePath: string;
  content: string;
  truncated: boolean;
}

function readFileEntry(absolutePath: string, workspaceRoot: string): FileEntry {
  const relativePath = path
    .relative(workspaceRoot, absolutePath)
    .replace(/\\/g, '/');

  let raw = '';
  try {
    raw = fs.readFileSync(absolutePath, 'utf-8');
  } catch {
    // skip unreadable files
  }

  const truncated = raw.length > PER_FILE_CHAR_LIMIT;
  const content = truncated ? raw.slice(0, PER_FILE_CHAR_LIMIT) : raw;
  return { relativePath, content, truncated };
}

function buildPrompt(
  projectName: string,
  entries: Array<FileEntry>,
  categories: Array<AnalyzeCategory>
): string {
  const categoryList = categories
    .map((c) => `- **${c}**: ${CATEGORY_DESCRIPTIONS[c]}`)
    .join('\n');

  const filesBlock = entries
    .map((e) => {
      const truncNote = e.truncated
        ? `\n// [truncated — showing first ${PER_FILE_CHAR_LIMIT} characters]`
        : '';
      return `### ${e.relativePath}${truncNote}\n\`\`\`typescript\n${e.content}\n\`\`\``;
    })
    .join('\n\n');

  return `You are an expert TypeScript and Nx monorepo code reviewer.

Analyze the following source files from the Nx project **${projectName}** and provide structured, actionable feedback.

## Analysis categories

${categoryList}

## Instructions

- Begin your response with a \`## Executive Summary\` section containing:
  - **Priority**: overall severity of findings (High / Medium / Low)
  - **Top findings**: 2–3 bullet points on the most impactful issues
  - **Quick wins**: 1–2 bullet points on easy, high-value improvements
- After the summary, group the remaining feedback by the analysis categories listed above.
- Under each category heading, provide concrete, specific recommendations.
- Reference file names and line ranges where relevant.
- Be concise: focus on the most impactful issues only.
- If a category has no significant issues, briefly note that it looks good.

## Source files (${entries.length} files)

${filesBlock}
`;
}

// ---------------------------------------------------------------------------
// Output
// ---------------------------------------------------------------------------

function printHeader(
  projectName: string,
  fileCount: number,
  model: string
): void {
  console.log('');
  console.log(SEPARATOR);
  console.log(`  nx-ai: analyze  •  project: ${projectName}`);
  console.log(`  Files: ${fileCount}  •  Model: ${model}`);
  console.log(SEPARATOR);
  console.log('');
}

// ---------------------------------------------------------------------------
// Executor
// ---------------------------------------------------------------------------

export default async function runExecutor(
  options: AnalyzeSchema,
  context: ExecutorContext
): Promise<{ success: boolean }> {
  const categories =
    options.focus && options.focus.length > 0 ? options.focus : ALL_CATEGORIES;
  const format: AnalyzeFormat = options.format ?? 'full';
  const includeDeps = options.includeDeps ?? false;
  const maxFiles = options.maxFiles ?? DEFAULT_MAX_FILES;
  const model = options.model ?? DEFAULT_MODEL;
  const outputFile = options.outputFile;

  // Validate API key
  const apiKey = process.env['ANTHROPIC_API_KEY'];
  if (!apiKey) {
    console.error(
      '[nx-ai] ANTHROPIC_API_KEY is not set.\n' +
        'Add it to your shell environment or .env.local:\n' +
        '  ANTHROPIC_API_KEY=sk-ant-...'
    );
    return { success: false };
  }

  // Resolve project
  const projectName = context.projectName;
  if (!projectName) {
    console.error('[nx-ai] No project name in executor context.');
    return { success: false };
  }

  const projectNode = context.projectGraph?.nodes[projectName];
  if (!projectNode) {
    console.error(
      `[nx-ai] Project "${projectName}" not found in project graph.`
    );
    return { success: false };
  }

  const projectRoot = path.join(context.root, projectNode.data.root);

  // Collect main project files
  const projectFiles = collectFiles(projectRoot, maxFiles);

  if (projectFiles.length === 0) {
    console.error(
      `[nx-ai] No TypeScript source files found in "${projectName}" at ${projectRoot}.`
    );
    return { success: false };
  }

  let allFiles = [...projectFiles];

  // Optionally collect from internal deps
  if (includeDeps && context.projectGraph) {
    const remainingSlots = maxFiles - projectFiles.length;

    if (remainingSlots > 0) {
      const depNames = getInternalDeps(
        projectName,
        context.projectGraph,
        MAX_DEP_PROJECTS
      );

      const slotsPerDep =
        depNames.length > 0 ? Math.floor(remainingSlots / depNames.length) : 0;

      for (const depName of depNames) {
        if (slotsPerDep <= 0) break;
        const depNode = context.projectGraph.nodes[depName];
        if (!depNode) continue;
        const depRoot = path.join(context.root, depNode.data.root);
        allFiles = [...allFiles, ...collectFiles(depRoot, slotsPerDep)];
      }
    }
  }

  // Read file contents
  const allUniqueFiles = Array.from(new Set(allFiles));
  const entries = allUniqueFiles.map((f) => readFileEntry(f, context.root));

  // Build prompt
  const prompt = buildPrompt(projectName, entries, categories);

  // Call Claude API
  // Using require so @anthropic-ai/sdk stays a peerDependency at compile time
  const AnthropicModule = require('@anthropic-ai/sdk') as {
    default: { new (opts: { apiKey: string }): Anthropic };
  };
  const client = new AnthropicModule.default({ apiKey });

  printHeader(projectName, entries.length, model);
  console.log('Sending request to Claude...\n');

  let responseText: string;
  try {
    const message = await client.messages.create({
      model,
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }]
    });

    const first = message.content[0];
    if (first?.type === 'text') {
      responseText = first.text;
    } else {
      console.error('[nx-ai] Unexpected response format from Claude API.');
      return { success: false };
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[nx-ai] Claude API error: ${msg}`);
    return { success: false };
  }

  // Print to terminal
  if (format === 'summary') {
    const match = responseText.match(
      /^## Executive Summary\s*([\s\S]*?)(?=^##\s|^#\s|$)/m
    );
    if (match) {
      console.log(`## Executive Summary\n\n${match[1].trim()}`);
    } else {
      console.log(
        '[nx-ai] Executive summary not found; showing full response.\n'
      );
      console.log(responseText);
    }
  } else {
    console.log(responseText);
  }

  // Write full markdown report to disk if requested
  if (outputFile) {
    const resolvedPath = path.isAbsolute(outputFile)
      ? outputFile
      : path.join(context.root, outputFile);
    fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
    const timestamp = new Date().toISOString();
    const analyzedFiles = entries
      .map((e) => `- \`${e.relativePath}\``)
      .join('\n');

    const markdown =
      `# AI Code Analysis: ${projectName}\n\n` +
      `Generated: ${timestamp}  \nModel: ${model}  \nFiles analyzed: ${entries.length}\n\n` +
      `## Included files\n\n${analyzedFiles}\n\n---\n\n` +
      responseText +
      '\n';
    fs.writeFileSync(resolvedPath, markdown, 'utf-8');

    // Display a friendlier relative report path to the user
    const displayPath =
      path.relative(context.root, resolvedPath) || resolvedPath;
    console.log(`\n[nx-ai] Report written to ${displayPath}`);
  }

  console.log('\n' + SEPARATOR + '\n');

  return { success: true };
}
