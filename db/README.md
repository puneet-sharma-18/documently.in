# D1 database (usage events)

Stores anonymous tool-usage metadata posted to `/api/track`. Never file names, contents, IPs or full user agents.

```bash
# 1. Create the database (once) and copy the printed database_id into wrangler.toml
npx wrangler d1 create documently

# 2. Apply the schema to production
npx wrangler d1 execute documently --remote --file db/schema.sql

# 3. Local copy for `npx wrangler pages dev out`
npx wrangler d1 execute documently --local --file db/schema.sql
```

Then in Cloudflare Pages > documently > Settings > Bindings, add a **D1 database** binding named `DB` → `documently`
(Production and Preview), and add the `ADMIN_TOKEN` secret under Variables and Secrets.

Retention: the privacy policy promises 13 months. Prune monthly:

```bash
npx wrangler d1 execute documently --remote --command \
  "DELETE FROM events WHERE ts < (strftime('%s','now','-13 months') * 1000);"
```
