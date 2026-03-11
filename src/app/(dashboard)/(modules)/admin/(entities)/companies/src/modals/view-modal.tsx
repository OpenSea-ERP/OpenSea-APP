import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { Company } from '@/types/hr';
import { Building2, Calendar, Mail, Phone, RefreshCcwDot } from 'lucide-react';

interface ViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  company: Company | null;
}

export function ViewModal({ isOpen, onClose, company }: ViewModalProps) {
  if (!company) return null;

  return (
    <Dialog open={isOpen} onOpenChange={open => !open && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto [&>button]:hidden">
        <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b">
          <DialogTitle className="text-lg font-semibold">
            <div className="flex gap-4 items-center">
              <div className="flex items-center justify-center text-white shrink-0 bg-linear-to-br from-emerald-500 to-teal-600 p-2 rounded-lg">
                <Building2 className="h-5 w-5" />
              </div>
              <div className="flex-col flex">
                <span className="text-xs text-slate-500/50">Empresa</span>
                {company.legalName.length > 32
                  ? `${company.legalName.substring(0, 32)}...`
                  : company.legalName}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Dados Cadastrais</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Razão Social</p>
                <p className="text-base mt-1">{company.legalName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nome Fantasia</p>
                <p className="text-base mt-1">{company.tradeName || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">CNPJ</p>
                <p className="text-base mt-1">{company.cnpj}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-base mt-1">{company.status}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Regime Tributário
                </p>
                <p className="text-base mt-1">{company.taxRegime || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Natureza Jurídica
                </p>
                <p className="text-base mt-1">{company.legalNature || '—'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Inscrição Estadual
                </p>
                <p className="text-base mt-1">
                  {company.stateRegistration || '—'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Inscrição Municipal
                </p>
                <p className="text-base mt-1">
                  {company.municipalRegistration || '—'}
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Contato</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>{company.email || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{company.phoneMain || '—'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>{company.phoneAlt || '—'}</span>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Metadados</h3>
            <div className="space-y-3">
              {company.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  <span className="text-gray-500">Criada em:</span>
                  <span className="font-medium">
                    {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
              {company.updatedAt && company.updatedAt !== company.createdAt && (
                <div className="flex items-center gap-2 text-sm">
                  <RefreshCcwDot className="h-4 w-4 text-yellow-500" />
                  <span className="text-gray-500">Atualizada em:</span>
                  <span className="font-medium">
                    {new Date(company.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
