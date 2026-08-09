# 📋 Requisitos Funcionais e Não Funcionais - SIPPAT

## Requisitos Funcionais (RF)

| Código | Nome | Descrição / Regra de Negócio | Prioridade |
| :--- | :--- | :--- | :--- |
| **RF-001** | Cadastro Unificado | Registrar dados básicos: Nome, CPF, RG, Data de Nascimento, Gênero, Raça/Cor, Estado Civil (obrigatórios), Endereço, Bairro, Telefone e E-mail. | Alta |
| **RF-002** | Perfil Profissional | Registrar escolaridade, cursos de capacitação, histórico de experiências e áreas de interesse. | Alta |
| **RF-003** | Indicadores Socioeconômicos | Capturar Renda per capita, CadÚnico (NIS), Moradia, Composição Familiar, Benefícios (Bolsa Família, BPC), PcD e grupos prioritários. | Alta |
| **RF-004** | Histórico de Atendimentos | Registrar todos os atendimentos prestados ao cidadão com data, tipo de serviço (lista fechada/ENUM: Encaminhamento, Orientação, Cadastro de Vaga, Atualização Cadastral, Emissão de Documento, Outro), funcionário responsável e observações. | Alta |
| **RF-005** | Busca Avançada de Cidadãos | Permitir busca/filtragem combinada na listagem de cidadãos por: nome/CPF (tempo real), Bairro, Escolaridade, PcD e Faixa de Renda (mínima/máxima). | Alta |
| **RF-006** | Reutilização e Atualização | Ao iniciar um atendimento, sugerir automaticamente o carregamento do cadastro existente com base no CPF informado, permitindo ao atendente aceitar, recusar ou editar os dados antes de salvar. | Alta |
| **RF-007** | Importação de Excel | Importar cadastros e histórico das planilhas manuais legadas em Excel atualmente usadas no PAT. Em caso de CPF duplicado, o usuário escolhe entre sobrescrever ou ignorar a linha, podendo aplicar a decisão individualmente ou em massa. | Média |
| **RF-008** | Visualização de Detalhes do Cidadão | Exibir em modal todas as informações do cidadão: dados básicos, contato, endereço, perfil socioeconômico (renda, NIS, moradia, benefícios, PcD), perfil profissional (escolaridade, experiências, cursos, áreas de interesse) e histórico de atendimentos vinculados com seus IDs. O modal é acessível ao clicar no nome do cidadão em qualquer listagem. | Alta |
| **RF-009** | Visualização de Detalhes do Atendimento | Exibir em modal todas as informações do atendimento: ID completo visível, data/hora de registro, tipo de serviço, dados do cidadão atendido (com link para seu perfil), dados do funcionário responsável (nome, e-mail, cargo) e observações/encaminhamentos completos. | Alta |
| **RF-010** | Exclusão de Cidadão com Confirmação | Permitir ao administrador excluir um cadastro de cidadão através de um modal de confirmação explícita. A exclusão remove em cascata todos os registros vinculados (atendimentos, perfil socioeconômico, perfil profissional). | Alta |
| **RF-011** | Edição de Cadastro do Cidadão | Permitir editar todos os dados do cadastro do cidadão. O botão "Salvar Cadastro" só é habilitado (com destaque visual) quando há pelo menos uma alteração pendente. Campos não editáveis (como CPF) ficam desabilitados sem bloquear o formulário. | Alta |
| **RF-012** | Busca Avançada de Atendimentos | Permitir filtragem combinada na listagem de atendimentos por: nome do cidadão (tempo real), tipo de serviço, nome do atendente responsável e intervalo de datas (data de início e data de término). Chips de resumo indicam quais filtros estão ativos. | Alta |

> **Nota:** o requisito de Mapeamento de Vulnerabilidade (algoritmo de pontuação) foi **removido do escopo atual** por decisão em reunião (ver `questions.md` #5-7). Poderá ser reavaliado em uma fase futura do projeto. Os códigos RF foram renumerados após a remoção.

## Requisitos Não Funcionais (RNF)

| Código | Categoria | Descrição / Critério de Aceite | Prioridade |
| :--- | :--- | :--- | :--- |
| **RNF-001** | Agilidade de Busca | Buscas com filtros combinados em base de milhares de cadastros devem responder em no máximo **1,5 segundo**. | Alta |
| **RNF-002** | Validação de Dados | Validação automática de CPF (Módulo 11 Receita Federal), NIS/CadÚnico (Módulo 11 CEF), CEP e E-mail no momento da digitação, impedindo duplicados. | Alta |
| **RNF-003** | Segurança (LGPD) | Criptografia dos dados socioeconômicos e sensíveis em trânsito e em repouso. Controle de acesso baseado em perfis (`ADMIN`, `ATTENDANT`). Autenticação via JWT. | Alta |
| **RNF-004** | Usabilidade | Interface inspirada na agilidade de planilhas, com atalhos de teclado e preenchimento fluido. Feedback visual imediato em ações destrutivas (exclusão via modal de confirmação). | Alta |
| **RNF-005** | Trilha de Auditoria (LGPD) | Registrar log de criação, leitura, edição e exportação de dados sensíveis de cidadãos (usuário responsável e data/hora). Log retido por **3 meses** com expurgo automático diário. | Alta |
| **RNF-006** | Retenção e Anonimização (LGPD) | Cadastros sem nenhum atendimento há mais de **1 ano** devem ser anonimizados/arquivados, em conformidade com o princípio de minimização de dados da LGPD. Job agendado diário. | Média |
| **RNF-007** | Integridade dos Dados | CPFs e NISs dos dados de carga (seed) devem ser matematicamente válidos. Dados fictícios de demonstração devem seguir o mesmo padrão dos dados reais. | Média |