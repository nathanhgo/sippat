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
- `cpf` (VARCHAR(11), UNIQUE, INDEX)
- `rg` (VARCHAR)
- `full_name` (VARCHAR, INDEX)
- `birth_date` (DATE)
- `gender` (ENUM: 'MASCULINO', 'FEMININO', 'OUTRO', 'NAO_DECLARADO', NOT NULL) -- obrigatório, ver `questions.md` #13
- `race_color` (ENUM: 'BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO', NOT NULL) -- obrigatório, categorias IBGE
- `marital_status` (ENUM: 'SOLTEIRO', 'CASADO', 'DIVORCIADO', 'VIUVO', 'UNIAO_ESTAVEL', NOT NULL) -- obrigatório
- `phone` (VARCHAR)
- `email` (VARCHAR)
- `address_street`, `address_number`, `neighborhood` (INDEX), `zip_code`
- `deleted_at` (TIMESTAMP, NULLABLE) -- soft delete/anonimização (RNF-006)
- `created_at` / `updated_at`

### 3. `social_profiles` (Indicadores Socioeconômicos / RF-003, LGPD Criptografado)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id, UNIQUE)
- `nis` (VARCHAR, UNIQUE, NULLABLE)
- `per_capita_income` (DECIMAL)
- `housing_status` (ENUM: 'OWN', 'RENTED', 'RISK_AREA', 'UNHOUSED')
- `family_members_count` (INT)
- `receives_bolsa_familia` (BOOLEAN)
- `receives_bpc` (BOOLEAN)
- `is_pcd` (BOOLEAN)
- `pcd_description` (TEXT)
- `created_at` / `updated_at`

> **Nota:** o campo `vulnerability_score` foi **removido** desta versão do esquema — a feature de Mapeamento de Vulnerabilidade foi retirada do escopo atual (ver `questions.md` #5-7). Caso seja retomada futuramente, reavaliar se retorna a este modelo.

### 4. `professional_profiles` (RF-002)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id, UNIQUE)
- `education_level` (ENUM)
- `courses` (JSONB / Array de Strings)
- `experiences` (JSONB)
- `target_areas` (JSONB / Array)
- `created_at` / `updated_at`

### 5. `attendances` (Histórico de Atendimentos / RF-004)
- `id` (UUID, PK)
- `citizen_id` (FK -> citizens.id)
- `user_id` (FK -> users.id)
- `service_type` (ENUM: 'ENCAMINHAMENTO', 'ORIENTACAO', 'CADASTRO_VAGA', 'ATUALIZACAO_CADASTRAL', 'EMISSAO_DOCUMENTO', 'OUTRO') -- lista fechada inicial, sujeita a expansão futura (ver `questions.md` #2)
- `notes` (TEXT)
- `created_at` / `updated_at`

### 6. `audit_logs` (Trilha de Auditoria LGPD / RNF-005)
- `id` (UUID, PK)
- `user_id` (FK -> users.id)
- `citizen_id` (FK -> citizens.id, NULLABLE)
- `action` (ENUM: 'CREATE', 'READ', 'UPDATE', 'DELETE', 'EXPORT')
- `entity` (VARCHAR) -- ex: 'social_profiles', 'citizens'
- `metadata` (JSONB, NULLABLE) -- detalhes adicionais (ex: campos alterados)
- `created_at` (TIMESTAMP)
- **Retenção:** registros com mais de **3 meses** devem ser expurgados por job agendado (ver `questions.md` #9).

## Observações Gerais (LGPD)
- **Retenção e Anonimização (RNF-006):** cadastros (`citizens`) sem nenhum atendimento (`attendances`) registrado há mais de **1 ano** devem ser anonimizados (campo `deleted_at` preenchido + anonimização dos campos de identificação/contato), preservando a integridade referencial do histórico de atendimentos para fins estatísticos. Implementar como job agendado. *(Confirmar com jurídico/DPO se o prazo de 1 ano atende integralmente aos princípios da LGPD antes de ir para produção — ver `questions.md` #10.)*
- **Consentimento:** o registro de consentimento **não será digitalizado** neste momento — a coleta é feita de forma verbal ou por assinatura em papel pelo atendente no momento do cadastro presencial, fora do escopo do sistema (ver `questions.md` #11). Nenhum campo de consentimento foi adicionado ao esquema.
- Campo `users.is_active` (BOOLEAN, default true) recomendado para desativar acesso de funcionários sem apagar histórico de atendimentos vinculados a eles.