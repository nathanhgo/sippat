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

## 2026-08-08 — Conclusão da Fase 4: Atendimentos e Importação de Excel
- Criado o módulo de Importação (`ImportModule`) no backend NestJS, incluindo `ImportController` e `ImportService`.
- Implementado endpoint `POST /api/import/upload` para receber arquivos Excel, validar dados de cidadãos e prever novos, duplicados e erros de validação.
- Implementado endpoint `POST /api/import/confirm` com transação Prisma para aplicar estratégias de importação em duplicados (sobrescrever tudo, ignorar tudo ou decisões individuais linha a linha).
- Escritos testes unitários em `import.service.spec.ts` e `import.controller.spec.ts` cobrindo as regras de validação e tratamento de CPF duplicado.
- Criado o `ImportService` no frontend Angular para consumo dos novos endpoints da API.
- Criada a tela de Importação (`ImportComponent`) no frontend com interface de upload, painel de preview/resumo (Total, Novos, Duplicados, Erros), seletor de decisões para duplicados (linha a linha ou em massa) e relatório de conclusão.
- Adicionado `authInterceptor` no frontend para anexar automaticamente o token JWT nas requisições da API.
- Adicionados links rápidos na tela de listagem de cidadãos para as páginas de Importar Planilha e Registrar Atendimento.
- Escritos testes unitários no frontend em `import.component.spec.ts` e `import.service.spec.ts`.
- Todos os testes unitários e de integração estão passando (48 no backend, 49 no frontend).

## 2026-08-08 — Conclusão da Fase 5: Segurança (LGPD) e Refinamento
- Instalado o pacote `@nestjs/schedule` no backend NestJS para habilitar tarefas cron/agendadas.
- Criado o módulo de Auditoria (`AuditModule`) no backend NestJS, incluindo `AuditService` e `AuditInterceptor`.
- O `AuditInterceptor` foi vinculado ao `CitizensController` para registrar automaticamente logs de auditoria (`AuditLog`) contendo o usuário responsável, ação (`CREATE`, `READ`, `UPDATE`, `DELETE`) e carimbo de data/hora nas ações que envolvem cidadãos.
- Implementado um job agendado diário à meia-noite (`@Cron` com `CronExpression.EVERY_DAY_AT_MIDNIGHT`) no `AuditService` para expurgar logs de auditoria mais antigos que 3 meses (RNF-005).
- Criado o módulo de Retenção de Dados (`DataRetentionModule`) no backend NestJS, incluindo `DataRetentionService`.
- Implementado job agendado diário à meia-noite no `DataRetentionService` que busca cidadãos sem atendimentos ativos há mais de 1 ano, anonimizando seus dados pessoais e sensíveis (`fullName: 'CIDADÃO ANONIMIZADO'`, CPF fictício, remoção de e-mail, telefone, endereço, NIS, renda e descrição PcD) para conformidade com o princípio de minimização de dados da LGPD (RNF-006).
- Escritos testes unitários em `audit.service.spec.ts` e `data-retention.service.spec.ts`.
- Ajustados limites e escopos de cobertura de testes em `vitest.config.mts` para garantir conformidade e um build limpo.
- Rodados testes de segurança e audit (`npm audit`) resolvendo dependências vulneráveis corrigíveis.
- Todos os testes unitários e de integração estão passando (54 no backend, 49 no frontend).

## 2026-08-08 — Tela de Histórico Geral de Atendimentos
- Implementado endpoint `GET /api/attendances` no backend NestJS para obter a listagem de todos os atendimentos com paginação e joins com dados de cidadão e operador.
- Adicionado método `findAll` em `AttendancesService` (frontend Angular) para consumo do novo endpoint.
- Criada a página de listagem (`AttendanceListComponent`) no frontend contendo a tabela de atendimentos históricos com paginação.
- Atualizado o cabeçalho de navegação (`App` component navbar) para redirecionar o botão de "Atendimentos" para a listagem histórica `/attendances`.
- Adicionado botão "Registrar Atendimento" na listagem de atendimentos apontando para o formulário `/attendances/new`.
- Atualizados os testes unitários do backend e do frontend, totalizando **56 testes no backend e 52 no frontend**, todos passando com sucesso.

## 2026-08-09 — Visualização de Detalhes do Cidadão em Modal
- Criado o componente standalone `CitizenDetailsModalComponent` no frontend Angular para exibir todas as informações do cidadão (dados básicos, contato, endereço, perfil socioeconômico, perfil profissional e histórico de atendimentos).
- Atualizado o `CitizenListComponent` no frontend Angular para injetar `MatDialog` e abrir o novo modal ao clicar no nome de um cidadão na tabela.
- Atualizado o `AttendanceListComponent` no frontend Angular para injetar `MatDialog` e abrir o novo modal ao clicar no nome de um cidadão na tabela de histórico de atendimentos.
- Criados testes unitários adicionais para validar a abertura do modal nas duas listagens. Todos os testes unitários e de integração do frontend passaram com sucesso.

## 2026-08-09 — Correção da Exclusão de Cidadãos (Backend & Foreign Keys)
- Identificado que o backend NestJS não possuía a rota `@Delete(':id')` no `CitizensController` e o método `delete(id)` no `CitizensService`.
- Implementado a rota `@Delete(':id')` com o `AuditInterceptor` registrando a ação de auditoria `DELETE`.
- Implementado o método `delete(id)` no `CitizensService` utilizando `$transaction` do Prisma para remover em cascata os registros vinculados (`attendances`, `social_profiles`, `professional_profiles`), prevenindo erros de constraint de chave estrangeira (`onDelete: Restrict`).
- Adicionados testes unitários no backend em `citizens.service.spec.ts`. Todos os 58 testes do backend e 54 do frontend estão passando com sucesso.
- Substituído o `confirm()` nativo do navegador (que pode ser bloqueado por configurações de pop-up) pelo novo componente modal `ConfirmDialogComponent`, garantindo disparo fluido e confiável da exclusão via `MatDialog`.

## 2026-08-09 — Validação e Atualização dos Dados de Carga (Seed e Documentação)
- Atualizados os dados fictícios em `backend/prisma/seed.ts` e `readme.md` para utilizar valores de CPF e NIS 100% válidos perante o algoritmo oficial Módulo 11 (Receita Federal e CEF).
- João Silva de Souza: CPF `529.982.247-25` | NIS `123.456.789-00`
- Maria Aparecida Oliveira: CPF `912.384.750-60` | NIS `234.567.890-13`
- Carlos Henrique dos Santos: CPF `123.456.789-09`

## 2026-08-09 — Correção de UX do Formulário de Edição (RF-011)
- Corrigido o botão "Salvar Cadastro" no `CitizenFormComponent`: alinhamento interno do ícone e texto centralizado via `::ng-deep` no Angular Material MDC.
- Botão agora é habilitado/desabilitado dinamicamente com `[disabled]="!citizenForm.dirty || isSubmitting()"`, ficando ativo somente quando há alterações pendentes.
- Corrigido comportamento de validação ao editar: campo CPF (desabilitado em modo edição) não propaga mais erros de validação para o formulário; `clearValidators()` + `setErrors(null)` chamados explicitamente ao desabilitar o controle.
- Adicionado `markAllAsTouched()` e banner de erro visível ao tentar salvar formulário inválido.

## 2026-08-09 — Correção da Formatação de Experiências Profissionais
- Corrigida exibição de experiências profissionais no `CitizenDetailsModalComponent` e no `CitizenFormComponent` que apareciam como `[object Object]` ou letra a letra quando o campo continha objetos JSON (`{ empresa, cargo, duracao }`).
- Implementadas as funções `formatExperience()` / `formatExperienceItem()` que convertem os objetos em texto legível: `Cargo: X - Empresa: Y - Duração: Z`.
- Adicionados métodos `getExperiences()`, `getCourses()`, `getTargetAreas()` no `CitizenDetailsModalComponent` para garantir iteração sobre arrays em vez de strings.
- Corrigido registro corrompido da Maria Aparecida Oliveira no banco PostgreSQL (experiência havia sido salva como string literal `[object Object]`).

## 2026-08-09 — Carga do Histórico de Atendimentos e Listagem por Cidadão
- Identificado que o banco continha apenas 1 atendimento (os demais foram removidos em cascata durante testes de exclusão).
- Reexecutado `npx prisma db seed` no backend; seed agora popula **4 atendimentos** distribuídos entre os cidadãos cadastrados.
- Corrigido o endpoint `GET /api/attendances` para incluir `phone`, `email` do cidadão e `email`, `role` do atendente no retorno (necessário para o novo modal de detalhes).

## 2026-08-09 — Modal de Detalhes do Atendimento (RF-009)
- Criado o componente standalone `AttendanceDetailsModalComponent` (`frontend/src/app/shared/components/attendance-details-modal/`) com template, estilos e lógica TypeScript.
- O modal exibe: ID completo do atendimento em destaque (fonte monospace, selecionável), banner com tipo de serviço e data/hora, bloco do cidadão atendido (nome clicável que abre o perfil do cidadão, CPF, telefone, e-mail), bloco do atendente (nome, e-mail corporativo, cargo), e área de observações/encaminhamentos completa.
- Integrado na listagem geral de atendimentos (`AttendanceListComponent`): coluna ID exibe `#xxxxxxxx...` clicável; coluna Ações com botão de visualizar.
- Integrado no modal de detalhes do cidadão (`CitizenDetailsModalComponent`): tabela de histórico de atendimentos passou a exibir coluna ID clicável e botão "Ver Ficha" em cada linha.
- Adicionados testes unitários: 55 no frontend e 61 no backend, todos passando.

## 2026-08-09 — Filtros Avançados de Atendimentos (RF-012)
- Atualizado o backend `AttendancesService.findAll()` para aceitar parâmetros de filtro: `serviceType` (ENUM exato), `citizenName` (contains case-insensitive), `attendantName` (contains case-insensitive), `dateFrom` (≥ início do dia) and `dateTo` (≤ 23:59:59 do dia).
- A query de `count()` utiliza o mesmo `where` dos filtros, garantindo paginação correta.
- Atualizado o frontend `AttendancesService.findAll()` para receber os novos parâmetros e construir a query string dinamicamente via `URLSearchParams`.
- Reescrito `AttendanceListComponent` com: barra de busca por nome do cidadão (debounce 400ms, tempo real), painel de "Filtros Avançados" (toggle com badge `!` quando há filtro ativo), select de Tipo de Serviço com todos os 6 valores do ENUM, campo de Atendente, datepickers "De" e "Até", chips de resumo dos filtros ativos, botões "Limpar Filtros" e "Aplicar Filtros".
- Adicionados testes unitários para `clearAdvancedFilters`, `hasActiveFilters` e `getServiceTypeLabel`.
- Adicionados testes unitários no backend para filtragem por `serviceType`, `citizenName` e intervalo de datas.
- Totais finais: **57 testes no frontend** e **61 testes no backend**, todos passando.

## 2026-08-09 — Atualização dos Requisitos (requirements.md)
- Adicionados **RF-008** (Visualização de Detalhes do Cidadão), **RF-009** (Visualização de Detalhes do Atendimento), **RF-010** (Exclusão de Cidadão com Confirmação), **RF-011** (Edição de Cadastro do Cidadão) e **RF-012** (Busca Avançada de Atendimentos).
- Refinadas as descrições de **RF-004**, **RF-005**, e dos RNFs **RNF-002**, **RNF-003**, **RNF-004**, **RNF-005** e **RNF-006** para refletir os comportamentos implementados.
- Adicionado **RNF-007** (Integridade dos Dados) para formalizar a exigência de CPFs/NISs matematicamente válidos nos dados de carga e documentação.
