import { Settings } from 'lucide-react'
import { ComingSoon } from '@/components/ui/coming-soon'

export default function ConfiguracoesPage() {
  return (
    <ComingSoon
      icon={Settings}
      title="Configurações"
      description="Gerencie usuários, permissões, integrações de API, plano e personalização da plataforma."
      features={['Usuários e permissões', 'Integração LinkedIn / Google / CNPJ', 'Personalização da plataforma', 'Plano e faturamento']}
    />
  )
}
