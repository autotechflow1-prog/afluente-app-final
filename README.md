# Operação Afluente

Sistema interno de gestão de operação de e-commerce (Bruno e equipe).

## Stack

- React 19 + Vite + TypeScript (strict)
- Tailwind CSS v3 + shadcn/ui
- React Router v7
- TanStack Query v5
- Supabase JS SDK v2
- Zustand

## Setup

```bash
# 1. Instale dependências
npm install

# 2. Configure variáveis de ambiente
cp .env .env.local
# Edite .env.local com suas credenciais Supabase

# 3. Execute o SQL no Supabase Studio
# Arquivo: supabase/schema.sql

# 4. Inicie o servidor de desenvolvimento
npm run dev
```

## Variáveis de ambiente

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

## Módulos

| Rota | Módulo |
|------|--------|
| `/produtos` | Tabela de produtos com toggle ativo_frontend e filtros por categoria |
| `/marketplace` | Status dos produtos por marketplace — checkboxes e preços inline |
| `/pedidos` | Dashboard analítico: KPIs, financeiro, canais, clientes, operacional, ranking SKUs |

## Banco de dados

Execute `supabase/schema.sql` no Supabase Studio.
Tabelas existentes (`bling_products`, `bling_pedidos`, `bling_pedido_itens`, `marketplaces`) **não** são recriadas.
O script cria: `produto_marketplace_status`, trigger `atualizado_em`, views analíticas.
