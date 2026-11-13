import JSZip from 'jszip';
import { FolderItem } from '../components/FileUpload';

export interface GitHubRepoInfo {
  owner: string;
  repo: string;
  branch?: string;
  subpath?: string;
}

/**
 * Parse a GitHub URL or shorthand string into structured repo info
 * Examples:
 * - https://github.com/facebook/react
 * - https://github.com/facebook/react/tree/main/packages
 * - yd-singh/MD-Viewer
 * - owner/repo@develop
 */
export function parseGitHubUrl(input: string): GitHubRepoInfo | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Handle standard GitHub URLs
  const urlMatch = trimmed.match(/^https?:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.*))?)?$/i);
  if (urlMatch) {
    const [, owner, repo, branch, subpath] = urlMatch;
    return {
      owner,
      repo,
      branch: branch || undefined,
      subpath: subpath ? subpath.replace(/\/$/, '') : undefined,
    };
  }

  // Handle shorthand owner/repo@branch or owner/repo/path
  const shorthandMatch = trimmed.match(/^([^/\s]+)\/([^/@\s]+)(?:@([^/\s]+))?(?:\/(.*))?$/);
  if (shorthandMatch) {
    const [, owner, repo, branch, subpath] = shorthandMatch;
    return {
      owner,
      repo,
      branch: branch || undefined,
      subpath: subpath ? subpath.replace(/\/$/, '') : undefined,
    };
  }

  return null;
}

/**
 * Fetch all Markdown files from a public GitHub repository using GitHub's Git Trees API & Raw CDN
 */
export async function fetchGitHubRepoMarkdown(
  info: GitHubRepoInfo,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<FolderItem[]> {
  const { owner, repo } = info;
  let branch = info.branch;

  onProgress?.('Contacting GitHub API...', 0, 0);

  // 1. If branch is not specified, get repository details for default branch
  if (!branch) {
    const repoRes = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (repoRes.status === 404) {
      throw new Error(`Repository "${owner}/${repo}" was not found or is private.`);
    }
    if (repoRes.status === 403) {
      throw new Error('GitHub API rate limit exceeded. Please wait a few minutes or try uploading via ZIP.');
    }
    if (!repoRes.ok) {
      throw new Error(`GitHub API error (${repoRes.status}): ${repoRes.statusText}`);
    }
    const repoData = await repoRes.json();
    branch = repoData.default_branch || 'main';
  }

  // 2. Fetch the Git Tree recursively
  onProgress?.(`Fetching repository file tree (${branch})...`, 0, 0);
  const treeRes = await fetch(
    `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`
  );

  if (!treeRes.ok) {
    if (treeRes.status === 404) {
      throw new Error(`Branch "${branch}" not found in ${owner}/${repo}.`);
    }
    throw new Error(`Could not load tree from GitHub (${treeRes.status}).`);
  }

  const treeData = await treeRes.json();
  if (!treeData.tree || !Array.isArray(treeData.tree)) {
    throw new Error('Failed to retrieve file tree for this repository.');
  }

  // 3. Filter markdown files
  const validExtensions = ['.md', '.markdown', '.txt'];
  let markdownEntries = treeData.tree.filter((item: any) => {
    if (item.type !== 'blob') return false;
    const pathLower = item.path.toLowerCase();
    return validExtensions.some((ext) => pathLower.endsWith(ext));
  });

  // Filter subpath if specified
  if (info.subpath) {
    const subpathPrefix = info.subpath.toLowerCase();
    markdownEntries = markdownEntries.filter((item: any) =>
      item.path.toLowerCase().startsWith(subpathPrefix)
    );
  }

  if (markdownEntries.length === 0) {
    throw new Error(`No Markdown files found in ${owner}/${repo}${info.subpath ? `/${info.subpath}` : ''}.`);
  }

  // Cap at 60 files for performance and responsiveness
  const filesToFetch = markdownEntries.slice(0, 60);
  const total = filesToFetch.length;
  const results: FolderItem[] = [];

  onProgress?.(`Found ${markdownEntries.length} markdown file(s). Fetching contents...`, 0, total);

  // 4. Concurrently fetch raw file contents via raw.githubusercontent.com
  // Using batches of 6 concurrent downloads
  const batchSize = 6;
  for (let i = 0; i < filesToFetch.length; i += batchSize) {
    const batch = filesToFetch.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (item: any) => {
        const rawUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${item.path}`;
        try {
          const res = await fetch(rawUrl);
          if (!res.ok) {
            console.warn(`Failed to fetch ${item.path}: ${res.statusText}`);
            return null;
          }
          const content = await res.text();
          const fileName = item.path.split('/').pop() || item.path;
          return {
            path: item.path,
            name: fileName,
            content,
          } as FolderItem;
        } catch (err) {
          console.warn(`Error fetching ${item.path}`, err);
          return null;
        }
      })
    );

    for (const res of batchResults) {
      if (res) results.push(res);
    }

    onProgress?.(
      `Downloading files: ${Math.min(i + batchSize, total)} of ${total}`,
      results.length,
      total
    );
  }

  if (results.length === 0) {
    throw new Error('Failed to retrieve file contents from GitHub.');
  }

  // Sort: README first, then alphabetically
  results.sort((a, b) => {
    const aIsReadme = /(^|\/)readme\.md$/i.test(a.path);
    const bIsReadme = /(^|\/)readme\.md$/i.test(b.path);
    if (aIsReadme && !bIsReadme) return -1;
    if (!aIsReadme && bIsReadme) return 1;
    return a.path.localeCompare(b.path);
  });

  return results;
}

/**
 * Unpack a ZIP archive directly client-side via JSZip and extract all markdown files
 */
export async function unpackZipArchive(
  file: File,
  onProgress?: (status: string, current: number, total: number) => void
): Promise<FolderItem[]> {
  onProgress?.('Reading ZIP archive...', 0, 0);

  const arrayBuffer = await file.arrayBuffer();
  const zip = await JSZip.loadAsync(arrayBuffer);

  const validExtensions = ['.md', '.markdown', '.txt'];
  const zipEntries = Object.values(zip.files).filter((entry) => {
    if (entry.dir) return false;
    // Exclude OS metadata and git
    if (entry.name.includes('__MACOSX') || entry.name.includes('/.git/')) return false;
    const lowerName = entry.name.toLowerCase();
    return validExtensions.some((ext) => lowerName.endsWith(ext));
  });

  if (zipEntries.length === 0) {
    throw new Error('No Markdown files (.md, .markdown, .txt) found inside this ZIP archive.');
  }

  onProgress?.(`Unpacking ${zipEntries.length} markdown file(s)...`, 0, zipEntries.length);

  // Check if all files share a common single root directory (e.g. repo-main/...)
  const firstSlashIdxs = zipEntries.map((e) => e.name.indexOf('/'));
  const allHaveDir = firstSlashIdxs.every((idx) => idx > 0);
  let commonPrefix = '';
  if (allHaveDir && zipEntries.length > 0) {
    const candidate = zipEntries[0].name.slice(0, firstSlashIdxs[0] + 1);
    if (zipEntries.every((e) => e.name.startsWith(candidate))) {
      commonPrefix = candidate;
    }
  }

  const results: FolderItem[] = [];
  let count = 0;

  for (const entry of zipEntries) {
    const text = await entry.async('string');
    // Strip common single root folder prefix if present for cleaner paths
    const cleanPath = commonPrefix ? entry.name.slice(commonPrefix.length) : entry.name;
    const fileName = cleanPath.split('/').pop() || cleanPath;

    results.push({
      path: cleanPath,
      name: fileName,
      content: text,
    });

    count++;
    onProgress?.(`Unpacking files: ${count} of ${zipEntries.length}`, count, zipEntries.length);
  }

  // Sort README first
  results.sort((a, b) => {
    const aIsReadme = /(^|\/)readme\.md$/i.test(a.path);
    const bIsReadme = /(^|\/)readme\.md$/i.test(b.path);
    if (aIsReadme && !bIsReadme) return -1;
    if (!aIsReadme && bIsReadme) return 1;
    return a.path.localeCompare(b.path);
  });

  return results;
}
