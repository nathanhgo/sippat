# 📋 Requisitos Funcionais e Não Funcionais - SIPPAT

## Requisitos Funcionais (RF)

| Código | Nome | Descrição / Regra de Negócio | Prioridade |
| :--- | :--- | :--- | :--- |
| **RF-001** | Cadastro Unificado (Dados Básicos) | Registrar os dados essenciais do cidadão: **Nome Completo**, **CPF**, **Data de Nascimento**, **Gênero**, **Telefone** e **Bairro**. | Alta |
| **RF-002** | Perfil Profissional e Público Prioritário | Registrar **Escolaridade**, **Áreas de interesse**, **Cursos/Capacitações**, **Experiências** e **Público prioritário para políticas públicas** (ex: Mulheres vítimas de violência, População em situação de rua / POP). **Regra de Interface:** o público prioritário deve ser exibido com destaque visual (badge/chip) **ao lado do nome da pessoa** em listagens e cabeçalhos. | Alta |
| **RF-003** | Indicadores Socioeconômicos | Registrar a participação em **Programas Sociais**, indicador **Se é PcD** (Sim/Não) e o **CID da Deficiência** (informado quando PcD for Sim). Dados socioeconômicos são criptografados em repouso. | Alta |
| **RF-004** | Histórico e Nova Seção de Atendimento | Registrar os atendimentos prestados ao cidadão com data/hora, tipo de serviço (ENUM), observações/encaminhamentos e a **Nova Seção do Atendimento com dados do técnico**: **Nome do técnico responsável pelo atendimento**, **Local de trabalho do técnico** e **Contato do técnico** (telefone ou e-mail). | Alta |
| **RF-005** | Busca Avançada de Cidadãos | Permitir busca/filtragem combinada na listagem de cidadãos por: Nome/CPF (tempo real), Bairro, Escolaridade, PcD e Público Prioritário. | Alta |
| **RF-006** | Reutilização e Atualização | Ao iniciar um atendimento, sugerir automaticamente o carregamento do cadastro existente com base no CPF informado, permitindo ao atendente aceitar, recusar ou editar os dados antes de salvar. | Alta |
| **RF-007** | Importação de Planilhas (`files/formulario.xlsx` e `files/atendimento.xlsx`) | Importar e normalizar dados a partir das planilhas na pasta `files/`: (1) `files/formulario.xlsx` (respostas coletadas com base no modelo oficial `files/formulario.pdf`, organizadas por abas de públicos como 'Mulheres' e 'POP'); e (2) `files/atendimento.xlsx` (histórico operacional de encaminhamentos do PAT a entrevistas e vagas). Em caso de CPF duplicado, oferecer as opções de sobrescrever ou ignorar (em massa ou linha a linha). | Alta |
| **RF-008** | Visualização de Detalhes do Cidadão | Exibir em modal todas as informações do cidadão: dados básicos (Nome, CPF, Nascimento, Gênero, Telefone, Bairro), badge do **Público Prioritário ao lado do nome**, perfil socioeconômico (Programas Sociais, PcD, CID da Deficiência), perfil profissional (Escolaridade, Áreas de interesse, Cursos/Capacitações, Experiências) e histórico de atendimentos vinculados. | Alta |
| **RF-009** | Visualização de Detalhes do Atendimento | Exibir em modal todas as informações do atendimento: ID completo, tipo de serviço, data/hora, vínculo com o cidadão (link), dados do atendente do sistema e a **Nova Seção com dados do técnico** (Nome, Local de trabalho e Contato do técnico responsável). | Alta |
| **RF-010** | Exclusão de Cidadão com Confirmação | Permitir ao administrador excluir um cadastro de cidadão através de um modal de confirmação explícita. A exclusão remove em cascata todos os registros vinculados (atendimentos, perfil socioeconômico, perfil profissional). | Alta |
| **RF-011** | Edição de Cadastro do Cidadão | Permitir editar os dados do cadastro do cidadão. O botão "Salvar Cadastro" só é habilitado quando há pelo menos uma alteração pendente. O campo CPF fica desabilitado para edição. | Alta |
| **RF-012** | Busca Avançada de Atendimentos | Permitir filtragem combinada na listagem de atendimentos por: nome do cidadão (tempo real), tipo de serviço, nome do atendente/técnico responsável e intervalo de datas. Chips de resumo indicam quais filtros estão ativos. | Alta |

> **Nota de Evolução Futura (100% Local / Desktop):** Está em discussão a eventual transição/suporte a uma versão desktop 100% local e autônoma do SIPPAT. Esta proposta **está sob análise de viabilidade e não é oficial no momento**.

## Requisitos Não Funcionais (RNF)

| Código | Categoria | Descrição / Critério de Aceite | Prioridade |
| :--- | :--- | :--- | :--- |
| **RNF-001** | Agilidade de Busca | Buscas com filtros combinados em base de milhares de cadastros devem responder em no máximo **1,5 segundo**. | Alta |
| **RNF-002** | Validação de Dados | Validação automática de CPF (Módulo 11 Receita Federal) e formatos de telefone/data no momento da digitação, impedindo duplicados. | Alta |
| **RNF-003** | Segurança (LGPD) | Criptografia dos dados socioeconômicos e sensíveis em trânsito e em repouso. Controle de acesso baseado em perfis (`ADMIN`, `ATTENDANT`). Autenticação via JWT. | Alta |
| **RNF-004** | Usabilidade | Interface inspirada na agilidade de planilhas, com atalhos de teclado e preenchimento fluido. Feedback visual imediato em ações destrutivas (exclusão via modal de confirmação). | Alta |
| **RNF-005** | Trilha de Auditoria (LGPD) | Registrar log de criação, leitura, edição e exportação de dados sensíveis de cidadãos (usuário responsável e data/hora). Log retido por **3 meses** com expurgo automático diário. | Alta |
| **RNF-006** | Retenção e Anonimização (LGPD) | Cadastros sem nenhum atendimento há mais de **1 ano** devem ser anonimizados/arquivados, em conformidade com o princípio de minimização de dados da LGPD. Job agendado diário. | Média |
| **RNF-007** | Integridade dos Dados | CPFs dos dados de carga (seed) e testes devem ser matematicamente válidos (Módulo 11). | Média |