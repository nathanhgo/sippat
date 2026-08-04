# 📋 Requisitos Funcionais e Não Funcionais - SIPPAT

## Requisitos Funcionais (RF)

| Código | Nome | Descrição / Regra de Negócio | Prioridade |
| :--- | :--- | :--- | :--- |
| **RF-001** | Cadastro Unificado | Registrar dados básicos: Nome, CPF, RG, Data de Nascimento, Gênero, Raça/Cor, Estado Civil (obrigatórios), Endereço, Bairro, Telefone e E-mail. | Alta |
| **RF-002** | Perfil Profissional | Registrar escolaridade, cursos de capacitação, histórico de experiências e áreas de interesse. | Alta |
| **RF-003** | Indicadores Socioeconômicos | Capturar Renda per capita, CadÚnico (NIS), Moradia, Composição Familiar, Benefícios (Bolsa Família, BPC), PcD e grupos prioritários. | Alta |
| **RF-004** | Histórico de Atendimentos | Registrar todos os atendimentos prestados ao cidadão com data, tipo de serviço (lista fechada/ENUM, ex: Encaminhamento, Orientação, Cadastro de Vaga), funcionário responsável e observações. | Alta |
| **RF-005** | Busca Avançada | Permitir busca/filtragem combinada por Bairro, Renda, Escolaridade, Experiência, PcD, Idade, CadÚnico, etc. | Alta |
| **RF-006** | Reutilização e Atualização | Ao iniciar um atendimento, sugerir automaticamente o carregamento do cadastro existente com base no CPF informado, permitindo ao atendente aceitar, recusar ou editar os dados antes de salvar (ex.: atualizar um telefone desatualizado). | Alta |
| **RF-007** | Importação de Excel | Importar cadastros e histórico das planilhas manuais legadas em Excel atualmente usadas no PAT. Em caso de CPF duplicado, o usuário escolhe entre sobrescrever ou ignorar a linha, podendo aplicar a decisão individualmente (linha a linha) ou em massa (mesma decisão para todos os duplicados). | Média |

> **Nota:** o requisito de Mapeamento de Vulnerabilidade (algoritmo de pontuação) foi **removido do escopo atual** por decisão em reunião (ver `questions.md` #5-7). Poderá ser reavaliado em uma fase futura do projeto. Os códigos RF foram renumerados após a remoção.

## Requisitos Não Funcionais (RNF)

| Código | Categoria | Descrição / Critério de Aceite | Prioridade |
| :--- | :--- | :--- | :--- |
| **RNF-001** | Agilidade de Busca | Buscas com filtros combinados em base de milhares de cadastros devem responder em no máximo **1,5 segundo**. | Alta |
| **RNF-002** | Validação de Dados | Validação automática de CPF, NIS, CEP e E-mail no momento da digitação, impedindo duplicados. | Alta |
| **RNF-003** | Segurança (LGPD) | Criptografia dos dados socioeconômicos e sensíveis em trânsito e em repouso. Controle de acesso baseado em perfis (`ADMIN`, `ATTENDANT`). | Alta |
| **RNF-004** | Usabilidade | Interface inspirada na agilidade de planilhas, com atalhos de teclado e preenchimento fluido. | Alta |
| **RNF-005** | Trilha de Auditoria (LGPD) | Registrar log de criação, leitura, edição e exportação de dados sensíveis de cidadãos (usuário responsável e data/hora). Log retido por **3 meses**. | Alta |
| **RNF-006** | Retenção e Anonimização (LGPD) | Cadastros sem nenhum atendimento há mais de **1 ano** devem ser anonimizados/arquivados, em conformidade com o princípio de minimização de dados da LGPD. | Média |