# Arquitetura do Sistema SIPPAT

## Visão Geral
Arquitetura Monolítica Modular (Monorepo).

## Módulos do Backend
- `src/modules/auth/`: Login, JWT e Guards de perfil (`ADMIN`, `ATTENDANT`).
- `src/modules/citizens/`: CRUD de cidadãos, perfil socioeconômico (programas sociais, PcD, CID da deficiência) e profissional (escolaridade, cursos, experiências e público prioritário para políticas públicas).
- `src/modules/search/`: Engine de busca avançada combinando múltiplos filtros (nome/CPF, bairro, escolaridade, PcD, público prioritário).
- `src/modules/attendances/`: Registro e histórico de atendimentos, incluindo a **Nova Seção do Atendimento** com dados do técnico responsável (nome, local de trabalho e contato).
- `src/modules/import/`: Parsers e adaptadores de planilhas Excel (`xlsx`): suporte aos arquivos em `files/`: `files/formulario.xlsx` (estruturado conforme o modelo oficial `files/formulario.pdf` com abas como 'Mulheres' e 'POP') e histórico de encaminhamentos legados (`files/atendimento.xlsx`), convertendo e normalizando dados para a base relacional.
- `src/modules/audit/`: Interceptor/serviço de trilha de auditoria para acesso a dados sensíveis (RNF-005).
- `src/modules/data-retention/`: Job agendado para anonimização de cadastros inativos há mais de 1 ano (RNF-006) e expurgo de logs de auditoria com mais de 3 meses (RNF-005).

## Fluxo de Reutilização de Cadastro (RF-006)
1. Ao iniciar um atendimento, o atendente informa o CPF do cidadão.
2. O sistema busca automaticamente um cadastro existente com aquele CPF e, se encontrado, sugere o carregamento dos dados salvos (dados básicos, perfil profissional com badge de público prioritário e socioeconômico).
3. O atendente pode aceitar o cadastro sugerido, recusá-lo (criando um novo do zero) ou editar os campos desatualizados (ex.: telefone) antes de salvar o atendimento.

## Arquitetura Futura: Execução 100% Local (Desktop) — Em Discussão
Está em estudo pela equipe a viabilidade de converter a aplicação no futuro para um formato **100% local (Desktop / Offline-first)**, eliminando a dependência de servidor web e internet:
- **Tecnologias em prospecção:** Empacotamento via **Tauri** ou **Electron**, ou distribuição de container local integrado com SQLite ou PostgreSQL local embutido.
- **Status:** **Não oficial / em discussão preliminar**. A arquitetura oficial vigente permanece como monorepo web (NestJS + Angular 22 + PostgreSQL).

## Convenção de Testes (TDD)
- Testes unitários/integração do backend (`*.spec.ts`) ficam ao lado do arquivo testado dentro de cada módulo.
- Testes E2E do backend ficam em `test/*.e2e-spec.ts` na raiz do projeto NestJS.
- Todo módulo novo deve nascer com seus testes escritos antes da implementação (Red → Green → Refactor), conforme regra 6 do `.cursorrules` e detalhamento em `tests.md`.