# Guia do desenvolvedor

Tudo o que é preciso para mexer no SIPPAT sem descobrir as coisas na tentativa e
erro. Para subir o projeto pela primeira vez, comece pelo [readme.md](readme.md).

## Arquitetura

Monorepo com dois projetos independentes:

```
frontend (Angular)  --HTTP-->  backend (NestJS)  --Prisma-->  PostgreSQL
```

- O backend expõe tudo sob o prefixo `/api` e documenta as rotas no Swagger
  (`http://localhost:3000/docs`).
- O frontend em desenvolvimento chama `http://localhost:3000/api`
  (`frontend/src/environments/environment.ts`). Em produção usa `/api` relativo,
  então os dois precisam estar atrás do mesmo domínio.
- Não há autenticação entre serviços: o frontend guarda o JWT e manda no header
  `Authorization: Bearer <token>`.

### Módulos do backend

| Módulo | Pasta | Responsabilidade |
| :--- | :--- | :--- |
| Auth | `src/modules/auth` | Login, registro, JWT, guards de perfil |
| Citizens | `src/modules/citizens` | CRUD, perfil socioeconômico e profissional, busca |
| Attendances | `src/modules/attendances` | Registro e histórico de atendimentos |
| Import | `src/modules/import` | Leitura e normalização das planilhas Excel |
| Audit | `src/modules/audit` | Interceptor que grava `audit_logs` |
| Data retention | `src/modules/data-retention` | Jobs diários de anonimização e expurgo |
| Health | `src/health` | `GET /api/health` (API + banco) |

### Estrutura de pastas

```
backend/
  prisma/
    schema.prisma        modelo de dados (fonte da verdade)
    migrations/          histórico de migrations
    seed.ts              usuários e cidadãos de exemplo
  scripts/migrate-test.js  aplica migrations no banco de testes
  src/
    modules/<modulo>/    controller, service, dto, testes (*.spec.ts)
    prisma/              PrismaService
    common/              filtros e utilitários
  test/                  testes E2E da API (*.e2e-spec.ts)
frontend/
  src/app/core/          auth.service, guardas, services de API
  src/app/features/      telas: auth, citizens, attendances, import
  src/app/shared/        componentes e validadores reutilizáveis
  e2e/                   testes Playwright
.docs/                   requisitos, arquitetura, schema, plano de testes
```

## Variáveis de ambiente

São dois arquivos, ambos fora do git:

**`.env` (raiz)** — lido pelo `docker-compose.yml`:

| Variável | Padrão | Para que serve |
| :--- | :--- | :--- |
| `POSTGRES_USER` / `POSTGRES_PASSWORD` / `POSTGRES_DB` | `sippat` / `sippat` / `sippat_dev` | banco de desenvolvimento |
| `POSTGRES_PORT` | `5432` | porta publicada do banco de dev |
| `POSTGRES_TEST_*` | `sippat` / `sippat` / `sippat_test` | banco de testes |
| `POSTGRES_TEST_PORT` | `5433` | porta publicada do banco de testes |

**`backend/.env`** — lido pela API:

| Variável | Para que serve |
| :--- | :--- |
| `PORT` | porta da API (padrão 3000) |
| `NODE_ENV` | `development` em local |
| `DATABASE_URL` | conexão do banco de desenvolvimento |
| `TEST_DATABASE_URL` | conexão do banco de testes (usada pelos E2E) |

## Banco de dados

O `prisma/schema.prisma` é a fonte da verdade. Qualquer mudança de modelo precisa
de migration e de atualização do `.docs/database_schema.md`.

```bash
cd backend
npx prisma migrate dev --name nome_da_mudanca   # cria e aplica a migration
npx prisma generate                            # regenera o client
npx prisma studio                              # inspeciona os dados
```

### Banco de testes

O banco de testes roda em `tmpfs` (some quando o container para) e precisa das
migrations aplicadas antes dos E2E:

```bash
npm run prisma:migrate:test
npm run test:e2e
```

**Se a porta 5433 estiver ocupada** (acontece quando outro projeto usa Postgres
na mesma máquina), o container de teste sobe sem publicar a porta e os testes
falham com `Authentication failed`. Solução: trocar `POSTGRES_TEST_PORT` no
`.env` da raiz e o `TEST_DATABASE_URL` no `backend/.env` para a mesma porta nova,
e recriar o container:

```bash
docker compose up -d --force-recreate postgres_test
```

## API

Todas as rotas abaixo são prefixadas com `/api`. Swagger completo em `/docs`.

| Método | Rota | Autenticação | Observação |
| :--- | :--- | :--- | :--- |
| POST | `/auth/login` | pública | corpo `{ email, password }`, devolve `access_token` |
| POST | `/auth/register` | **pública hoje** | ver "Problemas conhecidos" |
| GET | `/health` | pública | `{ status, database }` |
| GET | `/citizens` | JWT | filtros: `search`, `neighborhood`, `educationLevel`, `isPcd`, `priorityGroup`, `page`, `limit` |
| GET | `/citizens/:id` | JWT | |
| POST | `/citizens` | JWT | valida CPF (módulo 11) e recusa duplicado |
| PATCH | `/citizens/:id` | JWT | CPF não é editável |
| DELETE | `/citizens/:id` | JWT | deveria ser só ADMIN, ver problemas conhecidos |
| POST | `/attendances` | JWT | `citizenId`, `serviceType`, `notes`, dados do técnico |
| GET | `/attendances` | JWT | filtros: `serviceType`, `citizenName`, `attendantName`, `dateFrom`, `dateTo`, `page`, `limit` |
| GET | `/attendances/citizen/:citizenId` | JWT | histórico de um cidadão |
| POST | `/import/upload` | JWT | multipart, campo `file`; devolve prévia |
| POST | `/import/confirm` | JWT | aplica a prévia com a estratégia de duplicados |

### Contrato de dados

- O campo de senha na API é `password` (não `senha`).
- `fullName` é o nome do cidadão (não `name`).
- `serviceType` é um ENUM fechado: `ENCAMINHAMENTO`, `ORIENTACAO`,
  `CADASTRO_VAGA`, `ATUALIZACAO_CADASTRAL`, `EMISSAO_DOCUMENTO`, `OUTRO`.
- `gender`: `MASCULINO`, `FEMININO`, `OUTRO`, `NAO_DECLARADO`.
- CPF é gravado só com dígitos (sem pontos e traço).
- A validação global usa `whitelist` e `forbidNonWhitelisted`: mandar campo que
  não existe no DTO devolve 400.

### Autenticação e perfis

O JWT carrega `sub`, `email` e `role` (`ADMIN` ou `ATTENDANT`). O `RolesGuard`
existe e lê o decorator `@Roles(...)`, mas **nenhuma rota usa o decorator hoje**,
então na prática todo usuário autenticado tem acesso a tudo. Ver problemas
conhecidos.

## Frontend

| Rota | Tela |
| :--- | :--- |
| `/login` | login |
| `/register` | cadastro de usuário |
| `/citizens` | lista e busca de cidadãos |
| `/citizens/new` e `/citizens/edit/:id` | formulário de cidadão |
| `/attendances` | histórico de atendimentos |
| `/attendances/new` | registro de atendimento |
| `/import` | importação de planilhas |

O `authGuard` protege as rotas internas e o `auth.service` guarda o token. O
interceptor HTTP anexa o `Authorization` e trata 401 mandando para o login.

## Testes

O projeto segue TDD (regra 6 do `.cursorrules`): teste primeiro, depois a
implementação.

```bash
cd backend
npm test              # unitários, 13 arquivos / 67 testes
npm run test:cov      # cobertura
npm run test:e2e      # E2E da API (precisa do banco de testes migrado)
```

```bash
cd frontend
npm test              # unitários (Vitest via builder do Angular)
npm run test:e2e      # Playwright
```

Cobertura mínima combinada pela equipe: 90%.

## Convenções

- Sem ESLint por decisão do time; o formato é o do Prettier (`npm run format`).
- Todo módulo novo nasce com `*.spec.ts` ao lado.
- Depois de qualquer alteração, atualizar `.docs/to_do.md` e registrar em
  `.docs/logs.md` (regra 5 do `.cursorrules`).
- Mudou o modelo? Atualizar `schema.prisma`, criar migration e refletir em
  `.docs/database_schema.md`.
- Dados sensíveis (socioeconômicos) passam pelo serviço de criptografia; não
  gravar em texto puro nem logar.

## Problemas conhecidos

Encontrados na execução de ponta a ponta em 05/11/2026. Nenhum foi corrigido
ainda.

1. **`POST /api/auth/register` é público e devolve o hash da senha.** Qualquer
   pessoa com acesso à rede cria um usuário, inclusive `ADMIN`, sem token. A
   resposta inclui `passwordHash`. Correção: exigir JWT + `@Roles(ADMIN)` e
   remover o hash do retorno.
2. **Exclusão de cidadão sem restrição de perfil.** `DELETE /citizens/:id` não
   tem `@Roles(Role.ADMIN)`, e o `RolesGuard` libera quando não há decorator.
   Testado: um usuário `ATTENDANT` excluiu um cidadão com sucesso. O RF-010 diz
   que a exclusão é do administrador. A tela também mostra o botão de excluir
   para todos.
3. **E2E da API desatualizado.** `test/schema-constraints.e2e-spec.ts` ainda usa
   `raceColor`, `maritalStatus` e `nis`, removidos na migration
   `20260914173000_update_requirements_v2`. Resultado: 4 de 9 testes falham com
   `PrismaClientValidationError`. Os unitários passam (67/67).
4. **Título da aba é "🐴 Frontend"**, sobra do starter do Angular
   (`frontend/src/index.html`).
5. **CPF duplicado devolve 400**, não 409. Funciona (a mensagem é "CPF já
   cadastrado"), mas 409 Conflict seria o código correto para conflito de
   unicidade.
6. **`backend/README.md` é o boilerplate do NestJS**, sem relação com o projeto.

## Solução de problemas

| Sintoma | Causa provável | O que fazer |
| :--- | :--- | :--- |
| `Authentication failed ... credentials for sippat` nos E2E | porta do banco de testes ocupada por outro projeto | ver "Banco de testes" acima |
| `PrismaClientInitializationError` na subida | banco parado ou `DATABASE_URL` errada | `docker compose ps` e conferir `backend/.env` |
| `PrismaClientValidationError` em campo que existe no banco | client do Prisma desatualizado | `npx prisma generate` |
| Frontend chama a API e recebe erro de CORS | API não está em `localhost:3000` | conferir `environment.ts` e a porta do backend |
| Login funciona na API mas não na tela | token antigo no `localStorage` | limpar o storage e entrar de novo |
