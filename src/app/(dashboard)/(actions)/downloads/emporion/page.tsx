/**
 * Emporion Download Page
 * Página de download do OpenSea Emporion (PDV desktop)
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
  QrCode,
  ShoppingCart,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { FaWindows } from 'react-icons/fa';

const GITHUB_REPO = 'OpenSea-ERP/OpenSea-Emporion';
const GITHUB_API = `https://api.github.com/repos/${GITHUB_REPO}/releases`;

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
  windowsUrl?: string;
  windowsSize?: number;
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

function parseRelease(release: GitHubRelease): ParsedRelease {
  const windowsAsset = release.assets.find(a => /\.exe$/i.test(a.name));
  return {
    version: release.tag_name.replace(/^v/, ''),
    date: release.published_at,
    changes: parseReleaseBody(release.body),
    windowsUrl: windowsAsset?.browser_download_url,
    windowsSize: windowsAsset?.size,
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

const INSTALL_STEPS = [
  {
    icon: Download,
    title: 'Baixe o instalador',
    description:
      'Faça o download do instalador para Windows na máquina do PDV.',
  },
  {
    icon: Monitor,
    title: 'Execute no computador',
    description:
      'Duplo-clique no .exe e siga o assistente. Aceite o caminho default.',
  },
  {
    icon: QrCode,
    title: 'Pareie o terminal',
    description:
      'Use o código de 6 dígitos gerado em Vendas › Terminais POS no painel.',
  },
  {
    icon: CheckCircle,
    title: 'Pronto!',
    description: 'Configure impressora, PIN admin e comece a vender.',
  },
];

const FAQ_ITEMS = [
  {
    question: 'O que é o OpenSea Emporion?',
    answer:
      'É o aplicativo desktop de PDV (ponto de venda) do OpenSea. Roda no Windows da loja, opera 100% offline (sincroniza quando volta a internet) e substitui o PDV web em hardware fraco ou pontos com conexão instável.',
  },
  {
    question: 'Preciso de internet para vender?',
    answer:
      'Não para o ato da venda. O Emporion é offline-first: vendas, sangrias e fechamentos ficam na fila local até a internet voltar e sincronizar. A internet é necessária no pareamento inicial e para emitir nota fiscal NFC-e em tempo real.',
  },
  {
    question: 'Posso instalar em mais de uma máquina?',
    answer:
      'Sim. Cada máquina representa um terminal POS separado, com pareamento individual. Você gerencia todos eles em Vendas › Terminais POS.',
  },
  {
    question: 'O programa abre sozinho com o Windows?',
    answer:
      'Sim, por padrão o instalador habilita "iniciar com o Windows". Quando você fecha a janela, o app vai para a bandeja do sistema (tray) — só sai de verdade pelo menu "Sair" da tray.',
  },
  {
    question: 'Como faço para atualizar?',
    answer:
      'O Emporion verifica atualizações automaticamente após abrir. Quando uma nova versão for publicada, aparece um banner no topo do app com "Reiniciar e instalar". Configurações, vendas em fila e pareamento são preservados.',
  },
  {
    question: 'Funciona com qualquer impressora térmica?',
    answer:
      'Sim, qualquer impressora reconhecida pelo Windows funciona (Bematech MP-4200, Elgin i9, etc.). Configure no setup inicial; o app imprime via driver do Windows.',
  },
  {
    question: 'O computador desligou no meio do expediente, perdi vendas?',
    answer:
      'Não. As vendas são gravadas localmente em SQLite antes de serem enviadas ao servidor. Ao reabrir, a fila de sincronização processa o que ficou pendente.',
  },
  {
    question: 'O alerta do SmartScreen ao instalar é normal?',
    answer:
      'Sim, enquanto o instalador não for assinado com certificado EV, o Windows mostra "O Windows protegeu o seu PC". Clique em "Mais informações" › "Executar assim mesmo". O aviso some quando publicarmos versões assinadas.',
  },
];

function formatBytes(bytes?: number): string {
  if (!bytes) return '';
  const mb = bytes / 1024 / 1024;
  return `${mb.toFixed(1)} MB`;
}

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

function DownloadButton({
  version,
  href,
  size,
  loading,
}: {
  version: string | null;
  href: string | null;
  size?: number;
  loading: boolean;
}) {
  const isAvailable = !!href;

  const content = (
    <div
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-lg text-white transition-colors',
        loading
          ? 'bg-gray-300 dark:bg-gray-700 cursor-wait opacity-60'
          : isAvailable
            ? 'bg-violet-600 hover:bg-violet-700 dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer'
            : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed opacity-60'
      )}
    >
      <FaWindows className="w-6 h-6 shrink-0" />
      <div className="text-left">
        <p className="text-sm font-semibold leading-tight">
          Download para Windows
        </p>
        <p className="text-xs opacity-80 leading-tight mt-0.5">
          {loading
            ? 'Carregando...'
            : isAvailable
              ? `Versão atual: ${version}${size ? ` · ${formatBytes(size)}` : ''}`
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

export default function EmporionDownloadPage() {
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
            { label: 'Terminais POS', href: '/devices/pos-terminals' },
            { label: 'Download Emporion' },
          ]}
        />
      </PageHeader>

      <PageBody spacing="gap-6">
        {/* Hero Banner */}
        <Card className="relative overflow-hidden p-4 sm:p-8 md:p-12 bg-white/95 dark:bg-white/5 border-gray-200 dark:border-white/10">
          <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full opacity-80 -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-indigo-500/10 rounded-full opacity-80 translate-y-1/2 -translate-x-1/2" />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-linear-to-br from-violet-500 to-indigo-600">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
                OpenSea Emporion
              </h1>
            </div>

            <p className="text-sm sm:text-lg text-gray-600 dark:text-white/60 mb-6 max-w-2xl">
              PDV desktop offline-first para Windows. Vende sem internet,
              sincroniza quando voltar e emite NFC-e direto da máquina da loja.
            </p>

            <div className="flex flex-wrap gap-3">
              <DownloadButton
                version={currentVersion}
                href={latest?.windowsUrl ?? null}
                size={latest?.windowsSize}
                loading={loading}
              />
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
              subtitle="Siga os passos abaixo para configurar um terminal POS"
            />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
              {INSTALL_STEPS.map((step, i) => (
                <div key={i} className="flex flex-col items-center text-center">
                  <div className="w-12 h-12 rounded-xl bg-violet-100 dark:bg-violet-500/10 flex items-center justify-center mb-3">
                    <step.icon className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                  </div>
                  <div className="w-6 h-6 rounded-full bg-violet-500 text-white text-xs font-bold flex items-center justify-center mb-2">
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
              subtitle="Dúvidas comuns sobre o Emporion"
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
                      Últimas atualizações do Emporion
                    </p>
                  </div>
                </div>
                <Link href="/downloads/emporion/changelog">
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
                      {release.windowsUrl && idx > 0 && (
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
                ))
              )}
            </div>
          </Card>
        </section>
      </PageBody>
    </PageLayout>
  );
}
