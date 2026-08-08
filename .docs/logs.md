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

## 2026-08-08 — Inicialização da feature/auth e TDD
- Criada branch `feature/auth` para o desenvolvimento do módulo de autenticação.
- Instaladas as dependências de segurança e autenticação no backend: `@nestjs/passport`, `passport`, `passport-jwt`, `@nestjs/jwt` e `bcrypt` (além de tipos em `@types/`).
- Resolvido conflito de porta com outro banco local (porta alterada de 5433 para 5434).
- Corrigido o `schema.prisma` adicionando a propriedade `url` em `datasource db` para ler a variável de ambiente `DATABASE_URL`.
- Subidos os containers e aplicadas as migrações no banco local.
- Criada a estrutura de pastas e arquivos esqueleto para o módulo `/backend/src/modules/auth`: `AuthModule`, `AuthController`, `AuthService`, `LoginDto`, `JwtStrategy`, `JwtAuthGuard`, `RolesGuard` e o decorator `@Roles`.
- Escritos os testes de TDD unitários para `AuthService`, `AuthController` e `RolesGuard` mapeados aos requisitos de segurança.
- Executados os testes e verificado o estado de falha inicial controlada (fase Red do TDD) para posterior implementação das features.
- Corrigida a pasta do módulo para `src/modules/auth` (alinhando com a estrutura de arquitetura original).
- Implementadas as regras do `AuthService` (hashPassword com bcrypt, validateUser com verificação de isActive/senha/e-mail no banco, e geração de token JWT no login).
- Implementado o `RolesGuard` verificando perfis contra os metadados do reflector e do payload do JWT.
- Corrigidas as rotas e imports no `AppModule` e verificado que toda a suíte de testes agora passa em 100% (fase Green do TDD).

## 2026-08-08 — Implementação do Backend do Módulo de Cidadãos (Fase 2)
- Criada a estrutura de pastas e arquivos esqueleto para `/backend/src/modules/citizens`.
- Alterado o tipo do campo `perCapitaIncome` na tabela `social_profiles` no `schema.prisma` de `Decimal` para `String` para permitir armazenar os dados criptografados em repouso de forma adequada, e aplicada nova migração no banco de dados.
- Criados validadores personalizados para class-validator: `@IsCpf()` (validação matemática por dígito verificador), `@IsNis()` (validação matemática PIS/NIS/PASEP) e `@IsCep()` (validação de formato de 8 dígitos).
- Aplicadas validações de dados (CPF, NIS, CEP, Email) nos DTOs de criação de Cidadão (`CreateCitizenDto`).
- Escritos testes unitários e de validação em `citizens.service.spec.ts` e `create-citizen.dto.spec.ts`.
- Implementado helper de criptografia simétrica AES-256-CBC para criptografar campos sensíveis de `social_profiles` (`nis`, `perCapitaIncome`, `pcdDescription`) antes de persistir no banco, e descriptografá-los na leitura de forma transparente para a aplicação.
- Implementado `CitizensService` com métodos de CRUD (`create`, `update`, `findOne`) integrados com as regras de criptografia e validação.
- Confirmado que toda a suíte de testes do backend (incluindo autenticação e cidadãos) está passando com sucesso (100% verde).

## 2026-08-08 — Migração para Angular 22 e Instalação de Material/CDK (Frontend)
- Atualizados todos os pacotes `@angular/*` (core, common, compiler, forms, router, build, cli, compiler-cli) para a versão 22 estável.
- Instalados os pacotes `@angular/material` e `@angular/cdk` na versão 22 para a biblioteca de componentes.
- Atualizado o TypeScript para a versão `6.0.3` (exigência do compilador do Angular 22).
- Validada a compatibilidade do novo stack de build e testes do Angular 22, com build completo gerado e testes rodados via Vitest com 100% de sucesso.
- Adicionado o import do tema global `@angular/material/prebuilt-themes/indigo-pink.css` em `styles.css` para aplicar a estilização correta dos componentes do Angular Material.
- Adicionados os links de fontes externas do Google Fonts para a fonte `Roboto` e biblioteca de ícones `Material Icons` no `index.html` para corrigir a renderização de fontes e ícones.

## 2026-08-08 — Registro de Usuário do Sistema (Backend & Frontend)
- Criado endpoint `POST /api/auth/register` no backend NestJS para criação de usuários corporativos com hashing de senhas.
- Adicionados testes unitários para a rota de registro no `auth.service.spec.ts` e `auth.controller.spec.ts`.
- Criado componente de cadastro de usuário no frontend (`RegisterComponent`), incluindo validações reativas de e-mail e requisitos mínimos de senha.
- Adicionados testes unitários no frontend para o fluxo de registro e roteamento da página `/register`.
- Atualizados os layouts globais para ocultar o cabeçalho do PAT em páginas de autenticação (`/login` e `/register`).

## 2026-08-08 — Conclusão da Fase 2: CRUD de Cidadãos (Frontend)
- Criado o serviço `CitizensService` no frontend para consumir as rotas de listagem, visualização, criação, edição e remoção de cidadãos da API.
- Criada a página de listagem de cidadãos (`CitizenListComponent`) contendo busca em tempo real com debounce, listagem com Angular Material Table e paginação.
- Criado o formulário em abas (`CitizenFormComponent`) para cadastro e edição de dados, agrupando em três seções: Dados Básicos, Perfil Socioeconômico e Perfil Profissional.
- Integrado validações reativas customizadas de CPF (dígitos verificadores), NIS (algoritmo PIS/NIS) e CEP no formulário do cidadão.
- Adicionados os testes unitários correspondentes no frontend, totalizando **34 testes passando com 100% de sucesso** e build de produção validado.

## 2026-08-08 — Conclusão da Fase 3: Atendimentos e Sugestão por CPF
- Criado o módulo de Atendimentos (`AttendancesModule`) no backend NestJS, incluindo DTOs de validação do `serviceType` via class-validator.
- Adicionados testes unitários no backend para o fluxo de registro de atendimentos e listagem histórica por cidadão.
- Criado o serviço `AttendancesService` no frontend Angular para consumo da API de atendimentos.
- Criada a tela de Atendimento (`AttendanceFormComponent`) no frontend com fluxo de busca automática por CPF (sugestão/carregamento automático de cadastros de cidadãos existentes).
- Adicionados testes unitários no frontend para o formulário de atendimentos e suas ações de aceitar/rejeitar sugestão.
- Atualizadas as tabelas de listagem de cidadãos com busca avançada combinada por múltiplos filtros (bairro, escolaridade, PcD, faixa de renda).
- Todos os testes integrados estão passando (41 no backend e 42 no frontend) e builds validados com sucesso.








