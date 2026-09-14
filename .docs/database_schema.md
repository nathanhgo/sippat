# 🗄️ Esquema do Banco de Dados (PostgreSQL)

## Entidades Principais

### 1. `users` (Funcionários do PAT)
- `id` (UUID, PK)
- `name` (VARCHAR)
- `email` (VARCHAR, UNIQUE)
- `password_hash` (VARCHAR)
- `role` (ENUM: 'ADMIN', 'ATTENDANT')
- `created_at` / `updated_at`

### 2. `citizens` (Cidadãos / RF-001)
- `id` (UUID, PK)
- `full_name` (VARCHAR, INDEX) -- Nome completo da pessoa
- `cpf` (VARCHAR(11), UNIQUE, INDEX) -- CPF (validado matematicamente)
- `birth_date` (DATE) -- Data de nascimento
- `gender` (ENUM: 'MASCULINO', 'FEMININO', 'OUTRO', 'NAO_DECLARADO', NOT NULL) -- Gênero
- `phone` (VARCHAR) -- Telefone para contato
- `neighborhood` (VARCHAR, INDEX) -- Bairro
- `deleted_at` (TIMESTAMP, NULLABLE) -- Soft delete/anonimização LGPD (RNF-006)
- `created_at` / `updated_at`

### 3. `social_profiles` (Indicadores Socioeconômicos / RF-003)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id, UNIQUE)
- `social_programs` (TEXT, NULLABLE) -- Programas Sociais (benefícios recebidos)
- `is_pcd` (BOOLEAN, DEFAULT FALSE) -- Se é PcD
- `disability_cid` (VARCHAR, NULLABLE) -- CID da Deficiência (quando is_pcd = true)
- `created_at` / `updated_at`

### 4. `professional_profiles` (Perfil Profissional / RF-002)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id, UNIQUE)
- `priority_group` (VARCHAR, NULLABLE) -- Público prioritário para políticas públicas (exibido em destaque ao lado do nome da pessoa). Opções oficiais extraídas de `formulario.pdf` (Pergunta 20):
  - `'Fluxo Municipal da Mulher'`
  - `'Pessoa com deficiência'`
  - `'Pessoa com TEA'`
  - `'Acompanhamento pelo CAPS AD'`
  - `'Acompanhamento pelo CAPS II'`
  - `'Acompanhamento pelo CRAS'`
  - `'Acompanhamento pelo CREAS'`
  - `'Acompanhamento pelo Centro POP'`
  - `'Acompanhamento pela Casa do Abraço'`
  - `'Egressos do Programa Jovem Aprendiz Acima de 18 anos'`
  - `'Outra'`
- `education_level` (VARCHAR, NULLABLE) -- Escolaridade (Pergunta 21 de `formulario.pdf`):
  - `'Fundamental incompleto'`, `'Fundamental completo'`, `'Médio incompleto'`, `'Médio completo'`, `'Técnico'`, `'Superior incompleto'`, `'Superior completo'`
- `target_areas` (JSONB / Array, NULLABLE) -- Áreas em que gostaria de trabalhar (Pergunta 29 de `formulario.pdf`):
  - `'Atendimento ao público'`, `'Vendas'`, `'Serviços administrativos'`, `'Serviços gerais'`, `'Área industrial'`, `'Cuidados (crianças/idosos)'`, `'Tecnologia'`, `'Outra'`
- `courses` (JSONB / Array, NULLABLE) -- Cursos concluídos (superiores, técnicos ou profissionalizantes) e áreas de interesse para qualificação (Pergunta 25 de `formulario.pdf`: `'Gestão'`, `'Vendas'`, `'Atendimento/Recepção'`, `'Informática'`, `'Área industrial'`, `'Beleza/Estética'`, `'Gastronomia'`, `'Empreendedorismo'`, `'Construção Civil'`, `'Serviços administrativos'`)
- `experiences` (JSONB, NULLABLE) -- Histórico de experiências profissionais (Perguntas 26-31 de `formulario.pdf`):
  - `had_formal_contract` (BOOLEAN - Carteira assinada)
  - `last_occupation` (VARCHAR - Última ocupação)
  - `experience_duration` (ENUM: `'Menos de 6 meses'`, `'6 meses ou mais'`)
  - `was_self_employed` (BOOLEAN - Trabalhou por conta própria / empreendeu)
  - `self_employed_area` (VARCHAR - Área de atuação autônoma)
- `created_at` / `updated_at`

### 5. `attendances` (Histórico de Atendimentos / RF-004)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id)
- `user_id` (FK -> users.id) -- Usuário atendente logado no sistema
- `service_type` (ENUM: 'ENCAMINHAMENTO', 'ORIENTACAO', 'CADASTRO_VAGA', 'ATUALIZACAO_CADASTRAL', 'EMISSAO_DOCUMENTO', 'OUTRO')
- `notes` (TEXT, NULLABLE) -- Observações técnicas relevantes (Pergunta 44 de `formulario.pdf`) e encaminhamentos a entrevistas/retornos
- `technician_name` (VARCHAR, NULLABLE) -- Nome do técnico responsável pelo atendimento / preenchimento (Pergunta 45)
- `technician_workplace` (VARCHAR, NULLABLE) -- Local de trabalho do técnico (Pergunta 46: ex: CREAS I, CRAS, PAT, Ong Recomeçar)
- `technician_contact` (VARCHAR, NULLABLE) -- Contato do técnico responsável - telefone ou e-mail (Pergunta 47)
- `created_at` / `updated_at`

### 6. `audit_logs` (Trilha de Auditoria LGPD / RNF-005)
- `id` (UUID, PK)
- `user_id` (FK -> users.id)
- `citizen_id` (FK -> citizens.id, NULLABLE)
- `action` (ENUM: 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT')
- `entity` (VARCHAR) -- ex: 'social_profiles', 'citizens'
- `metadata` (JSONB, NULLABLE) -- detalhes adicionais
- `created_at` (TIMESTAMP)
- **Retenção:** registros com mais de **3 meses** devem ser expurgados por job agendado.

## Observações Gerais (LGPD)
- **Retenção e Anonimização (RNF-006):** cadastros (`citizens`) sem nenhum atendimento (`attendances`) registrado há mais de **1 ano** devem ser anonimizados (campo `deleted_at` preenchido + anonimização dos dados pessoais), preservando a integridade referencial do histórico de atendimentos para fins estatísticos.
- **Consentimento:** processo presencial (verbal/assinatura em formulário físico), fora do escopo do software.
- Campo `users.is_active` (BOOLEAN, default true) para desativação de atendentes sem quebra de integridade referencial.

## Mapeamento de Normalização das Planilhas de Importação (RF-007)
Os arquivos de modelo e carga estão localizados na pasta `files/`:
- `files/formulario.pdf`: Modelo visual e conceitual oficial do formulário de inclusão produtiva.
- `files/formulario.xlsx`: Respostas estruturadas coletadas a partir do formulário.
- `files/atendimento.xlsx`: Histórico operacional de encaminhamentos e atendimentos a entrevistas.

### Planilha 1: `files/formulario.xlsx` (Referência: `files/formulario.pdf`)
Estrutura com abas segmentadas por público (ex: `Sheet1`, `Mulheres`, `POP`). Mapeia os dados do cidadão, perfil e técnico:
- **`citizens`:** 'Nome completo:' → `full_name`, 'CPF:' → `cpf`, 'Data de nascimento:' → `birth_date`, 'Telefone seguro para contato:' / 'Telefone para recado:' → `phone`, bairro extraído do endereço/texto → `neighborhood`.
- **`social_profiles`:** 'Tem alguma deficiência ?' → `is_pcd`, 'Se "Sim", informar o CID:' → `disability_cid`, 'Está recebendo algum benefício socioassistencial?' + 'Se "Sim", qual ?' → `social_programs`.
- **`professional_profiles`:** 'Pertence a qual público prioritário para políticas públicas?' (ou identificador da aba: Mulheres, POP) → `priority_group`, 'Escolaridade:' → `education_level`, 'Cursos técnicos ou profissionalizantes realizados:' → `courses`, 'Última ocupação:' + 'Tempo de experiência na última ocupação' → `experiences`, 'Áreas em que gostaria de trabalhar:' → `target_areas`.
- **`attendances` (Nova Seção do Atendimento):** 'Nome do técnico responsável pelo preenchimento desse formulário:' → `technician_name`, 'Local de trabalho do técnico:' → `technician_workplace`, 'Contato do técnico responsável:' → `technician_contact`, 'Observações técnicas relevantes ao PAT:' → `notes`.

### Planilha 2: `files/atendimento.xlsx` (Planilha Legada de Atendimentos)
Estrutura tabular com histórico de vagas e encaminhamentos:
- **`attendances`:** 'Data' → `created_at`, 'Encaminhado por:' → `technician_name` / `technician_workplace`, 'Função desejada' + 'Encaminhado para entrevista' + 'Observação' → `notes`, 'BAIRRO' → `citizens.neighborhood`.