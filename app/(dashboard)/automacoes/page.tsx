import { Zap } from 'lucide-react'
import { ComingSoon } from '@/components/ui/coming-soon'

export default function AutomacoesPage() {
  return (
    <ComingSoon
      icon={Zap}
      title="Automações"
      description="Fluxos automáticos com n8n e IA: geração de leads, follow-up automático, notificações e enriquecimento de dados."
      features={['Geração automática de leads por nicho', 'Follow-up automático por e-mail', 'Score IA em tempo real', 'Integração n8n + OpenAI']}
    />
  )
}
