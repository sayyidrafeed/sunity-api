# API Spec — Missing Endpoints for Monitoring Integration

> Consumer: backend team + cheap LLM with codebase access.
> All `/admin/*` endpoints require Bearer token auth (admin role).
> All error responses follow the existing format: `{ error: { code: string, message: string } }`.
> All path params `id` and `campaignId` are UUIDs.

---

## 1. Bulk Upload Energy Data

Frontend needs to send multiple energy records in a single request (CSV import use case).

### Endpoint

```
POST /admin/campaigns/{id}/energy/bulk
```

### Path Parameters

| Name | Type            | Description |
| ---- | --------------- | ----------- |
| `id` | `string` (UUID) | Campaign ID |

### Request Body

```typescript
{
  records: Array<{
    month: string; // Format: "YYYY-MM" (e.g. "2026-05")
    kwhProduced: number; // >= 0
    idrSaved: number; // >= 0
    kgCo2Reduced: number; // >= 0
  }>;
}
```

Constraints:

- Array length: minimum 1, maximum 100 per request.
- `month` must match regex `/^\d{4}-(0[1-9]|1[0-2])$/`.
- No duplicate `month` values allowed within the same request.
- If a record already exists for a given `month`, the backend must overwrite the existing record (upsert behavior) — do NOT reject the entire batch.

### Success Response (201)

```typescript
{
  data: Array<{
    id: string; // UUID
    campaignId: string; // UUID
    month: string; // "YYYY-MM"
    kwhProduced: number;
    idrSaved: number;
    kgCo2Reduced: number;
    createdAt: string; // ISO8601
    updatedAt: string; // ISO8601
  }>;
  created: number; // Count of records created (first-time)
  updated: number; // Count of records that overwrote existing
}
```

### Error Responses

| Status | Condition                                                                          |
| ------ | ---------------------------------------------------------------------------------- |
| 400    | Invalid body (empty array, invalid month format, duplicate months, values below 0) |
| 401    | Unauthorized                                                                       |
| 403    | Forbidden (not admin)                                                              |
| 404    | Campaign not found                                                                 |

Error body:

```typescript
{ error: { code: string, message: string } }
```

---

## 2. Standardized `month` Field Format

### Format Specification

The `month` field on all Energy-related endpoints MUST follow the format:

```
YYYY-MM
```

- Regex validation: `/^\d{4}-(0[1-9]|1[0-2])$/`
- Example valid values: `"2026-01"`, `"2026-05"`, `"2026-12"`
- Example invalid values: `"2026-1"`, `"2026-13"`, `"2026/05"`, `"2026-5"`

### Affected Endpoints

This format applies to the `month` field in:

| Endpoint                                      | Location           |
| --------------------------------------------- | ------------------ |
| `POST /admin/campaigns/{id}/energy`           | Request body       |
| `PUT /admin/campaigns/{id}/energy`            | Request body       |
| `PATCH /admin/campaigns/{id}/energy/{month}`  | Path parameter     |
| `DELETE /admin/campaigns/{id}/energy/{month}` | Path parameter     |
| `POST /admin/campaigns/{id}/energy/bulk`      | Request body (new) |

When `month` appears as a path parameter (DELETE, PATCH), it MUST be the `YYYY-MM` string (not an index or numeric ID). The backend should interpret it as a string identifier, not a numeric value.
