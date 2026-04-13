/**
 * Print Queue Panel
 * Ícone na navbar com badge e dropdown de preview da fila
 */

'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Minus,
  Package,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  User,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { usePrintQueue } from '../context/print-queue-context';
import { useRemotePrinters } from '../hooks/use-remote-printers';
import type { PrintQueueItem } from '../types';
import { PrintJobTracker } from './print-job-tracker';
import { PrintQueueModal } from './print-queue-modal';

export function PrintQueuePanel() {
  const { state, itemCount, totalLabels, hasItems, actions } = usePrintQueue();
  const { hasOnlinePrinter } = useRemotePrinters();
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl relative"
            aria-label="Fila de impressao"
          >
            <Printer className="w-5 h-5" />
            {hasItems && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 w-5 h-5 bg-blue-500 text-white text-xs font-bold rounded-full flex items-center justify-center"
              >
                {itemCount > 9 ? '9+' : itemCount}
              </motion.div>
            )}
            {hasOnlinePrinter && !hasItems && (
              <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-500 rounded-full" />
            )}
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align="end"
          sideOffset={22}
          className="w-96 bg-white/95 dark:bg-slate-900/95 border-gray-200 dark:border-white/10 p-0"
        >
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-white/10">
            <div className="flex items-center justify-between">
              <DropdownMenuLabel className="p-0 text-lg font-bold">
                Fila de Impressao
              </DropdownMenuLabel>
              <div className="flex items-center gap-2">
                <Link href="/devices/remote-prints">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold"
                    variant="outline"
                  >
                    <Printer className="w-3 h-3 mr-1" />
                    Impressoras
                  </Button>
                </Link>
                <Link href="/print/studio">
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs font-semibold text-white bg-linear-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-sm"
                  >
                    <Sparkles className="w-3 h-3 mr-1" />
                    Studio
                  </Button>
                </Link>
              </div>
            </div>
          </div>

          {/* Queue List Preview */}
          <ScrollArea className="h-[300px]">
            {!hasItems ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center mb-3">
                  <Printer className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">
                  Fila vazia
                </p>
                <p className="text-xs text-gray-600 dark:text-white/60 text-center">
                  Adicione itens a fila de impressao para imprimir etiquetas.
                </p>
              </div>
            ) : (
              <div className="p-2">
                <AnimatePresence>
                  {state.items.slice(0, 5).map((queueItem, index) => (
                    <motion.div
                      key={queueItem.queueId}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <DropdownMenuItem
                        className="p-3 mb-2 cursor-pointer rounded-lg hover:bg-gray-100 dark:hover:bg-white/5"
                        onSelect={e => e.preventDefault()}
                      >
                        <div className="flex gap-3 w-full">
                          {/* Icon */}
                          <QueueItemIcon entityType={queueItem.entityType} />

                          {/* Content */}
                          <div className="flex-1 min-w-0">
                            <QueueItemInfo queueItem={queueItem} />
                            <div className="flex items-center justify-between mt-2">
                              {/* Quantity Controls */}
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    actions.updateCopies(
                                      queueItem.queueId,
                                      queueItem.copies - 1
                                    )
                                  }
                                  disabled={queueItem.copies <= 1}
                                  aria-label="Diminuir copias"
                                >
                                  <Minus className="w-3 h-3" />
                                </Button>
                                <span className="w-8 text-center text-sm font-medium">
                                  {queueItem.copies}
                                </span>
                                <Button
                                  variant="outline"
                                  size="icon"
                                  className="h-6 w-6"
                                  onClick={() =>
                                    actions.updateCopies(
                                      queueItem.queueId,
                                      queueItem.copies + 1
                                    )
                                  }
                                  aria-label="Aumentar copias"
                                >
                                  <Plus className="w-3 h-3" />
                                </Button>
                              </div>
                              {/* Remove Button */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  actions.removeFromQueue(queueItem.queueId)
                                }
                                className="h-6 px-2 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10"
                                aria-label="Remover item"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </DropdownMenuItem>
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Show more indicator */}
                {state.items.length > 5 && (
                  <div className="text-center py-2 text-xs text-gray-500 dark:text-white/50">
                    +{state.items.length - 5} mais item
                    {state.items.length - 5 !== 1 && 's'}
                  </div>
                )}
              </div>
            )}
          </ScrollArea>

          {/* Active Print Jobs */}
          <div className="px-2">
            <PrintJobTracker />
          </div>

          {/* Footer */}
          {hasItems && (
            <>
              <DropdownMenuSeparator />
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-xs text-gray-500 dark:text-white/50">
                  {totalLabels} etiqueta{totalLabels !== 1 && 's'}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={actions.clearQueue}
                  className="h-6 px-2 text-xs text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Limpar
                </Button>
              </div>
              <div className="px-2 pb-2">
                <Button
                  variant="default"
                  className="w-full justify-center text-sm font-medium bg-blue-500 hover:bg-blue-600"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Abrir fila de impressao
                </Button>
              </div>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Modal */}
      <PrintQueueModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  );
}

// ============================================
// HELPER COMPONENTS
// ============================================

function QueueItemIcon({
  entityType,
}: {
  entityType: PrintQueueItem['entityType'];
}) {
  const isEmployee = entityType === 'employee';
  const Icon = isEmployee ? User : Package;
  const gradient = isEmployee
    ? 'from-emerald-500 to-teal-600'
    : 'from-blue-500 to-blue-600';

  return (
    <div
      className={`w-10 h-10 rounded-xl bg-linear-to-br ${gradient} flex items-center justify-center shrink-0`}
    >
      <Icon className="w-5 h-5 text-white" />
    </div>
  );
}

function QueueItemInfo({ queueItem }: { queueItem: PrintQueueItem }) {
  if (queueItem.entityType === 'employee') {
    return (
      <>
        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
          {queueItem.employee.fullName}
        </h4>
        <p className="text-xs text-gray-600 dark:text-white/60 truncate">
          {queueItem.employee.position?.name ||
            queueItem.employee.registrationNumber}
        </p>
      </>
    );
  }

  return (
    <>
      <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
        {queueItem.item.productName || queueItem.product?.name || 'Item'}
      </h4>
      <p className="text-xs text-gray-600 dark:text-white/60 truncate">
        {queueItem.item.variantName ||
          queueItem.variant?.name ||
          queueItem.item.uniqueCode}
      </p>
    </>
  );
}
