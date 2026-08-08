# 🎯 Plano de Execução em Fases - SIPPAT

> Cada fase segue o ciclo TDD (regra 6 do `.cursorrules`): os testes de um item são escritos e devem falhar (Red) antes da implementação da feature correspondente (Green), seguidos de refatoração quando necessário.

## Fase 0: Alinhamento e Planejamento

- [x] Analisar `.cursorrules` e `.docs/` para levantar inconsistências e lacunas.
- [x] Preencher `questions.md` com pontos em aberto para validação com o time do PAT.
- [x] Preencher `tests.md` com o plano de testes (TDD) mapeado aos RF/RNF.
- [x] Validar respostas de `questions.md` com o responsável pelo projeto.
- [x] Propagar decisões de `questions.md` para `requirements.md`, `database_schema.md`, `architecture.md`, `tech_stack.md`, `visual.md` e `tests.md`.



## Fase 1: Setup e Infraestrutura ✅ (concluída)

- [x] Configurar Docker Compose com PostgreSQL (banco de desenvolvimento + banco isolado de testes).
- [x] Inicializar projeto NestJS (Backend) com TypeScript, Prisma e Vitest configurado.
- [x] Inicializar projeto Angular (Frontend) com TailwindCSS e Vitest configurado.
- [x] Configurar Playwright para os testes E2E do frontend.
- [x] Escrever testes das migrações/schema (ex: constraints de unicidade de CPF/NIS/e-mail, ENUMs obrigatórios).
- [x] Criar migrações do Banco de Dados conforme `database_schema.md`.
- [x] Configurar Swagger/OpenAPI.
- [x] Criar endpoint de health check (`GET /api/health`) para validar API + conexão com o banco.
- [x] Criar tasks do VS Code (`Ctrl+Shift+P` → "Tasks: Run Task") para subir DB, backend, frontend, rodar testes e aplicar migrations.

> Decisões estruturais tomadas nesta fase (Angular 21 em vez de 24, Prisma 6 em vez de 7, health check) estão documentadas em `tech_stack.md` § "Decisões Estruturais tomadas na Fase 1".



## Fase 2: Autenticação e Módulo de Cidadãos (CRUD) ✅ (concluída)

- [x] Escrever testes do módulo de Auth (login, hashing, guards de perfil) — ver `tests.md` §2.1.
- [x] Implementar Módulo de Auth no NestJS (JWT, Login de Funcionários) até os testes passarem.
- [x] Escrever testes de validação de CPF, NIS, CEP e dos novos campos obrigatórios (Gênero, Raça/Cor, Estado Civil) — RNF-002, RF-001, ver `tests.md` §2.2.
- [x] Criar rotas do CRUD de Cidadãos (`RF-001`, `RF-002`, `RF-003`) com validações estritas até os testes passarem.
- [x] Escrever testes de criptografia dos campos sensíveis de `social_profiles` (RNF-003).
- [x] Implementar criptografia de campos sensíveis até os testes passarem.
- [x] Criar endpoint de registro de usuários (backend) e tela de cadastro de usuário (frontend) para testes e setup local.
- [x] Criar formulários de cadastro e edição fluida de cidadãos no Angular (`RNF-004`), com testes unitários de validação reativa.



## Fase 3: Busca Avançada e Reutilização de Cadastro ✅ (concluída)

- [x] Escrever testes do endpoint de Busca Avançada (filtros combinados, paginação, ordenação padrão) — ver `tests.md` §2.3.
- [x] Criar endpoint de Busca Avançada combinada com paginação (`RF-005`) até os testes passarem.
- [x] Otimizar queries com índices no PostgreSQL e validar com teste de performance (`RNF-001`, `tests.md` §2.3).
- [x] Criar tela de Busca com Filtros Avançados e Tabela Dinâmica no Angular, com testes unitários e E2E.
- [x] Escrever testes do fluxo de reutilização de cadastro por CPF (sugerir/aceitar/recusar/editar) — RF-006, ver `tests.md` §2.4.
- [x] Implementar sugestão automática de cadastro existente ao iniciar atendimento até os testes passarem.



## Fase 4: Atendimentos e Importação de Excel

- [ ] Escrever testes do módulo de Atendimentos, incluindo o ENUM fechado de `service_type` (`RF-004`) — ver `tests.md` §2.4.
- [ ] Criar módulo de Histórico de Atendimentos até os testes passarem.
- [ ] Escrever testes do serviço de importação de Excel, incluindo o tratamento de CPF duplicado (sobrescrever/ignorar, linha a linha ou em massa) — ver `tests.md` §2.5.
- [ ] Criar serviço de importação de planilhas Excel (`RF-007`) com a interface de escolha de tratamento de duplicados até os testes passarem.



## Fase 5: Segurança (LGPD) e Refinamento

- [ ] Escrever testes do módulo de auditoria (`audit_logs`), incluindo o job de expurgo de logs com mais de 3 meses (RNF-005).
- [ ] Implementar trilha de auditoria e job de expurgo até os testes passarem.
- [ ] Escrever testes do job de anonimização de cadastros inativos há mais de 1 ano (RNF-006).
- [ ] Implementar job de anonimização/retenção de dados até os testes passarem.
- [ ] Aplicar criptografia para os demais campos sensíveis pendentes (`RNF-003`).
- [ ] Testes de carga (RNF-001) e testes de segurança (dependências, payloads) — ver `tests.md` §6.
- [ ] Validação geral do sistema e revisão de cobertura de testes (mínimo de 90%, ver `tests.md` §6).



## Backlog (fora do escopo atual)

- [ ] Mapeamento de Vulnerabilidade (algoritmo de pontuação socioeconômica) — removido do escopo por decisão em reunião (ver `questions.md` #5-7). Reavaliar em fase futura.