# Campaign API Mapping

## Overview

Base path: `/api/campaigns`

This API is used for the Campaign List Page and Campaign Detail Page.  
All detail, update, status, publish, and delete endpoints use `title + city` instead of `id`.

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

`GET /api/campaigns/detail`

### Access

Public

### Query Params

- `title` → campaign name
- `city` → campaign city

### Example

`/api/campaigns/detail?title=Campaign%20A&city=Jakarta`

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
  "data": {}
}
```

---

## 4. Update Campaign

### Endpoint

`PATCH /api/campaigns`

### Access

Require session

### Query Params

- `title`
- `city`

### Body

Same as `updateCampaignSchema`

### Example

`/api/campaigns?title=Campaign%20A&city=Jakarta`

### Response

```json
{
  "data": {}
}
```

---

## 5. Update Status

### Endpoint

`PATCH /api/campaigns/status`

### Access

Require session

### Query Params

- `title`
- `city`

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

`PATCH /api/campaigns/publish`

### Access

Require session

### Query Params

- `title`
- `city`

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

`DELETE /api/campaigns`

### Access

Require session

### Query Params

- `title`
- `city`

### Example

`/api/campaigns?title=Campaign%20A&city=Jakarta`

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

- `GET /api/campaigns/detail`

Required fields:

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
