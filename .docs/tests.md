# 🧪 Plano de Testes (TDD) - SIPPAT

> Conforme a regra 6 do `.cursorrules`, toda implementação de código deve seguir o ciclo **Red → Green → Refactor**: o teste é escrito primeiro (falhando), depois a feature mínima que o faz passar, depois o refactor. Este documento define a estratégia e o catálogo de casos de teste mapeados aos requisitos (`RF-XXX` / `RNF-XXX`) de `requirements.md`.

## 1. Estratégia Geral

| Camada | Ferramentas | Local dos arquivos |
| :--- | :--- | :--- |
| Backend — Unitário | Vitest + `@nestjs/testing` | `*.spec.ts` ao lado do arquivo testado |
| Backend — Integração/E2E | Vitest + Supertest + banco de testes (Postgres via Docker) | `test/**/*.e2e-spec.ts` |
| Frontend — Unitário | Vitest | `*.spec.ts` ao lado do componente/serviço |
| Frontend — E2E | Playwright | `e2e/` |
| Performance/Carga | k6 ou Artillery | `test/load/` |
| Segurança | `npm audit`, testes manuais de payload/criptografia | `test/security/` |

**Convenções:**
- Nomenclatura dos testes: `deve <comportamento esperado> quando <condição>`.
- Banco de dados de teste isolado (schema ou container dedicado via `docker-compose.test.yml`), nunca a base de desenvolvimento/produção.
- Dados de teste gerados via factories/fixtures (ex: `@faker-js/faker`), nunca dados reais de cidadãos.
- Nenhum PR deve ser aceito com testes quebrados ou cobertura abaixo do mínimo definido na seção 6.
- Não há linter configurado no projeto (decisão da equipe); a qualidade do código é garantida pela cobertura de testes e revisão manual.

## 2. Backend — Testes Unitários por Módulo

### 2.1 Módulo `auth`
- Deve gerar hash de senha com bcrypt e nunca persistir senha em texto plano.
- Deve autenticar usuário com credenciais válidas e retornar um JWT válido.
- Deve rejeitar login com senha incorreta (401), com mensagem genérica (sem indicar se o e-mail existe).
- Deve rejeitar login com e-mail inexistente (401).
- `RolesGuard` deve bloquear `ATTENDANT` de acessar rotas restritas a `ADMIN`.
- Deve rejeitar requisições com token JWT ausente, inválido ou expirado (401).

### 2.2 Módulo `citizens` (RF-001, RF-002, RF-003, RNF-002, RNF-003)
- Deve criar um cidadão com todos os dados obrigatórios válidos, incluindo Gênero, Raça/Cor e Estado Civil.
- Deve rejeitar a criação de um cidadão sem Gênero, Raça/Cor ou Estado Civil informados (campos obrigatórios — RF-001).
- Deve rejeitar CPF com dígito verificador inválido.
- Deve rejeitar CPF duplicado (já existente na base).
- Deve rejeitar NIS inválido ou duplicado.
- Deve rejeitar CEP em formato inválido.
- Deve rejeitar e-mail em formato inválido.
- Deve atualizar um cadastro existente sem duplicar registro nem apagar histórico de atendimentos.
- Deve criptografar os campos sensíveis de `social_profiles` antes de persistir, e descriptografá-los corretamente na leitura (RNF-003).

### 2.3 Módulo `search` (RF-005, RNF-001)
- Deve filtrar cidadãos por bairro.
- Deve filtrar cidadãos por faixa de renda per capita.
- Deve filtrar cidadãos por nível de escolaridade.
- Deve filtrar cidadãos por PcD.
- Deve combinar múltiplos filtros simultaneamente (ex: bairro + faixa etária + PcD).
- Deve paginar corretamente os resultados (parâmetros de página/limite).
- **Teste de performance (RNF-001):** busca com filtros combinados em base populada com um volume representativo (ex: 50.000 registros) deve responder em até **1,5s**. Executado separadamente do pipeline unitário padrão (job de performance no CI ou execução manual).

### 2.4 Módulo `attendances` (RF-004, RF-006)
- Deve registrar um atendimento vinculado a um cidadão e um funcionário existentes, com `service_type` dentre os valores fechados do ENUM.
- Deve rejeitar atendimento com `service_type` fora da lista de valores permitidos.
- Deve rejeitar atendimento referenciando `citizen_id` ou `user_id` inexistente.
- Deve listar o histórico de atendimentos de um cidadão ordenado por data decrescente.
- Ao informar um CPF já cadastrado, deve sugerir automaticamente o carregamento do cadastro existente (RF-006).
- Deve permitir aceitar o cadastro sugerido, recusá-lo (criando um novo do zero) ou editar campos específicos antes de salvar (RF-006).

### 2.5 Módulo `import` (RF-007)
- Deve importar uma planilha Excel válida e criar os registros correspondentes de cidadãos.
- Deve reportar, sem interromper a importação total, as linhas com erro de validação (CPF inválido, campo obrigatório ausente).
- Deve, ao encontrar CPF duplicado, respeitar a opção escolhida pelo usuário: **sobrescrever** ou **ignorar** a linha.
- Deve aplicar a decisão de duplicado individualmente quando o modo for "linha a linha".
- Deve aplicar a mesma decisão a todos os duplicados quando o modo for "em massa".
- Deve gerar um relatório final de importação (linhas importadas com sucesso, sobrescritas, ignoradas e com erro, com motivo).

### 2.6 Módulo `audit` (RNF-005)
- Deve registrar uma entrada de log ao criar, ler, editar ou exportar dados sensíveis de um cidadão, com usuário responsável e timestamp.
- Deve expurgar automaticamente (job agendado) logs de auditoria com mais de 3 meses de criação.
- Não deve expurgar logs com menos de 3 meses.

### 2.7 Módulo `data-retention` (RNF-006)
- Deve identificar cidadãos sem nenhum atendimento registrado há mais de 1 ano.
- Deve anonimizar os dados de identificação/contato desses cidadãos, preservando o registro para fins estatísticos e a integridade referencial do histórico de atendimentos.
- Não deve anonimizar cidadãos com atendimento registrado há menos de 1 ano.

## 3. Backend — Testes de Integração / E2E (Supertest)

- Fluxo completo: login → criar cidadão → criar perfil socioeconômico → buscar cidadão → registrar atendimento.
- Deve validar o contrato de resposta (status HTTP + formato do DTO) de cada endpoint público.
- Deve aplicar corretamente o RBAC ponta a ponta (`ADMIN` vs `ATTENDANT`) nas rotas protegidas.
- Deve retornar 400 com mensagens padronizadas do `class-validator` em payloads inválidos.
- Deve retornar 500 genérico (sem vazar stack trace) para erros inesperados, via filtro global de exceções.

## 4. Frontend — Testes Unitários

- Formulário de cadastro: validação reativa de CPF, NIS, CEP e e-mail em tempo real, com feedback visual imediato (RNF-002, RNF-004).
- Formulário de cadastro: campos obrigatórios de Gênero, Raça/Cor e Estado Civil bloqueiam o envio quando não preenchidos.
- Tabela de busca: renderização correta das colunas e navegação por atalhos de teclado, conforme `visual.md`.
- Serviços Angular (`HttpClient`): tratamento correto de respostas de sucesso e de erro (incluindo timeout e 401 → redirecionar para login).
- Guards de rota: bloqueio de acesso a rotas protegidas sem autenticação/perfil adequado.

## 5. Frontend — Testes E2E (Playwright)

- Fluxo de login (sucesso e falha).
- Fluxo de cadastro completo de cidadão (dados básicos + perfil profissional + perfil socioeconômico) em uma única jornada.
- Fluxo de busca avançada com múltiplos filtros combinados.
- Fluxo de registro de atendimento a partir de um cadastro já existente, incluindo aceitar/recusar/editar a sugestão automática (RF-006).
- Fluxo de importação de planilha Excel, incluindo escolha de tratamento de duplicados (linha a linha e em massa) e conferência do relatório de resultado.

## 6. Testes Não Funcionais e Critérios de Aceite

- **Performance (RNF-001):** simulação de buscas concorrentes com k6/Artillery; p95 ≤ 1,5s.
- **Segurança:** inspeção de payloads de rede para garantir que dados sensíveis não trafegam em texto plano; `npm audit` sem vulnerabilidades críticas/altas.
- **Criptografia (RNF-003):** valor armazenado diretamente no banco para campos sensíveis deve ser ilegível sem a chave de decriptação da aplicação.
- **Auditoria e Retenção (RNF-005, RNF-006):** validar que os jobs agendados de expurgo (3 meses) e anonimização (1 ano) rodam corretamente e não afetam registros fora do prazo.
- **Cobertura mínima para merge:** **90%** de cobertura em backend e frontend (definido pela equipe).
- Todos os testes unitários, de integração e E2E críticos passando antes de qualquer merge na branch principal.
