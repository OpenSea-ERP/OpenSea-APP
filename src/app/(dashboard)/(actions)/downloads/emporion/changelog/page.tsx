/**
 * Emporion Full Changelog Page
 * Histórico completo de versões do OpenSea Emporion
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { cn } from '@/lib/utils';
import { History, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

const GITHUB_REPO = 'OpenSea-ERP/OpenSea-Emporion';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

interface GitHubAsset {
  name: string;
  browser_download_url: string;
}

interface GitHubRelease {
  tag_name: string;
  body: string;
  published_at: string;
  assets: GitHubAsset[];
  prerelease: boolean;
  draft: boolean;
}

interface ParsedRelease {
  version: string;
  date: string;
  changes: string[];
  windowsUrl?: string;
}

function parseReleaseBody(body: string): string[] {
  if (!body) return [];
  const lines = body.split('\n');
  const changes: string[] = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
      changes.push(trimmed.slice(2).trim());
    }
  }
  return changes;
}

export default function EmporionChangelogPage() {
  const [releases, setReleases] = useState<ParsedRelease[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(GITHUB_API, {
      headers: { Accept: 'application/vnd.github+json' },
    })
      .then(res => {
        if (!res.ok) throw new Error(`GitHub API: ${res.status}`);
        return res.json();
      })
      .then((data: GitHubRelease[]) => {
        const parsed = data
          .filter(r => !r.draft && !r.prerelease)
          .map(r => ({
            version: r.tag_name.replace(/^v/, ''),
            date: r.published_at,
            changes: parseReleaseBody(r.body),
            windowsUrl: r.assets.find(a => /\.exe$/i.test(a.name))
              ?.browser_download_url,
          }));
        setReleases(parsed);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Terminais POS', href: '/devices/pos-terminals' },
            { label: 'Download Emporion', href: '/downloads/emporion' },
            { label: 'Changelog' },
          ]}
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        <Card className="bg-white dark:bg-slate-800/60 border border-border p-6">
          <div className="space-y-3 mb-6">
            <div className="flex items-center gap-3">
              <History className="h-5 w-5 text-foreground" />
              <div>
                <h3 className="text-base font-semibold">Changelog Completo</h3>
                <p className="text-sm text-muted-foreground">
                  Todas as versões publicadas do OpenSea Emporion
                </p>
              </div>
            </div>
            <div className="border-b border-border" />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : error ? (
            <p className="text-sm text-rose-500 text-center py-8">
              Erro ao carregar releases: {error}
            </p>
          ) : releases.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Nenhuma versão publicada.
            </p>
          ) : (
            <div className="space-y-8">
              {releases.map((release, idx) => (
                <div key={release.version} className="space-y-2">
                  <div className="flex items-center gap-3 flex-wrap">
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-xs font-mono',
                        idx === 0
                          ? 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-300 dark:border-violet-500/20'
                          : 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-gray-500/10 dark:text-gray-400 dark:border-gray-500/20'
                      )}
                    >
                      v{release.version}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(release.date).toLocaleDateString('pt-BR')}
                    </span>
                    {idx === 0 && (
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-300 dark:border-emerald-500/20"
                      >
                        Atual
                      </Badge>
                    )}
                    {release.windowsUrl && (
                      <a
                        href={release.windowsUrl}
                        className="text-xs text-violet-600 dark:text-violet-400 hover:underline"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Download
                      </a>
                    )}
                  </div>
                  {release.changes.length > 0 && (
                    <ul className="space-y-1 ml-4">
                      {release.changes.map((change, j) => (
                        <li
                          key={j}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-violet-500 mt-1.5">•</span>
                          {change}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </PageBody>
    </PageLayout>
  );
}
