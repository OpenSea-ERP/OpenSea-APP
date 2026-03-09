'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ShortcutEntry {
  key: string;
  description: string;
}

const SHORTCUT_SECTIONS: { title: string; shortcuts: ShortcutEntry[] }[] = [
  {
    title: 'Geral',
    shortcuts: [
      { key: 'N', description: 'Novo cartão' },
      { key: 'E', description: 'Editar cartão selecionado' },
      { key: '/', description: 'Abrir busca' },
      { key: '?', description: 'Mostrar atalhos' },
    ],
  },
  {
    title: 'Cartão',
    shortcuts: [
      { key: '1', description: 'Prioridade Urgente' },
      { key: '2', description: 'Prioridade Alta' },
      { key: '3', description: 'Prioridade Média' },
      { key: '4', description: 'Prioridade Baixa' },
      { key: 'L', description: 'Atribuir etiqueta' },
      { key: 'M', description: 'Atribuir membro' },
      { key: 'P', description: 'Definir prazo' },
      { key: 'D', description: 'Duplicar cartão' },
      { key: 'Delete', description: 'Arquivar cartão' },
    ],
  },
  {
    title: 'Navegação',
    shortcuts: [
      { key: '\u2191', description: 'Cartão acima' },
      { key: '\u2193', description: 'Cartão abaixo' },
      { key: '\u2190', description: 'Coluna anterior' },
      { key: '\u2192', description: 'Próxima coluna' },
      { key: 'Enter', description: 'Abrir cartão selecionado' },
    ],
  },
];

export function KeyboardShortcutsModal({
  open,
  onOpenChange,
}: KeyboardShortcutsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Atalhos de Teclado</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {SHORTCUT_SECTIONS.map(section => (
            <div key={section.title}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2">
                {section.title}
              </h3>
              <div className="space-y-1">
                {section.shortcuts.map(shortcut => (
                  <div
                    key={shortcut.key}
                    className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-muted/50"
                  >
                    <span className="text-sm">{shortcut.description}</span>
                    <kbd className="inline-flex items-center justify-center min-w-[28px] h-6 px-1.5 rounded border border-border bg-muted text-xs font-mono font-medium text-muted-foreground">
                      {shortcut.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
