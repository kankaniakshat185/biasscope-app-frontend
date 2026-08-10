# Privacy Policy

**Last updated:** August 2026

BiasScope ("we," "the app") is a news-intelligence research tool. This document explains, plainly and completely, what data it collects, why, and where it goes. If a data flow isn't described here, it doesn't happen — we'd rather this document be short and accurate than long and vague.

## 1. What we collect

**Account data.** If you sign up with email and password, we store your email, your name, and a hashed password (via [Better Auth](https://www.better-auth.com/)) — we never store or see your password in plain text. If you sign in with Google, we receive your name, email, and Google account ID from Google, and store those; we never see your Google password.

**Session data.** A single session cookie identifies you to the app after sign-in. It is not a tracking cookie and is not shared with any third party.

**Search activity.** Every topic you search, and the resulting articles, claims, and analysis, are stored so the result can be revisited later. If you're signed in, searches are associated with your account and appear in your `/history`. If you're not signed in, a search still runs and its result is still stored (so its link works), but it isn't tied to an identity.

**Subscriptions.** If you subscribe to a topic for weekly drift tracking, we store which topic and how often to check it.

**What we do not collect:** we do not run any analytics, advertising, or tracking scripts of any kind — no Google Analytics, no Meta Pixel, no session-replay tools, no error-monitoring SDKs that phone home. We don't collect device fingerprints, ad identifiers, or precise location. We do not sell data, and we do not share data with data brokers or advertisers, because we don't have any relationship with any.

## 2. Search results are shareable by design

A BiasScope result has a stable, shareable URL. This is intentional, not an oversight: the point of the tool is a checkable analysis, and a link you can send someone is part of that. If you run a search on a sensitive or personal topic, keep in mind that anyone with the link can view that result page — the same way a shared Google Doc link works. Don't include personal identifying information in a search query if you don't want that query potentially visible to someone you share the link with.

## 3. Where your data goes

We use a small number of services to make the app work. Each one only receives the minimum it needs to do its job:

| Service | What it receives | Why |
|---|---|---|
| **Hugging Face Inference Router** | The text of articles and extracted claims for the topic you search | Runs the LLM (Qwen2.5-7B-Instruct) that extracts claims, generates summaries, and powers the narrative/chat features. Identical prompts are cached, so the same text is never sent twice. |
| **NewsAPI / GDELT** | Your search query (topic keywords) | Source the news articles that get analyzed. We don't send your identity — just the topic. |
| **Google** (only if you use "Sign in with Google") | OAuth handshake | Authenticates you without us ever seeing a Google password. |
| **Resend** | Your email address | Sends the account-verification email on sign-up. |
| **Neon (PostgreSQL)** | Everything above, at rest | Our database host — where accounts, sessions, searches, and results are stored. |
| **Vercel** | Standard web request logs | Hosts this frontend. Vercel may log request metadata (IP, timestamp) as part of normal hosting operations, per [Vercel's privacy policy](https://vercel.com/legal/privacy-policy). |
| **Hugging Face Spaces** | API requests routed from this app | Hosts the backend pipeline. See [Hugging Face's privacy policy](https://huggingface.co/privacy) for their own handling of infrastructure-level logs. |

We don't control what these providers do with infrastructure-level logs (e.g., an IP address in a web server access log) — that's governed by their own privacy policies, linked above where available.

## 4. Cookies

One cookie: the Better Auth session cookie, used to keep you signed in. No third-party or advertising cookies are set by this app.

## 5. Your data, your control

- **Access:** your search history is visible to you at `/history` whenever you're signed in.
- **Deletion:** there's no self-service "delete my account" button yet. If you want your account and associated data deleted, email us (contact below) and we'll delete it.
- **Anonymous use:** you can search without an account. Nothing ties that search to you personally, beyond whatever information might be present in the query itself or in standard hosting logs.

## 6. Changes to this policy

If this policy changes in a way that matters — a new third-party service, a new kind of data collected — we'll update the "Last updated" date above and, for material changes, note it in the app.

## 7. Contact

Questions, or a deletion request: **kankaniakshat185@gmail.com**

---

See also: [MIT License](./LICENSE) · [BiasScope HF Backend](https://github.com/kankaniakshat185/biasscope-hf-backend)
