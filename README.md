# SpendWise (Stage 1)

## Run on Windows (VS Code terminal)
1. Install Node.js 20 LTS from nodejs.org.
2. `cd spendwise`
3. `npm install`
4. `npm run dev` then open the URL it prints (usually http://localhost:5173).
5. Check the build: `npm run build`

## Deploy to Vercel
Import the repo in Vercel (framework: Vite). Add `vercel.json` rewrites so deep links work:
`{ "rewrites": [{ "source": "/(.*)", "destination": "/" }] }`
