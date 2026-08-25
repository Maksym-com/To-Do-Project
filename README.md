# Little List

Simple Notion-style to-do app: Flask + PostgreSQL API on Render, React/Vite client on Vercel.

## Deploy API and database to Render

1. Push this repository to GitHub.
2. In Render, choose **New > Blueprint** and select the repository.
3. Render will read `render.yaml`, create the PostgreSQL database, and deploy `server` with Gunicorn.
4. After deployment, open the web service **Environment** settings and set `FRONTEND_URL` to the final Vercel URL, for example `https://little-list.vercel.app`.
5. Check the API at `https://YOUR-RENDER-SERVICE.onrender.com/`.

## Deploy client to Vercel

1. In Vercel, import the same repository.
2. Set **Root Directory** to `client`.
3. Add the environment variable `VITE_API_URL` with the Render service URL, without a trailing slash.
4. Deploy. The included `client/vercel.json` keeps client-side routes working.

## Local development

API:

```powershell
cd server
python -m pip install -r requirements.txt
python main.py
```

Client:

```powershell
cd client
npm install
npm run dev
```

Copy `client/.env.example` to `client/.env.local` when using a local API. The UI falls back to local storage if the API is unavailable.
