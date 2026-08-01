# AI Architecture

## Current State (Phase 1: Rule-Based)
The current AI engine (`app/ai/engine.py`) relies on deterministic keyword and regex matching.
- **Goal:** Provide immediate value by auto-routing obvious issues (e.g., "pipe leak" -> Plumbing) while bootstrapping a labeled dataset via supervisor overrides.
- **Data Flow:** `Student Text` -> `AIEngine.predict()` -> Returns `Prediction(category, priority, department)`.

## Target State (Phase 2: Machine Learning)
Once sufficient data is collected (e.g., 1000+ tickets with supervisor overrides), we will migrate to a trained ML model.

### 1. Classification Model
- **Algorithm:** Fine-tuned lightweight LLM (e.g., DistilBERT) or a simple TF-IDF + XGBoost pipeline for text classification.
- **Training Data:** `description` (Input) mapped to `overridden_category`, `overridden_priority` (Labels).

### 2. Retrieval-Augmented Generation (RAG)
- **Goal:** Suggest solutions to Maintenance based on past resolved tickets.
- **Implementation:** 
  - Generate embeddings for ticket descriptions using OpenAI `text-embedding-3-small`.
  - Store embeddings in PostgreSQL using the `pgvector` extension.
  - When a new ticket arrives, query the nearest neighbors to fetch historical resolution notes.
