# Campaign API Mapping

## Overview

Base path: `/api/campaigns`

This API is used for the Campaign List Page and Campaign Detail Page.  
All detail, update, status, publish, and delete endpoints use `id` (UUID) path parameter.

---

## 1. Campaign List

### Endpoint

`GET /api/campaigns`

### Access

Public

### Query Params

- `search` → search by campaign name or city
- `city` → filter by city
- `type` → filter by house of worship type
- `status` → filter by campaign status
- `page` → pagination page number
- `limit` → items per page, default `12`

### Example

`/api/campaigns?search=mosque&city=Jakarta&type=Masjid&status=Aktif&page=1&limit=12`

### Response

```json
{
  "data": [],
  "total": 0,
  "page": 1,
  "limit": 12
}
```

---

## 2. Campaign Detail

### Endpoint

`GET /api/campaigns/{id}`

### Access

Public

### Path Params

- `id` → campaign UUID

### Example

`/api/campaigns/123e4567-e89b-12d3-a456-426614174000`

### Response

```json
{
  "data": {}
}
```

---

## 3. Create Campaign

### Endpoint

`POST /api/campaigns`

### Access

Require session

### Body

```json
{
  "title": "Campaign A",
  "description": "Campaign description",
  "targetIdr": "10000000",
  "panelCapacityKwp": "5",
  "estimatedKwhAnnual": "1200",
  "estimatedIdrSavings": "3000000",
  "coverImageUrl": "https://example.com/image.jpg",
  "deadline": "2026-12-31T23:59:59.000Z",
  "worshipPlaceName": "Al-Hikmah Mosque",
  "city": "Jakarta",
  "religionType": "Masjid"
}
```

### Response

```json
{
  "data": {
    "id": "123e4567-e89b-12d3-a456-426614174000"
  }
}
```

---

## 4. Update Campaign

### Endpoint

`PATCH /api/campaigns/{id}`

### Access

Require session

### Path Params

- `id` → campaign UUID

### Body

Same as `updateCampaignSchema` (all fields optional)

### Example

`PATCH /api/campaigns/123e4567-e89b-12d3-a456-426614174000`

### Response

```json
{
  "data": {}
}
```

---

## 5. Update Status

### Endpoint

`PATCH /api/campaigns/{id}/status`

### Access

Require session

### Path Params

- `id` → campaign UUID

### Body

```json
{
  "status": "Aktif"
}
```

### Response

```json
{
  "data": {}
}
```

---

## 6. Publish Campaign

### Endpoint

`PATCH /api/campaigns/{id}/publish`

### Access

Require session

### Path Params

- `id` → campaign UUID

### Body

```json
{
  "isPublished": true
}
```

### Response

```json
{
  "data": {}
}
```

---

## 7. Delete Campaign

### Endpoint

`DELETE /api/campaigns/{id}`

### Access

Require session

### Path Params

- `id` → campaign UUID

### Example

`DELETE /api/campaigns/123e4567-e89b-12d3-a456-426614174000`

### Response

```json
{
  "success": true
}
```

---

## UI Mapping

### Campaign List Page

Use data from:

- `GET /api/campaigns`

Required card fields:

- `coverImageUrl`
- `worshipPlaceName`
- `city`
- `religionType`
- `raisedIdr`
- `targetIdr`
- `deadline`
- `status`

### Campaign Detail Page

Use data from:

- `GET /api/campaigns/{id}`

Required fields:

- `id`
- `title`
- `description`
- `coverImageUrl`
- `worshipPlaceName`
- `city`
- `religionType`
- `status`
- `targetIdr`
- `raisedIdr`
- `donorCount`
- `deadline`
- `panelCapacityKwp`
- `estimatedKwhAnnual`
- `estimatedIdrSavings`

---

## Notes

- Filter state must persist in the URL query params.
- Campaigns with status `Selesai` should be shown separately in a lower section.
- Energy dashboard is only visible when campaign status is `Selesai`.
- Transparency report and donor list are public and do not require login.
