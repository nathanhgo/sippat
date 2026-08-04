# Histórico de Modificações

## 2026-08-03 — Planejamento inicial do projeto
- Analisados `.cursorrules` e todos os arquivos em `.docs/` para entender o escopo do SIPPAT.
- Preenchido `questions.md` com 15 perguntas organizadas por tema (escopo/negócio, algoritmo de vulnerabilidade, LGPD/segurança, dados/importação, técnico) para validar decisões antes da implementação.
- Preenchido `tests.md` com plano de testes completo em TDD (unitários, integração/E2E backend e frontend, performance e segurança), mapeado aos códigos RF/RNF de `requirements.md`.
- Corrigida inconsistência entre `.cursorrules` (citava "TypeORM/Prisma") e `tech_stack.md` (definia apenas Prisma) — `.cursorrules` ajustado para citar somente Prisma ORM.
- Adicionada seção de ferramentas de teste em `tech_stack.md` (Jest, Supertest, Jasmine/Karma, Cypress/Playwright, k6/Artillery, ESLint/Prettier), já que o TDD é obrigatório mas nenhuma stack de teste estava definida.
- Completados timestamps faltantes em `database_schema.md` (`professional_profiles`, `attendances`) e proposta a tabela `audit_logs` para trilha de auditoria LGPD (RNF-003), além de observações sobre soft delete/anonimização e consentimento.
- Atualizado `architecture.md` com módulo de auditoria proposto e convenção de organização de testes.
- Reestruturado `to_do.md` para intercalar explicitamente etapas de "escrever testes" antes de cada etapa de implementação, alinhado à regra de TDD do `.cursorrules`, e adicionada Fase 0 (planejamento, já concluída).

## 2026-08-03 — Propagação das respostas de `questions.md`
- **Removida a feature de Mapeamento de Vulnerabilidade** (antigo RF-006) de todo o projeto por decisão em reunião: removida de `requirements.md`, `database_schema.md` (coluna `vulnerability_score`), `architecture.md` (fluxo do `VulnerabilityCalculatorService`), `visual.md` (badges de vulnerabilidade), `to_do.md` (antiga Fase 3) e `tests.md`. Movida para uma seção de Backlog em `to_do.md` para eventual retomada futura.
- **Renumerados** os requisitos funcionais: RF-007 (Reutilização) → **RF-006**; RF-008 (Importação) → **RF-007**. Referências cruzadas atualizadas em `tech_stack.md`, `to_do.md` e `tests.md`.
- **RF-001** atualizado para incluir Gênero, Raça/Cor e Estado Civil como campos obrigatórios; adicionadas as colunas correspondentes (ENUMs) em `citizens` no `database_schema.md`.
- **RF-004 / `attendances`:** `service_type` definido como ENUM fechado com valores iniciais (Encaminhamento, Orientação, Cadastro de Vaga, Atualização Cadastral, Emissão de Documento, Outro), sujeito a expansão futura.
- **RF-006 (Reutilização):** detalhado o fluxo de sugestão automática de cadastro por CPF, com opção de aceitar, recusar ou editar, em `requirements.md` e `architecture.md`.
- **RF-007 (Importação):** detalhada a estratégia de tratamento de CPF duplicado (sobrescrever/ignorar, linha a linha ou em massa) em `requirements.md` e `tests.md`.
- **Trilha de auditoria confirmada** (nova `RNF-005`): retenção de 3 meses, com job de expurgo — detalhado em `database_schema.md`, `architecture.md` (novo módulo `data-retention`) e `tests.md`.
- **Política de retenção/anonimização confirmada** (nova `RNF-006`): cadastros sem atendimento há mais de 1 ano devem ser anonimizados — adicionado campo `deleted_at` em `citizens`, job de anonimização e ressalva para validação jurídica do prazo.
- **Consentimento LGPD:** definido como processo fora do sistema (verbal/assinatura em papel) — removida a proposta de campos `consent_at`/`consent_version` do `database_schema.md`.
- **Stack de testes atualizada:** Jest substituído por **Vitest** (backend e frontend); confirmado **Playwright** para E2E do frontend; cobertura mínima de merge elevada para **90%** — atualizado em `tech_stack.md` e `tests.md`.
- **Removido o uso de Linter (ESLint)** do projeto por decisão da equipe (escopo simples) — removido de `tech_stack.md`, `to_do.md` e `tests.md`.
- Perfis de acesso (`ADMIN`/`ATTENDANT`), ausência de multi-tenant e ausência de ambiente de staging foram confirmados sem necessidade de alteração nos documentos.

## 2026-08-04 — Fase 1: Setup e Infraestrutura implementada
- Criado `docker-compose.yml` na raiz com dois serviços Postgres 16: `postgres` (dev, volume persistente) e `postgres_test` (testes, dados em `tmpfs`, efêmeros).
- Inicializado o backend NestJS em `backend/` (TypeScript). Removidos Jest e ESLint (decisão da equipe); configurado **Vitest** para testes unitários (`src/**/*.spec.ts`) e E2E (`test/**/*.e2e-spec.ts`, com Supertest).
- Configurado **Prisma ORM v6** (não v7 — ver justificativa em `tech_stack.md`) com o schema completo de `database_schema.md` (`users`, `citizens`, `social_profiles`, `professional_profiles`, `attendances`, `audit_logs` e todos os ENUMs). Migration inicial `20260804003015_init` criada e aplicada nos bancos de dev e de testes.
- Escritos e validados (TDD) os testes de constraints do schema (`test/schema-constraints.e2e-spec.ts`): unicidade de CPF/e-mail/NIS, campos obrigatórios (Gênero/Raça-Cor/Estado Civil) e ENUM fechado de `service_type`.
- Criado módulo de saúde (`GET /api/health`) com teste unitário e E2E (TDD Red→Green), verificando conexão real com o banco via Prisma.
- Configurado Swagger/OpenAPI (`SwaggerModule`) disponível em `/docs`; prefixo global `/api` e `ValidationPipe` global habilitados em `main.ts`.
- Inicializado o frontend Angular 21 em `frontend/` (não Angular 24 — versão inexistente no momento, ver `tech_stack.md`) com TailwindCSS v4. O Vitest já vem nativo no builder do Angular 21 (`@angular/build:unit-test`), sem necessidade de configuração manual nem de Karma/Jasmine.
- Configurado Playwright para E2E do frontend (`frontend/e2e/`), com `webServer` automático apontando para `ng serve`.
- Criado `HealthService` no frontend (com testes unitários via `HttpTestingController`) e tela inicial simples exibindo o status de conexão com a API, para validação visual rápida da Fase 1.
- Criados `.gitignore` na raiz, no backend e complementado no frontend.
- Criado `.vscode/tasks.json` na raiz com tasks acessíveis via `Ctrl+Shift+P` → "Tasks: Run Task" para: subir/derrubar/resetar o banco, subir backend/frontend em modo dev, rodar testes (unitários, E2E, cobertura) de backend e frontend, gerar client/rodar migrations do Prisma (dev e testes) e abrir o Prisma Studio, além de tasks compostas ("Setup: Subir tudo", "Testes: Rodar tudo").
- **Decisões estruturais registradas em `tech_stack.md`:** uso de Angular 21 (não 24) e Prisma 6 (não 7, por conflito ESM/driver-adapter obrigatório com a base CommonJS do NestJS).
- Validação final: 12 testes de backend (3 unitários + 9 E2E) e 7 testes de frontend (5 unitários + 2 E2E) passando; `docker compose up`, migrations, `npm run start:dev` (backend) e Swagger em `http://localhost:3000/docs` testados manualmente com sucesso.
