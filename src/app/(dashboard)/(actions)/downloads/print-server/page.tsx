/**
 * Print Server Download Page
 * Página de download do OpenSea Print Server
 * Busca versão, links e changelog automaticamente do GitHub Releases
 */

'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  PageBody,
  PageHeader,
  PageLayout,
} from '@/components/layout/page-layout';
import { PageActionBar } from '@/components/layout/page-action-bar';
import { usePermissions } from '@/hooks/use-permissions';
import { cn } from '@/lib/utils';
import {
  CheckCircle,
  ChevronDown,
  ChevronUp,
  Download,
  HelpCircle,
  History,
  Loader2,
  Monitor,
  Printer,
  QrCode,
  Server,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaWindows, FaApple, FaLinux } from 'react-icons/fa';

const GITHUB_REPO = 'OpenSea-ERP/OpenSea-PrintServer';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

// =============================================================================
// TYPES
// =============================================================================

interface GitHubAsset {
  name: string;
  browser_download_url: string;
  size: number;
}

interface GitHubRelease {
  tag_name: string;
  name: string;
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
  assets: {
    windows?: string;
    mac?: string;
    linux?: string;
  };
}

// =============================================================================
// GITHUB DATA FETCHING
// =============================================================================

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

function findAssetUrl(
  assets: GitHubAsset[],
  pattern: RegExp
): string | undefined {
  return assets.find(a => pattern.test(a.name))?.browser_download_url;
}

function parseRelease(release: GitHubRelease): ParsedRelease {
  const version = release.tag_name.replace(/^v/, '');
  return {
    version,
    date: release.published_at,
    changes: parseReleaseBody(release.body),
    assets: {
      windows: findAssetUrl(release.assets, /\.exe$/i),
      mac: findAssetUrl(release.assets, /\.dmg$/i),
      linux: findAssetUrl(release.assets, /\.AppImage$/i),
    },
  };
}

function useGitHubReleases() {
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
          .map(parseRelease);
        setReleases(parsed);
      })
      .catch(err => {
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);

  const latest = releases[0] ?? null;
  return { releases, latest, loading, error };
}

// =============================================================================
// STATIC DATA
// =============================================================================

interface PlatformConfig {
  id: string;
  name: string;
  icon: React.ElementType;
  assetKey: 'windows' | 'mac' | 'linux';
  activeColor: string;
  activeHover: string;
}

const PLATFORM_CONFIGS: PlatformConfig[] = [
  {
    id: 'windows',
    name: 'Windows',
    icon: FaWindows,
    assetKey: 'windows',
    activeColor: 'bg-blue-600 dark:bg-blue-600',
    activeHover: 'hover:bg-blue-700 dark:hover:bg-blue-700',
  },
  {
    id: 'macos',
    name: 'macOS',
    icon: FaApple,
    assetKey: 'mac',
    activeColor: 'bg-violet-600 dark:bg-violet-600',
    activeHover: 'hover:bg-violet-700 dark:hover:bg-violet-700',
  },
  {
    id: 'linux',
    name: 'Linux',
    icon: FaLinux,
    assetKey: 'linux',
    activeColor: 'bg-amber-600 dark:bg-amber-600',
    activeHover: 'hover:bg-amber-700 dark:hover:bg-amber-700',
  },
];

const INSTALL_STEPS = [
  {
    icon: Download,
    title: 'Baixe o instalador',
    description:
      'Faça o download do Print Server para o seu sistema operacional.',
  },
  {
    icon: Monitor,
    title: 'Execute no computador',
    description: 'Abra o programa e siga as instruções de instalação.',
  },
  {
    icon: QrCode,
    title: 'Digite o código',
    description: 'O código aparece ao registrar um computador no painel.',
  },
  {
    icon: CheckCircle,
    title: 'Pronto!',
    description: 'As impressoras aparecerão automaticamente.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'O que é o OpenSea Print Server?',
    answer:
      'É um programa leve que roda no computador onde as impressoras estão conectadas. Ele permite que você envie impressões remotamente a partir de qualquer dispositivo conectado ao OpenSea.',
  },
  {
    question: 'Preciso manter o programa aberto o tempo todo?',
    answer:
      'Sim, o Print Server precisa estar em execução para receber comandos de impressão. Recomendamos ativar a opção "Iniciar com o computador" para que ele inicie automaticamente.',
  },
  {
    question: 'Posso instalar em mais de um computador?',
    answer:
      'Sim! Você pode instalar o Print Server em quantos computadores quiser. Cada um aparecerá como um agente separado no painel de Impressoras Remotas.',
  },
  {
    question: 'O programa consome muitos recursos?',
    answer:
      'Não. O Print Server é muito leve e consome pouquíssima memória e processamento. Ele fica em segundo plano sem impactar o desempenho do computador.',
  },
  {
    question: 'Como faço para atualizar?',
    answer:
      'O Print Server verifica atualizações automaticamente. Quando uma nova versão estiver disponível, você receberá uma notificação para atualizar com um clique.',
  },
  {
    question: 'Funciona com qualquer impressora?',
    answer:
      'Sim, o Print Server detecta todas as impressoras instaladas no sistema operacional, incluindo impressoras USB, de rede e virtuais (como "Imprimir em PDF").',
  },
  {
    question: 'E se o computador desligar?',
    answer:
      'O status do servidor ficará como "Offline" no painel. As impressões enviadas enquanto o servidor estiver offline serão enfileiradas e processadas quando ele voltar a ficar online.',
  },
];

// =============================================================================
// SECTION HEADER
// =============================================================================

function SectionHeader({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Icon className="h-5 w-5 text-foreground" />
        <div>
          <h3 className="text-base font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <div className="border-b border-border" />
    </div>
  );
}

// =============================================================================
// DOWNLOAD BUTTON
// =============================================================================

function DownloadButton({
  config,
  version,
  href,
  loading,
}: {
  config: PlatformConfig;
  version: string | null;
  href: string | null;
  loading: boolean;
}) {
  const isAvailable = !!href;
  const PlatformIcon = config.icon;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-lg text-white transition-colors',
        loading
          ? 'bg-gray-300 dark:bg-gray-700 cursor-wait opacity-60'
          : isAvailable
            ? `${config.activeColor} ${config.activeHover} cursor-pointer`
            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60'
      )}
    >
      <PlatformIcon className="w-6 h-6 shrink-0" />
      <div className="text-left">
        <p className="text-sm font-semibold leading-tight">
          Download para {config.name}
        </p>
        <p className="text-xs opacity-80 leading-tight mt-0.5">
          {loading
            ? 'Carregando...'
            : isAvailable
              ? `Versão atual: ${version}`
              : 'Disponível em Breve'}
        </p>
      </div>
    </div>
  );

  if (isAvailable && href) {
    return (
      <a href={href} download>
        {content}
      </a>
    );
  }

  return content;
}

// =============================================================================
// PAGE
// =============================================================================

export default function PrintServerDownloadPage() {
  const { hasPermission } = usePermissions();
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const { releases, latest, loading, error } = useGitHubReleases();

  const currentVersion = latest?.version ?? null;

  const visibleReleases = releases.slice(0, 3);

  return (
    <PageLayout>
      <PageHeader>
        <PageActionBar
          breadcrumbItems={[
            { label: 'Dispositivos', href: '/devices' },
            { label: 'Impressoras Remotas', href: '/devices/remote-prints' },
            { label: 'Download Print Server' },
          ]}
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Hero Banner */}
        <Card className="relative overflow-hidden p-4 sm:p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-blue-500 to-indigo-600">
                <Server className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                OpenSea Print Server
              </h1>
            </div>

            <p className="text-sm sm:text-lg text-gray-600 dark:text-white/60 mb-6 max-w-2xl">
              Conecte as impressoras do seu computador ao OpenSea e imprima
              remotamente de qualquer dispositivo.
            </p>

            <div className="flex flex-wrap gap-3">
              {PLATFORM_CONFIGS.map(config => (
                <DownloadButton
                  key={config.id}
                  config={config}
                  version={currentVersion}
                  href={latest?.assets[config.assetKey] ?? null}
                  loading={loading}
                />
              ))}
            </div>

            {error && (
              <p className="text-xs text-rose-500 mt-3">
                Erro ao carregar releases: {error}
              </p>
            )}
          </div>
        </Card>

        {/* Install Steps */}
        <section>
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-6">
            <SectionHeader
              icon={Download}
              title="Como instalar"
              subtitle="Siga os passos abaixo para configurar o Print Server"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              {INSTALL_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-3">
                    <step.icon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold flex items-center justify-center mb-2">
                    {i + 1}
                  </div>
                  <p className="font-medium text-sm text-gray-900 dark:text-white">
                    {step.title}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {step.description}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* FAQ */}
        <section>
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-6">
            <SectionHeader
              icon={HelpCircle}
              title="Perguntas Frequentes"
              subtitle="Dúvidas comuns sobre o Print Server"
            />
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 mt-6">
              {FAQ_ITEMS.map((item, i) => (
                <div key={i} className="py-3 first:pt-0 last:pb-0">
                  <button
                    type="button"
                    className="flex items-center justify-between w-full text-left"
                    onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                  >
                    <span className="text-sm font-medium text-gray-900 dark:text-white pr-4">
                      {item.question}
                    </span>
                    {expandedFaq === i ? (
                      <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                    )}
                  </button>
                  {expandedFaq === i && (
                    <p className="text-sm text-muted-foreground mt-2 pr-8">
                      {item.answer}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </section>

        {/* Changelog */}
        <section>
          <Card className="bg-white dark:bg-slate-800/60 border border-border p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <History className="h-5 w-5 text-foreground" />
                  <div>
                    <h3 className="text-base font-semibold">Changelog</h3>
                    <p className="text-sm text-muted-foreground">
                      Últimas atualizações do Print Server
                    </p>
                  </div>
                </div>
                <Link href="/downloads/print-server/changelog">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 px-3 text-xs"
                  >
                    Ver todos
                  </Button>
                </Link>
              </div>
              <div className="border-b border-border" />
            </div>
            <div className="space-y-6 mt-6">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                </div>
              ) : visibleReleases.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nenhuma versão publicada.
                </p>
              ) : (
                visibleReleases.map((release, idx) => (
                  <div key={release.version} className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs font-mono',
                          idx === 0
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-300 dark:border-blue-500/20'
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
                      {release.assets.windows && idx > 0 && (
                        <a
                          href={release.assets.windows}
                          className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
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
                            <span className="text-blue-500 mt-1.5">•</span>
                            {change}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </Card>
        </section>
      </PageBody>
    </PageLayout>
  );
}
