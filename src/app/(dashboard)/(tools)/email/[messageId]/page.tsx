'use client';

import { EmailHtmlBody } from '@/components/email/email-html-body';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { emailService } from '@/services/email';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { use } from 'react';

interface EmailMessagePageProps {
  params: Promise<{ messageId: string }>;
}

function stripGlobalEmailStyles(html: string): string {
  return html
    .replace(/<style[\s\S]*?>[\s\S]*?<\/style>/gi, '')
    .replace(/<link[^>]*?>/gi, '')
    .replace(/<meta[^>]*?>/gi, '')
    .replace(/<\/?(?:html|head|body)[^>]*?>/gi, '');
}

export default function EmailMessagePage({ params }: EmailMessagePageProps) {
  const { messageId } = use(params);

  const messageQuery = useQuery({
    queryKey: ['email', 'message', messageId],
    queryFn: () => emailService.getMessage(messageId),
    enabled: Boolean(messageId),
  });

  if (messageQuery.isLoading) {
    return (
      <div className="p-6 text-sm text-muted-foreground">
        Carregando mensagem...
      </div>
    );
  }

  if (!messageQuery.data?.message) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Mensagem não encontrada</CardTitle>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" size="sm">
              <Link href="/email">Voltar para inbox</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { message } = messageQuery.data;
  const safeBodyHtml = message.bodyHtmlSanitized
    ? stripGlobalEmailStyles(message.bodyHtmlSanitized)
    : null;

  return (
    <div className="p-6 space-y-4">
      <Button asChild variant="outline" size="sm">
        <Link href="/email">Voltar para inbox</Link>
      </Button>

      <Card>
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{message.subject}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                De: {message.fromName || message.fromAddress}
              </p>
              <p className="text-sm text-muted-foreground">
                Para: {message.toAddresses.join(', ')}
              </p>
            </div>
            <Badge variant={message.isRead ? 'outline' : 'secondary'}>
              {message.isRead ? 'Lida' : 'Não lida'}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {safeBodyHtml ? (
            <EmailHtmlBody html={safeBodyHtml} messageId={message.id} />
          ) : (
            <pre className="text-sm whitespace-pre-wrap">
              {message.bodyText || 'Sem conteúdo'}
            </pre>
          )}

          {message.attachments?.length ? (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Anexos</h3>
              <ul className="space-y-1">
                {message.attachments.map(attachment => (
                  <li
                    key={attachment.id}
                    className="text-sm text-muted-foreground"
                  >
                    {attachment.filename} ({Math.round(attachment.size / 1024)}{' '}
                    KB)
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
