# Nova AI

Independent AI application. This repository is intentionally separate from Prince-Resume.

## Included now
- Original Nova interface and CSS-rendered face/avatar
- Chat UI and conversation history
- Local long-term memory with remember/forget
- Local notes
- Calculator tool
- Workspace export/import
- Browser voice input/output
- Provider switch: local tools or Google Gemini
- No secrets committed to GitHub

## Roadmap
The app is designed as independent modules: web search, GitHub, files/PDFs, vision, RAG knowledge base, model routing, local models, automation, calendar/email integrations, permissions/confirmations, streaming, wake-word voice and a richer 3D avatar.

For a public deployment, do not put a private API key in frontend code. Use a server-side provider proxy or let each user bring their own key.