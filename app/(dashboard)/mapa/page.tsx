import { Map } from 'lucide-react'
import { ComingSoon } from '@/components/ui/coming-soon'

export default function MapaPage() {
  return (
    <ComingSoon
      icon={Map}
      title="Mapa Logístico"
      description="Visualize a densidade industrial por região, oportunidades no mapa e leads georreferenciados. Em breve disponível."
      features={['Mapa de calor por região', 'Leads por estado e cidade', 'Rotas e cobertura logística', 'Integração com Google Maps']}
    />
  )
}
