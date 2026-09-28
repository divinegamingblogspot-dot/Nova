# Nova server

Optional backend for production/private use. It keeps provider secrets off the browser and provides a stable API boundary for future web, GitHub, files, calendar, email, automation and vision adapters.

## Start
1. Copy .env.example to .env.
2. Add a provider key.
3. npm install
4. npm start

The frontend can be changed later to call /api/chat instead of sending provider keys from the browser. Add adapters behind the same permission and audit layer before enabling external actions.