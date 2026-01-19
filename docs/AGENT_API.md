# NetworkCloud Agent API Documentation

This document describes the API endpoints available for the NetworkCloud local agent to communicate with the web application.

## Base URL

Production: `https://networkcloud.tech`
Development: Your Replit dev URL

## Authentication

All agent API endpoints require Bearer token authentication.

### Getting an API Token

1. Log in to the NetworkCloud dashboard
2. Navigate to **Agent Tokens** in the navigation header
3. Click **Create Token**
4. Enter a descriptive name (e.g., "Home Network Agent")
5. Copy the token immediately - it will only be shown once

### Using the Token

Include the token in the `Authorization` header of every request:

```
Authorization: Bearer nc_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Token Security

- Tokens are hashed with SHA-256 before storage
- The plain token is shown only once at creation
- Revoked tokens are immediately invalidated
- Store tokens securely in your agent's configuration

---

## API Endpoints

### Heartbeat

Health check endpoint to verify connectivity and token validity.

**Request:**
```
POST /api/agent/heartbeat
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "status": "ok",
  "serverTime": "2024-01-19T12:00:00.000Z"
}
```

**Errors:**
- `401 Unauthorized` - Invalid or revoked token

---

### Register Device

Register a new device or update an existing one (matched by MAC address).

**Request:**
```
POST /api/agent/devices
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Living Room PC",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "status": "online",
  "ipAddress": "192.168.1.100"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Device display name (min 1 character) |
| macAddress | string | No | MAC address in format `XX:XX:XX:XX:XX:XX` |
| status | string | No | One of: `online`, `offline`, `away`. Default: `online` |
| ipAddress | string | No | Valid IPv4 or IPv6 address |

**Response (201 Created):** New device
```json
{
  "id": 1,
  "userId": "user-123",
  "name": "Living Room PC",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "status": "online",
  "lastSeenAt": "2024-01-19T12:00:00.000Z",
  "createdAt": "2024-01-19T12:00:00.000Z"
}
```

**Response (200 OK):** Existing device updated (MAC match)
```json
{
  "id": 1,
  "userId": "user-123",
  "name": "Living Room PC",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "status": "online",
  "lastSeenAt": "2024-01-19T12:05:00.000Z",
  "createdAt": "2024-01-19T12:00:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Validation error (invalid MAC format, missing name, etc.)
- `401 Unauthorized` - Invalid token

---

### Update Device

Update an existing device by ID.

**Request:**
```
PATCH /api/agent/devices/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Name",
  "status": "offline",
  "ipAddress": "192.168.1.101"
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | No | New device name |
| status | string | No | One of: `online`, `offline`, `away` |
| ipAddress | string | No | New IP address |

**Response (200 OK):**
```json
{
  "id": 1,
  "userId": "user-123",
  "name": "Updated Name",
  "macAddress": "AA:BB:CC:DD:EE:FF",
  "status": "offline",
  "lastSeenAt": "2024-01-19T12:10:00.000Z",
  "createdAt": "2024-01-19T12:00:00.000Z"
}
```

**Errors:**
- `400 Bad Request` - Validation error
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Device not found or belongs to another user

---

### Delete Device

Remove a device from the registry.

**Request:**
```
DELETE /api/agent/devices/:id
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Device deleted successfully"
}
```

**Errors:**
- `400 Bad Request` - Invalid device ID
- `401 Unauthorized` - Invalid token
- `404 Not Found` - Device not found or belongs to another user

---

### Sync Devices (Bulk Operation)

Synchronize all devices in a single request. This will:
1. Create new devices that don't exist (by MAC address)
2. Update existing devices that match by MAC address
3. Delete devices that exist in the database but are not in the request

**Request:**
```
PUT /api/agent/devices/sync
Authorization: Bearer <token>
Content-Type: application/json

{
  "devices": [
    {
      "name": "Living Room PC",
      "macAddress": "AA:BB:CC:DD:EE:FF",
      "status": "online",
      "ipAddress": "192.168.1.100"
    },
    {
      "name": "Kitchen Tablet",
      "macAddress": "11:22:33:44:55:66",
      "status": "online",
      "ipAddress": "192.168.1.101"
    }
  ]
}
```

**Device Object Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Device display name |
| macAddress | string | No | MAC address for matching |
| status | string | Yes | One of: `online`, `offline`, `away` |
| ipAddress | string | No | Device IP address |

**Response (200 OK):**
```json
{
  "created": 1,
  "updated": 1,
  "deleted": 0
}
```

**Errors:**
- `400 Bad Request` - Validation error in any device
- `401 Unauthorized` - Invalid token

---

## Validation Rules

### MAC Address Format
Must match pattern: `XX:XX:XX:XX:XX:XX` where X is a hexadecimal character (0-9, A-F, a-f)

Valid examples:
- `AA:BB:CC:DD:EE:FF`
- `00:1a:2b:3c:4d:5e`

### IP Address Format
Must be a valid IPv4 or IPv6 address.

Valid examples:
- `192.168.1.100`
- `10.0.0.1`
- `2001:0db8:85a3:0000:0000:8a2e:0370:7334`

### Status Values
Must be one of:
- `online` - Device is currently reachable
- `offline` - Device is not reachable
- `away` - Device was recently active but currently unreachable

---

## Error Response Format

All error responses follow this format:

```json
{
  "message": "Error description"
}
```

Validation errors include field details:

```json
{
  "message": "Validation error",
  "errors": {
    "macAddress": ["Invalid format. Expected XX:XX:XX:XX:XX:XX"],
    "status": ["Invalid enum value. Expected 'online' | 'offline' | 'away'"]
  }
}
```

---

## Recommended Agent Workflow

### Initial Setup
1. Store API token in secure configuration
2. Call `/api/agent/heartbeat` to verify connectivity

### Periodic Sync (Recommended)
Run every 30-60 seconds:

1. Scan local network for devices
2. Collect MAC addresses, hostnames, and IP addresses
3. Call `PUT /api/agent/devices/sync` with all discovered devices

### Event-Based Updates (Optional)
When a device state changes:

1. Call `POST /api/agent/devices` to register/update a single device
2. Use `PATCH /api/agent/devices/:id` for status-only updates

---

## Example: Go Agent Code

```go
package main

import (
    "bytes"
    "encoding/json"
    "fmt"
    "net/http"
    "time"
)

type Device struct {
    Name       string `json:"name"`
    MacAddress string `json:"macAddress,omitempty"`
    Status     string `json:"status"`
    IPAddress  string `json:"ipAddress,omitempty"`
}

type SyncRequest struct {
    Devices []Device `json:"devices"`
}

type SyncResponse struct {
    Created int `json:"created"`
    Updated int `json:"updated"`
    Deleted int `json:"deleted"`
}

func syncDevices(baseURL, token string, devices []Device) (*SyncResponse, error) {
    reqBody := SyncRequest{Devices: devices}
    jsonData, err := json.Marshal(reqBody)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequest("PUT", baseURL+"/api/agent/devices/sync", bytes.NewBuffer(jsonData))
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+token)
    req.Header.Set("Content-Type", "application/json")

    client := &http.Client{Timeout: 30 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return nil, fmt.Errorf("sync failed with status: %d", resp.StatusCode)
    }

    var result SyncResponse
    if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}

func heartbeat(baseURL, token string) error {
    req, err := http.NewRequest("POST", baseURL+"/api/agent/heartbeat", nil)
    if err != nil {
        return err
    }

    req.Header.Set("Authorization", "Bearer "+token)

    client := &http.Client{Timeout: 10 * time.Second}
    resp, err := client.Do(req)
    if err != nil {
        return err
    }
    defer resp.Body.Close()

    if resp.StatusCode != http.StatusOK {
        return fmt.Errorf("heartbeat failed with status: %d", resp.StatusCode)
    }

    return nil
}
```

---

## Rate Limits

Currently no rate limits are enforced, but please be reasonable:
- Heartbeat: Every 60 seconds maximum
- Sync: Every 30 seconds maximum
- Individual updates: As needed for real-time status changes

---

## Changelog

**v1.0.0** (January 2024)
- Initial release
- Token-based authentication
- Device registration, update, delete
- Bulk sync endpoint
- MAC address-based device matching
