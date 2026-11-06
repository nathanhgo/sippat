# SIPPAT - Sistema Inteligente de Processos do PAT

Sistema de gestão do Posto de Atendimento ao Trabalhador (PAT) de Jacareí:
cadastro de cidadãos, perfil profissional e socioeconômico, histórico de
atendimentos, busca avançada e importação de planilhas, com criptografia dos
dados sensíveis e trilha de auditoria (LGPD).

| Camada | Tecnologia |
| :--- | :--- |
| Backend | NestJS + TypeScript, Prisma ORM 6, JWT |
| Frontend | Angular 22 + TailwindCSS 4 + Angular Material |
| Banco | PostgreSQL 16 |
| Testes | Vitest (unitário e E2E) + Playwright (E2E do frontend) |

## Documentação

- **[devs.md](devs.md)**: para quem vai mexer no código (arquitetura, API, banco, testes, problemas conhecidos).
- **[guia.md](guia.md)**: para quem vai usar o sistema no dia a dia (linguagem simples, passo a passo das telas).
- **[.docs/](.docs/)**: requisitos, arquitetura, schema do banco, plano de testes e histórico de decisões.

## Requisitos

- Node.js 20 ou superior (o projeto roda no 26)
- Docker e Docker Compose

## Subindo o projeto

### 1. Variáveis de ambiente

```bash
cp .env.example .env                 # portas e credenciais do Postgres
cp backend/.env.example backend/.env # conexão da API com o banco
```

Os valores padrão funcionam para desenvolvimento. Se a porta `5433` já estiver
ocupada na sua máquina, troque `POSTGRES_TEST_PORT` no `.env` da raiz e o
`TEST_DATABASE_URL` no `backend/.env` (ver [devs.md](devs.md#banco-de-testes)).

### 2. Banco de dados

```bash
docker compose up -d
```

Sobe dois containers: `sippat_postgres` (desenvolvimento, porta 5432) e
`sippat_postgres_test` (testes, porta 5433, dados em memória).

### 3. Backend

```bash
cd backend
npm install
npx prisma migrate deploy   # aplica as migrations
npx prisma db seed          # popula usuários e cidadãos de exemplo
npm run start:dev
```

API em `http://localhost:3000/api` e Swagger em `http://localhost:3000/docs`.

### 4. Frontend

```bash
cd frontend
npm install
npm run start
```

Aplicação em `http://localhost:4200`.

## Contas criadas pelo seed

| Perfil | E-mail | Senha |
| :--- | :--- | :--- |
| Administrador | `admin@sippat.jacarei.sp.gov.br` | `Admin@123` |
| Atendente | `atendente@sippat.jacarei.sp.gov.br` | `Attendant@123` |

O seed também cria três cidadãos de exemplo (João Silva de Souza, Maria
Aparecida Oliveira e Carlos Henrique dos Santos) com perfis socioeconômicos e
histórico de atendimentos.

## Testes

```bash
cd backend
npm test                    # unitários (67 testes)
npm run prisma:migrate:test # prepara o banco de testes
npm run test:e2e            # E2E da API
```

```bash
cd frontend
npm test                    # unitários
npm run test:e2e            # Playwright
```

## Estrutura

```
backend/          API NestJS
  prisma/         schema, migrations e seed
  src/modules/    auth, citizens, attendances, import, audit, data-retention
  test/           testes E2E da API
frontend/         aplicação Angular
  src/app/core/   serviços, guardas e autenticação
  src/app/features/  telas (auth, citizens, attendances, import)
.docs/            documentação de requisitos e decisões
docker-compose.yml  Postgres de desenvolvimento e de testes
```

## LGPD

Dados socioeconômicos são criptografados em repouso, o acesso a dados sensíveis
é registrado em `audit_logs` (retenção de 3 meses) e cadastros sem atendimento
há mais de um ano são anonimizados por job diário. As planilhas reais de
importação **não** ficam no repositório, justamente por conterem dados pessoais.
