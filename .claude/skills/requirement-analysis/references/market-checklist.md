# Market-Standard Checklist — API Endpoint Builders

What comparable products (Xano, Supabase, AWS API Gateway, Postman) do.
If our requirements don't mention an item, raise it as a gap — it does
NOT mean we must build it, only that someone must decide.

## Endpoint creation
- [ ] Endpoint name/path rules (allowed characters, max length, uniqueness per tenant)
- [ ] HTTP methods supported (GET/POST/PUT/PATCH/DELETE)
- [ ] What happens on duplicate name/path
- [ ] Limit on number of endpoints per customer/plan
- [ ] States of an endpoint (e.g. draft → active → deleted)

## Auto-generated Swagger / OpenAPI docs
- [ ] OpenAPI version (3.0 / 3.1)
- [ ] Who can view the docs (public, logged-in customer only, key holders)
- [ ] "Try it out" works with an API key
- [ ] Docs update when an endpoint is created and deleted
- [ ] Request/response examples shown
- [ ] Download/export of the spec (JSON/YAML)

## API keys
- [ ] Key is shown only once at creation (then masked)
- [ ] Key stored hashed, never in plain text
- [ ] Where the key is sent (header name, e.g. `x-api-key` or `Authorization: Bearer`)
- [ ] Key expiry date
- [ ] Key rotation (new key without downtime)
- [ ] Key revocation — and how fast it takes effect
- [ ] Key scopes/permissions (read-only vs read-write, per endpoint)
- [ ] Number of keys allowed per customer

## Security
- [ ] Tenant isolation — customer A can never reach customer B's endpoints or keys
- [ ] Response for another tenant's resource: 403 or 404?
- [ ] Rate limiting per key (and the response: 429 + `Retry-After`)
- [ ] Usage quotas per plan
- [ ] Max request payload size
- [ ] CORS rules for browser callers
- [ ] Error messages don't leak internals (stack traces, SQL)
- [ ] HTTPS only

## Operations
- [ ] Audit log (who created/deleted endpoints and keys)
- [ ] Usage logs / analytics per key
- [ ] Consistent error response format
- [ ] API versioning
- [ ] Webhooks / notifications (e.g. key about to expire)
