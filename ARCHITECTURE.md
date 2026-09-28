# Nova Architecture

Nova is an independent AI application. It does not modify or depend on Prince-Resume.

## Core layers
- UI shell and avatar
- Conversation orchestrator
- Provider adapters (Gemini, future OpenAI-compatible/local providers)
- Memory and RAG adapters
- Tool registry
- Permission/confirmation engine
- Activity/audit log
- Integration adapters
- Voice and vision adapters
- Import/export and settings

## Principle
Providers and integrations are replaceable. Nova should degrade gracefully to local tools when no model is connected.

## Production note
Secrets must live server-side. Browser-direct API keys are suitable only for private bring-your-own-key development.