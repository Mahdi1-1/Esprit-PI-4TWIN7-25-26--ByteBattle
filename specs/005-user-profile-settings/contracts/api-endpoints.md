# API Contracts: User Profile & Settings

**Branch**: `005-user-profile-settings`
**Date**: 2026-03-25
**Base URL**: `http://localhost:4000/api`
**Auth**: All endpoints require `Authorization: Bearer <JWT>` unless marked PUBLIC.

---

## 1. Update User Profile

Updates profile fields (bio, editor theme, preferred language, username).

**Endpoint**: `PATCH /api/users/me`  
**Auth**: Required (JwtAuthGuard)  
**Existing**: Yes — extend current `UpdateUserDto`

### Request Body
```json
{
  "bio": "Passionate developer",
  "editorTheme": "dracula",
  "preferredLanguage": "fr",
  "username": "newUsername"
}
```
All fields optional. Only provided fields are updated.

### Validation
| Field | Rule |
|-------|------|
| `bio` | Optional, max 250 chars |
| `editorTheme` | Optional, must be one of: `vs-dark`, `vs`, `monokai`, `github-dark`, `dracula`, `one-dark-pro`, `solarized-dark`, `solarized-light` |
| `preferredLanguage` | Optional, must be `en` or `fr` |
| `username` | Optional, string |

### Response `200 OK`
```json
{
  "id": "...",
  "email": "user@example.com",
  "username": "newUsername",
  "bio": "Passionate developer",
  "editorTheme": "dracula",
  "preferredLanguage": "fr",
  "profileImage": "/api/users/photo/userId.webp",
  "...": "all User fields except passwordHash"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 400 | Validation error (bio too long, invalid theme, etc.) |

---

## 2. Upload Profile Photo

Upload a profile photo image. Replaces existing photo if present.

**Endpoint**: `POST /api/users/me/photo`  
**Auth**: Required (JwtAuthGuard)  
**Content-Type**: `multipart/form-data`  
**NEW endpoint**

### Request
```
Content-Type: multipart/form-data
file: <binary image data> (field name: "file")
```

### Validation
| Rule | Value |
|------|-------|
| Accepted MIME types | `image/jpeg`, `image/png`, `image/webp` |
| Max file size | 5 MB |
| Max files | 1 |

### Response `200 OK`
```json
{
  "profileImage": "/api/users/photo/userId.webp",
  "message": "Profile photo updated successfully"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 400 | No file provided |
| 413 | File exceeds 5 MB |
| 415 | Unsupported file type |

---

## 3. Delete Profile Photo

Remove the user's profile photo and revert to DiceBear fallback.

**Endpoint**: `DELETE /api/users/me/photo`  
**Auth**: Required (JwtAuthGuard)  
**NEW endpoint**

### Response `200 OK`
```json
{
  "profileImage": null,
  "message": "Profile photo removed"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

## 4. Change Password

Change the user's password after verifying the current one.

**Endpoint**: `PATCH /api/users/me/password`  
**Auth**: Required (JwtAuthGuard)  
**Rate Limit**: 5 requests / 15 minutes  
**NEW endpoint**

### Request Body
```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewSecure456@"
}
```

### Validation
| Field | Rule |
|-------|------|
| `currentPassword` | Required, verified against stored hash |
| `newPassword` | Required, min 8 chars, 1 uppercase, 1 digit, 1 special char |

### Response `200 OK`
```json
{
  "message": "Password changed successfully"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 400 | New password does not meet requirements |
| 403 | Current password incorrect |
| 403 | Account is OAuth-only (no password to change) |
| 429 | Rate limit exceeded |

---

## 5. Change Email

Change the user's email after verifying their password.

**Endpoint**: `PATCH /api/users/me/email`  
**Auth**: Required (JwtAuthGuard)  
**Rate Limit**: 5 requests / 15 minutes  
**NEW endpoint**

### Request Body
```json
{
  "currentPassword": "MyPass123!",
  "newEmail": "newemail@example.com"
}
```

### Validation
| Field | Rule |
|-------|------|
| `currentPassword` | Required, verified against stored hash |
| `newEmail` | Required, valid email format, not already in use |

### Response `200 OK`
```json
{
  "email": "newemail@example.com",
  "message": "Email changed successfully"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 400 | Invalid email format |
| 403 | Current password incorrect |
| 403 | Account is OAuth-only |
| 409 | Email already in use by another account |
| 429 | Rate limit exceeded |

---

## 6. Get Profile Statistics

Get comprehensive statistics for the current user's profile.

**Endpoint**: `GET /api/users/me/stats`  
**Auth**: Required (JwtAuthGuard)  
**NEW endpoint**

### Response `200 OK`
```json
{
  "elo": 1450,
  "xp": 3200,
  "level": 4,
  "duelsWon": 15,
  "duelsLost": 8,
  "duelsTotal": 23,
  "winRate": 65.2,
  "challengesSolved": 42,
  "forumPosts": 12,
  "commentsCount": 34,
  "leaderboardPosition": 27,
  "joinedAt": "2026-01-15T10:00:00Z",
  "lastLogin": "2026-03-25T15:30:00Z"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |

---

## 7. Delete Account

Permanently delete the user's account after password verification.

**Endpoint**: `DELETE /api/users/me`  
**Auth**: Required (JwtAuthGuard)  
**NEW endpoint**

### Request Body
```json
{
  "currentPassword": "MyPass123!",
  "confirmation": "DELETE"
}
```

### Validation
| Field | Rule |
|-------|------|
| `currentPassword` | Required, verified against stored hash |
| `confirmation` | Required, must be exactly `"DELETE"` |

### Response `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

### Errors
| Status | Condition |
|--------|-----------|
| 401 | Not authenticated |
| 403 | Password incorrect |
| 400 | Confirmation text does not match "DELETE" |

---

## 8. Serve Profile Photo (Static File)

Serve uploaded profile photo files.

**Endpoint**: `GET /api/users/photo/:filename`  
**Auth**: PUBLIC (no auth required — images are public)  
**Headers**: `Cache-Control: public, max-age=3600`  
**NEW endpoint**

### Response `200 OK`
Binary image data with appropriate `Content-Type` header.

### Errors
| Status | Condition |
|--------|-----------|
| 404 | File not found |
