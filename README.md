#  BiasScope | AI News Intelligence

BiasScope is a production-ready, full-stack machine learning data pipeline designed to pierce through modern media echo chambers. By algorithmically scraping real-time news sources, the platform runs deep-learning NLP tokenization to expose underlying political bias, aggregate sentiment scores, and generate overarching narrative summaries of world events.

### Core Architecture
* **Frontend:** Next.js, React, TailwindCSS, Better-Auth (Deployed on Vercel)
* **Backend:** Python, FastAPI, Prisma, Neon Serverless Postgres (Deployed on Hugging Face Spaces)
* **AI & Data Pipeline:** 
  * `newspaper3k` for asynchronous web-scraping and metadata extraction.
  * Native Hugging Face Transformer pipelines (`DistilBERT` / `PoliticalBiasBERT`) for zero-shot text classification.
  * Serverless **LLaMA-3 RAG** (Retrieval-Augmented Generation) allowing users to actively "Chat with the News" for context.
