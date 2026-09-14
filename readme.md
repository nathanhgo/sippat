# 💡 SIPPAT - Sistema Inteligente de Processos do PAT

Sistema desenvolvido para o Posto de Atendimento ao Trabalhador (PAT) de Jacareí, oferecendo controle modular de cidadãos, perfil profissional, indicadores socioeconômicos, histórico de atendimentos, importação inteligente de planilhas e total conformidade com as diretrizes da LGPD (criptografia, auditoria e anonimização de inativos).

---

## 🚀 Como Executar o Projeto

### 1. Requisitos
* Docker & Docker Compose
* Node.js v20+

### 2. Iniciando o Banco de Dados
Na raiz do projeto, suba os containers do PostgreSQL:
```bash
docker compose up -d
```

### 3. Rodando o Backend (NestJS)
1. Navegue até a pasta do backend: `cd backend`
2. Instale as dependências: `npm install`
3. Aplique as migrações no banco: `npx prisma migrate dev`
4. Execute o servidor de desenvolvimento: `npm run start:dev`

### 4. Rodando o Frontend (Angular 22)
1. Navegue até a pasta do frontend: `cd ../frontend` (ou abra um novo terminal na pasta `frontend`)
2. Instale as dependências: `npm install`
3. Execute a aplicação: `npm run start`
4. Acesse em seu navegador: `http://localhost:4200`

---

## 🌱 Banco de Dados e Carga de Testes (Seeding)

Para facilitar os testes locais, o projeto conta com um script de **seeding** que popula a base de dados com usuários administrativos e cidadãos fictícios contendo dados socioeconômicos criptografados.

Para rodar a carga no banco:
```bash
cd backend
npx prisma db seed
```

### 🔐 Contas Criadas pelo Seed

Use estas credenciais para logar na tela inicial do sistema:

| Tipo de Acesso | E-mail de Login | Senha de Acesso |
| :--- | :--- | :--- |
| **Administrador (ADMIN)** | `admin@sippat.jacarei.sp.gov.br` | `Admin@123` |
| **Atendente (ATTENDANT)** | `atendente@sippat.jacarei.sp.gov.br` | `Attendant@123` |

### 👥 Dados Populados de Cidadãos
* **João Silva de Souza** (CPF: `529.982.247-25`): Cadastro básico, Programas Sociais (Bolsa Família) e Bairro Centro.
* **Maria Aparecida Oliveira** (CPF: `912.384.750-60`): Perfil PcD com CID informado, Programas Sociais (BPC) e Público Prioritário (Mulheres vítimas de violência).
* **Carlos Henrique dos Santos** (CPF: `123.456.789-09`): Cadastro básico com perfil profissional e histórico de experiências.
* **Histórico de Atendimentos:** Registros vinculados contendo a Nova Seção do Atendimento com dados do técnico responsável (Nome, Local de trabalho e Contato).