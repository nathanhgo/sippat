# Dúvidas e Decisões de Arquitetura

> Perguntas levantadas na análise inicial do projeto (`.cursorrules` + `.docs/`) para refinar requisitos antes do início da implementação. Organizadas por tema. Respostas devem ser adicionadas abaixo de cada pergunta e, quando impactarem RF/RNF, refletidas em `requirements.md`, `database_schema.md` ou `architecture.md`.
>
> **Status:** ✅ Todas as respostas abaixo já foram propagadas para `requirements.md`, `database_schema.md`, `architecture.md`, `tech_stack.md`, `visual.md`, `to_do.md` e `tests.md`. Nota: como a feature de Mapeamento de Vulnerabilidade (perguntas 5-7) foi removida, os códigos `RF-007` (Reutilização) e `RF-008` (Importação) citados nas perguntas abaixo foram renumerados para `RF-006` e `RF-007`, respectivamente, nos demais documentos.

## 1. Escopo e Regras de Negócio

1. **Multi-unidade/Multi-tenant:** O sistema atenderá apenas o PAT de Jacareí ou deve ser projetado para suportar múltiplas unidades/municípios no futuro (ex: outros CRAS/PATs da região)? Isso impacta diretamente o modelo de dados (necessidade de `tenant_id`/`unit_id`).
Resposta: A ideia inicial é atender apenas o PAT de jacareí, vamos manter essa ideia

2. **Tipos de Atendimento:** O campo `service_type` em `attendances` deve ser uma lista fechada (ENUM) com opções pré-definidas pela gestão do PAT (ex: "Encaminhamento", "Orientação", "Cadastro de Vaga") ou texto livre digitado pelo atendente?
Resposta: Mantenha um campo fechado (ENUM) com as opções planejadas inicialmente, provavelmente no futuro vamos alterar para outras opções

3. **Fluxo de Aprovação:** Todo cadastro é criado diretamente por um atendente autenticado, ou existe algum cenário de autoatendimento/pré-cadastro do cidadão que precise de revisão/aprovação antes de entrar na base oficial?
Resposta: Todo cadastro é criado diretamente por um atendente autenticado

4. **Reutilização de Cadastro (RF-007):** Ao iniciar um novo atendimento, o sistema deve buscar automaticamente pelo CPF e sugerir o carregamento do cadastro existente, ou o atendente decide manualmente pesquisar antes?
Resposta: Sugerir o carregamento do cadastro existente, mas deve ser possível ao atendente recusar ou usar uma versão editada disso (ex: caso uma pessoa a ser atendida tenha um cadastro antigo com um telefone antigo, que agora usa outro)

## 2. Algoritmo de Vulnerabilidade (RF-006)

5. **Pesos e Metodologia:** Quais os pesos/percentuais exatos de cada critério no cálculo do `vulnerability_score` (renda per capita, moradia, PcD, benefícios sociais)? Existe uma metodologia oficial de referência (ex: critérios do CadÚnico/CRAS) a ser seguida, ou a pontuação será definida empiricamente pela equipe do PAT?
Resposta: Em reunião decidimos remover essa feature de score de vulnerabilidade por enquanto, remova dos documentos (requirements, to_do, etc.)

6. **Gatilho de Recálculo:** O `vulnerability_score` deve ser recalculado apenas quando o `social_profile` é editado manualmente, ou também de forma automática/periódica (ex: idade do cidadão muda a elegibilidade a um benefício, tempo sem atendimento aumenta a prioridade)?
Resposta: Em reunião decidimos remover essa feature de score de vulnerabilidade por enquanto, remova dos documentos (requirements, to_do, etc.)

7. **Histórico de Pontuação:** É necessário manter um histórico da evolução do `vulnerability_score` ao longo do tempo (para relatórios/análises), ou basta armazenar sempre o valor mais recente?
Resposta: Em reunião decidimos remover essa feature de score de vulnerabilidade por enquanto, remova dos documentos (requirements, to_do, etc.)

## 3. LGPD e Segurança

8. **Perfis de Acesso:** Os dois perfis atuais (`ADMIN`, `ATTENDANT`) são suficientes? Existe necessidade de um terceiro perfil (ex: `MANAGER`/gestor) com acesso a relatórios agregados/estatísticos sem visualizar dados sensíveis individuais de cada cidadão?
Resposta: Por enquanto vamos manter só os dois perfis atuais

9. **Trilha de Auditoria:** É obrigatório registrar log de auditoria (quem acessou, editou ou exportou dados sensíveis de um cidadão específico, e quando)? Por quanto tempo esse log deve ser retido?
Resposta: Sim, vamos manter essa informação, inicialmente configure para reter esse log por 3 meses

10. **Retenção e Anonimização:** Existe uma política de retenção de dados? Após quanto tempo sem nenhum atendimento um cadastro deve ser anonimizado/arquivado, em conformidade com o princípio de minimização de dados da LGPD?
Resposta: Vamos manter um padrão de 1 ano, se não for contra algo da LGPD

11. **Consentimento (Termo LGPD):** O cidadão precisa assinar/registrar consentimento explícito no momento do cadastro? Esse consentimento (data, versão do termo) deve ficar armazenado na base?
Resposta: Ele deve permitir o cadastro, mas como ele será realizado pelo atendente, pode ser feito de forma falada/com uma asinatura em papel

## 4. Dados e Importação (RF-008)

12. **Tratamento de Duplicados na Importação:** Ao importar uma planilha Excel legada com um CPF que já existe na base, o sistema deve sobrescrever os dados, ignorar a linha, ou pedir confirmação manual linha a linha?
Resposta: De as duas opções para o usuário, para ele Sobrescrever ou igonorar, com a possibilidade de fazer isso linha a linha ou em massa (mesma decisão pra todos)

13. **Campos Adicionais:** Campos comuns em programas sociais/CadÚnico como Gênero, Raça/Cor e Estado Civil devem ser capturados no cadastro (atualmente ausentes em `citizens`/`social_profiles`)?
Resposta: Devem ser capturados de forma obrigatório

## 5. Técnico e Infraestrutura

14. **Estratégia de Testes E2E Frontend:** Qual ferramenta usar para os testes end-to-end do Angular — Cypress ou Playwright? Qual a cobertura mínima de testes (%) exigida para aprovar um Pull Request?
Resposta: Playwright, vamos manter uma cobertura minima de 90%

15. **Ambientes e Deploy:** Haverá ambiente de homologação/staging antes de produção? Qual a infraestrutura de deploy prevista (servidor próprio da Prefeitura, VPS, cloud)?
Resposta: Não

## 6. Inconsistências Identificadas (para ciência/validação)

- **`.cursorrules` vs `tech_stack.md`:** o `.cursorrules` citava "TypeORM/Prisma" como opções de ORM, enquanto `tech_stack.md` definia apenas Prisma ORM. **Ação:** `.cursorrules` foi ajustado para citar apenas Prisma ORM, eliminando a ambiguidade. Confirmar se essa é realmente a decisão final.
Resposta: Perfeito, mantenha apenas Prisma

- **TDD sem stack de testes definida:** o `.cursorrules` exige TDD obrigatório, mas `tech_stack.md` não citava nenhuma ferramenta de teste. **Ação:** adicionadas ferramentas sugeridas (Jest/Supertest no backend, Jasmine/Karma + Cypress ou Playwright no frontend) — pendente confirmação na pergunta 14.
Resposta: Definimos como Vitest, Playwright, e entre o Jasmine/Karma não conhecemos nenhuma das duas, então mantenha o mais prático/fácil

- **Timestamps incompletos:** `attendances` e `professional_profiles` não tinham `updated_at`. **Ação:** campos adicionados em `database_schema.md`.
Resposta: Perfeito, mantenha assim

- **Ausência de auditoria:** RNF-003 exige controle de acesso, mas não havia estrutura de log de auditoria. **Ação:** proposta uma tabela `audit_logs` em `database_schema.md`, sujeita à confirmação da pergunta 9.
Resposta: Perfeito, gostei da ideia do log de auditoria


Observações gerais (criadas pelo responsável):
- Vamos desconsiderar o ESLint por enquanto, por ser um projeto simples, não há a necessidade de um Linter
- Vamos trocar o Jest por Vitests, é uma tecnologia que nossos desenvolvedores já estão mais acostumados