# Arquitetura do Sistema SIPPAT

## Visão Geral
Arquitetura Monolítica Modular (Monorepo).

## Módulos do Backend
- `src/modules/auth/`: Login, JWT e Guards de perfil (`ADMIN`, `ATTENDANT`).
- `src/modules/citizens/`: CRUD de cidadãos, perfil socioeconômico e profissional.
- `src/modules/search/`: Engine de busca avançada combinando múltiplos filtros.
- `src/modules/attendances/`: Registro e histórico de atendimentos.
- `src/modules/import/`: Parser de arquivos Excel legados.
- `src/modules/audit/`: Interceptor/serviço de trilha de auditoria para acesso a dados sensíveis (RNF-005).
- `src/modules/data-retention/`: Job agendado para anonimização de cadastros inativos há mais de 1 ano (RNF-006) e expurgo de logs de auditoria com mais de 3 meses (RNF-005).

> **Nota:** o Mapeamento de Vulnerabilidade (`VulnerabilityCalculatorService`) foi **removido do escopo atual** por decisão em reunião (ver `questions.md` #5-7). Consequentemente, o módulo `search` não realiza mais ordenação por pontuação de vulnerabilidade — a ordenação padrão passa a ser definida na Fase 3 (ex.: por nome ou data de cadastro), sem prejuízo de reintrodução futura da feature.

## Fluxo de Reutilização de Cadastro (RF-006)
1. Ao iniciar um atendimento, o atendente informa o CPF do cidadão.
2. O sistema busca automaticamente um cadastro existente com aquele CPF e, se encontrado, sugere o carregamento dos dados salvos (dados básicos, perfil profissional e socioeconômico).
3. O atendente pode aceitar o cadastro sugerido, recusá-lo (criando um novo do zero) ou editar os campos desatualizados (ex.: telefone) antes de salvar o atendimento.

## Convenção de Testes (TDD)
- Testes unitários/integração do backend (`*.spec.ts`) ficam ao lado do arquivo testado dentro de cada módulo.
- Testes E2E do backend ficam em `test/*.e2e-spec.ts` na raiz do projeto NestJS.
- Todo módulo novo deve nascer com seus testes escritos antes da implementação (Red → Green → Refactor), conforme regra 6 do `.cursorrules` e detalhamento em `tests.md`.