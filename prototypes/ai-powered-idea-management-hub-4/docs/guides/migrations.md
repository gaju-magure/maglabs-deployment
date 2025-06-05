# Database Migration Guide

This guide explains how to apply the SQL migrations contained in `supabase/migrations/`.

1. **Create a Supabase project** if you have not already.
2. **Run each migration file in order** using the Supabase SQL editor or the CLI:
   ```bash
   supabase db reset --linked
   supabase db push
   ```
   The migrations create the base tables (`users`, `ideas`, and related tables) and the additional tables for organizations, questionnaire responses, evaluations and workflow tracking.
3. **Seed initial users** using the helper scripts in `backend-python/`:
   ```bash
   cd backend-python
   python create_admin_user.py
   python create_auth_user.py
   ```

The new migration `00003_create_organizations_and_evaluation_tables.sql` introduces:

- `organizations` with foreign keys from `users` and `ideas`
- tables for questionnaire `responses` and `response_scores`
- assessment tables `idea_value_assessments` and `idea_quality_metrics`
- evaluation structures (`evaluation_rubrics`, `evaluation_criteria`, `evaluations`)
- workflow tracking (`workflow_events`, `smart_contract_logs`)

Each table includes indexes and Row Level Security policies consistent with the earlier migrations.
