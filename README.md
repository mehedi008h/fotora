# AI SaaS Photo Editor

A modern web-based photo editor powered by AI.  
Upload images, apply edits, and export high-quality results in seconds.

✨ Features

- One-click background removal
- Auto-enhance (lighting, color, sharpness)
- Smart object removal (AI inpainting)
- Crop, resize, rotate, and basic adjustments
- Export in PNG/JPEG/WebP
- Project dashboard with history
- Stripe-powered subscriptions & credits

🛠 Tech Stack

- **Frontend:** Next.js, React, TailwindCSS
- **Editor Engine:** Fabric.js (canvas manipulation)
- **Auth:** Clerk
- **Backend & Data:** Convex (serverless database + functions)
- **Storage & CDN:** ImageKit
- **AI Services:** (optional) OpenAI / Replicate / custom models for inpainting & auto-enhance

🚀 Roadmap

- Batch photo editing
- Team workspaces & collaboration
- Generative fill & AI style transfer
- Mobile-optimized editor
- Public API for automation

💳 Pricing Model

- Free tier with limited edits
- Subscription & credit-based plans
- Enterprise support on request

📌 Getting Started

1. Clone this repo
2. Install dependencies: `npm install`
3. Set up your `.env` with DB, Stripe, and ImageKit keys
4. Run locally: `npm run dev`
5. Run Convex: `npx run convex`
