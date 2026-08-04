#  Stack Tecnológica - SIPPAT

## Backend
- **Framework:** NestJS (Node.js)
- **Linguagem:** TypeScript
- **ORM:** Prisma ORM **v6.x** (ver nota abaixo sobre a v7)
- **Autenticação:** JWT + Passport.js (Bcrypt para senhas) — a implementar na Fase 2
- **Validação:** `class-validator` e `class-transformer`

## Frontend
- **Framework:** Angular 21 (versão estável mais recente disponível — ver nota abaixo)
- **Estilização:** TailwindCSS v4 + Angular Material (Angular Material será adicionado quando os primeiros componentes de formulário/tabela forem construídos, Fase 2)

## Banco de Dados
- **SGBD:** PostgreSQL
- **Suporte a Busca:** Indexes Trigram / B-Tree para buscas em sub-1.5s (RNF-001)

## Infraestrutura & Ferramentas
- **Containers:** Docker / Docker Compose (PostgreSQL local + banco isolado para testes)
- **Importação:** `xlsx` / `exceljs` para leitura do Excel (RF-007)
- **Documentação de API:** Swagger / OpenAPI (`@nestjs/swagger`)

## Testes (TDD - obrigatório conforme `.cursorrules`)
- **Backend Unitário/Integração:** Vitest + `@nestjs/testing`
- **Backend E2E:** Vitest + Supertest
- **Frontend Unitário:** Vitest
- **Frontend E2E:** Playwright
- **Performance/Carga (RNF-001):** k6 ou Artillery
- **Cobertura mínima para aprovar PR:** 90% (definido pela equipe)

> **Decisão da equipe:** substituído Jest por **Vitest** (tecnologia já familiar aos desenvolvedores) tanto no backend quanto no frontend. Não será utilizado Linter (ESLint) neste momento por se tratar de um projeto de escopo simples — reavaliar caso o projeto cresça em complexidade.

## Decisões Estruturais tomadas na Fase 1 (Setup)

- **Angular 21, não 24:** na data de implementação (ago/2026) a versão estável mais recente do Angular disponível no npm era a 21.x — a versão 24 citada originalmente neste documento ainda não existe. Atualizado para refletir a realidade; o projeto deve ser mantido atualizado para novas versões estáveis conforme lançadas.
- **Prisma ORM v6, não v7:** o Prisma 7 (mais recente no registro) exige *driver adapters* obrigatórios (`@prisma/adapter-pg`), um novo arquivo `prisma.config.ts` e gera um client **ESM-only**, o que conflita diretamente com a base CommonJS padrão do NestJS (gerada pelo Nest CLI) e adiciona complexidade significativa de configuração. Optou-se pela v6 (estável, amplamente documentada, mesma API `schema.prisma` com `datasource.url` direto) por ser mais simples e compatível com o restante do stack — mais alinhado à decisão da equipe de manter o projeto simples (mesmo raciocínio usado para descartar o ESLint). Reavaliar a migração para v7 quando o ecossistema Nest+Prisma7 estiver mais maduro/documentado.
- **Vitest no frontend:** o Angular 21 já inclui suporte nativo a Vitest via `@angular/build:unit-test` (builder oficial do CLI), então não foi necessária nenhuma configuração manual — apenas a ausência do Karma/Jasmine, que nunca chegou a ser instalado.
- **Health check (`GET /api/health`):** endpoint criado para verificar rapidamente, via Swagger ou pelo próprio frontend, se a API e a conexão com o banco estão funcionando. Não estava nos requisitos originais, mas é uma prática recomendada de infraestrutura.