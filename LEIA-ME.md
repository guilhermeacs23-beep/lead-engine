# Lead Engine — CRM para Transportadoras

## Como rodar localmente

### 1. Instalar dependências
```bash
cd lead-engine
npm install
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.local.example .env.local
# Abra .env.local e preencha com suas chaves do Supabase
```

### 3. Rodar em desenvolvimento
```bash
npm run dev
```
Acesse: http://localhost:3000

---

## Estrutura do projeto

```
lead-engine/
├── app/
│   ├── (dashboard)/        ← Páginas protegidas com layout
│   │   ├── dashboard/      ← Dashboard com métricas
│   │   ├── pipeline/       ← Kanban board
│   │   └── leads/          ← Gerador de leads
│   ├── globals.css         ← Estilos globais + glassmorphism
│   └── layout.tsx          ← Root layout
├── components/
│   ├── kanban/             ← KanbanBoard, KanbanColumn, LeadCard
│   ├── layout/             ← AppShell, Sidebar, Topbar
│   └── ui/                 ← BgPanel e componentes reutilizáveis
├── lib/
│   ├── mock-data.ts        ← Dados de exemplo para desenvolvimento
│   ├── supabase.ts         ← Cliente Supabase
│   └── utils.ts            ← Funções utilitárias
├── store/
│   └── ui-store.ts         ← Estado global (tema de fundo)
└── types/
    └── index.ts            ← TypeScript types
```

## Próximos passos
1. Criar projeto no Supabase e preencher .env.local
2. Rodar as migrations SQL do banco
3. Configurar autenticação (Supabase Auth)
4. Conectar os componentes com dados reais
5. Implementar drag-and-drop no Kanban
6. Integrar OpenAI para score de leads
