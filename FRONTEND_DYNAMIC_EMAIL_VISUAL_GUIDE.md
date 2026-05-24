# Dynamic Email Node Configuration - Visual Reference Guide

## Frontend Flow Diagram

```
User Opens Email Node
    ↓
Sees Configuration Panel
    ↓
Provider Selector Dropdown appears
(required field *)
    ↓
User selects Provider: e.g., "SMTP"
    ↓
renderConfigField() called for each field
    ↓
For each field:
├─ Check if field.condition exists?
│  ├─ YES: Evaluate condition(config)
│  │  ├─ Returns TRUE: Render field ✓
│  │  └─ Returns FALSE: Skip field (return null)
│  └─ NO: Always render field ✓
    ↓
Display all applicable fields
with proper input types & validation
    ↓
User fills in values
    ↓
Workflow saved with configuration
```

---

## UI Appearance Example

### When User Selects SMTP Provider

```
┌─────────────────────────────────────────┐
│  Email Node Configuration               │
├─────────────────────────────────────────┤
│                                         │
│  Provider *                             │
│  ┌──────────────────────────────────┐   │
│  │ ▼ smtp                           │   │ ← User selected this
│  └──────────────────────────────────┘   │
│                                         │
│  SMTP Host *                            │
│  ┌──────────────────────────────────┐   │
│  │ smtp.gmail.com                   │   │ ← Appears because
│  └──────────────────────────────────┘   │   Provider === 'smtp'
│  Help: e.g., smtp.gmail.com             │
│                                         │
│  SMTP Port *                            │
│  ┌──────────────────────────────────┐   │
│  │ 587                              │   │ ← Appears because
│  └──────────────────────────────────┘   │   Provider === 'smtp'
│  Help: e.g., 587 for Gmail              │
│                                         │
│  SMTP Secure                            │
│  ☐ Use TLS/SSL encryption           │   │ ← Appears because
│                                         │   Provider === 'smtp'
│                                         │
│  SMTP User *                            │
│  ┌──────────────────────────────────┐   │
│  │ your-email@gmail.com             │   │ ← Appears because
│  └──────────────────────────────────┘   │   Provider === 'smtp'
│  Help: Your email address               │
│                                         │
│  SMTP Password *                        │
│  ┌──────────────────────────────────┐   │
│  │ ••••••••••••••••••••••••••        │   │ ← Appears because
│  └──────────────────────────────────┘   │   Provider === 'smtp'
│  Help: Your password or app password    │
│                                         │
│  ─────────────────────────────────────  │
│  COMMON FIELDS (Always shown):          │
│  ─────────────────────────────────────  │
│                                         │
│  From                                   │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │ ← Always shown
│  └──────────────────────────────────┘   │ ← (optional for SMTP)
│                                         │
│  To *                                   │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │ ← Always shown
│  └──────────────────────────────────┘   │ ← (required)
│                                         │
│  Subject *                              │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │ ← Always shown
│  └──────────────────────────────────┘   │ ← (required)
│                                         │
│  Body *                                 │
│  ┌──────────────────────────────────┐   │
│  │                                  │   │ ← Always shown
│  │                                  │   │ ← (required)
│  │                                  │   │   (textarea)
│  └──────────────────────────────────┘   │
│                                         │
│  Is HTML                                │
│  ☑ Treat body as HTML                   │ ← Always shown
│                                         │ ← (optional)
│                                         │
│  Attachments                            │
│  ┌──────────────────────────────────┐   │
│  │ [{"filename":"file.pdf",...}]    │   │ ← Always shown
│  └──────────────────────────────────┘   │ ← (optional)
│                                         │
│              [Save] [Cancel]            │
└─────────────────────────────────────────┘
```

---

## What Happens When User Changes Provider

### Before: Provider = "SMTP" (showing SMTP fields)

```
[Provider: SMTP          ▼]
[SMTP Host:              ]  ← Visible
[SMTP Port:              ]  ← Visible
[SMTP Secure: ☐        ]   ← Visible
[SMTP User:              ]  ← Visible
[SMTP Password:          ]  ← Visible
[From:                   ]  ← Common, always visible
[To:                     ]  ← Common, always visible
[Subject:                ]  ← Common, always visible
[Body:                   ]  ← Common, always visible
```

### User changes to: Provider = "SendGrid" (Provider dropdown clicked)

```
1. User clicks Provider dropdown
2. Changes from "SMTP" → "SendGrid"
3. renderGenericNodeConfig() called again
4. All fields re-evaluated:
   - SMTP Host: condition(config.Provider === 'sendgrid') = FALSE → Hidden
   - SMTP Port: condition(config.Provider === 'sendgrid') = FALSE → Hidden
   - SMTP Secure: condition(config.Provider === 'sendgrid') = FALSE → Hidden
   - SMTP User: condition(config.Provider === 'sendgrid') = FALSE → Hidden
   - SMTP Password: condition(config.Provider === 'sendgrid') = FALSE → Hidden
   - SendGrid API Key: condition(config.Provider === 'sendgrid') = TRUE → Shown
   - SendGrid From Email: condition(config.Provider === 'sendgrid') = TRUE → Shown
   - Common fields: no condition → Always shown
```

### After: Provider = "SendGrid" (showing SendGrid fields)

```
[Provider: SendGrid      ▼]
[SendGrid API Key:       ]  ← Visible (appeared)
[SendGrid From Email:    ]  ← Visible (appeared)
[From:                   ]  ← Common, always visible
[To:                     ]  ← Common, always visible
[Subject:                ]  ← Common, always visible
[Body:                   ]  ← Common, always visible
```

---

## Code Architecture

### Frontend Type Definition

```typescript
export type AgentNodeTypeField = {
  l: string; // Label
  t: string; // Type (text, number, select, etc)
  o?: string[]; // Options (for select)
  h?: string; // Help text
  required?: boolean; // Is required?
  condition?: (configValues: Record<string, any>) => boolean; // ← NEW!
};
```

### Conditional Field Example

```typescript
{
  l: 'SMTP Host',
  t: 'text',
  h: 'e.g., smtp.gmail.com',
  required: true,
  condition: (config: any) => config.Provider === 'smtp',  // ← Shows if SMTP selected
}
```

### Rendering Logic

```typescript
const renderConfigField = (node: Node<any>, field: AgentNodeTypeField) => {
  // ← NEW: Check condition
  if (field.condition) {
    const shouldShow = field.condition(node.data?.config || {});
    if (!shouldShow) return null;  // ← Hide field
  }

  // ... render field UI ...
};

const renderGenericNodeConfig = (node: Node<any>) => {
  return (
    <div className="space-y-4">
      {metadata.configs
        .map(field => renderConfigField(node, field))
        .filter(Boolean)  // ← Remove null values (hidden fields)
      }
    </div>
  );
};
```

---

## Email Node Configuration Structure

### SMTP Fields Section

```typescript
{
  l: 'SMTP Host',
  t: 'text',
  h: 'e.g., smtp.gmail.com',
  required: true,
  condition: (config: any) => config.Provider === 'smtp',
},
{
  l: 'SMTP Port',
  t: 'number',
  h: 'e.g., 587 for Gmail',
  required: true,
  condition: (config: any) => config.Provider === 'smtp',
},
// ... more SMTP fields ...
```

### SendGrid Fields Section

```typescript
{
  l: 'SendGrid API Key',
  t: 'password',
  h: 'Your SendGrid API key (SG.xxxxx)',
  required: true,
  condition: (config: any) => config.Provider === 'sendgrid',
},
{
  l: 'SendGrid From Email',
  t: 'text',
  h: 'Verified sender email (e.g., noreply@domain.com)',
  required: true,
  condition: (config: any) => config.Provider === 'sendgrid',
},
```

### Mailgun Fields Section

```typescript
{
  l: 'Mailgun API Key',
  t: 'password',
  h: 'Your Mailgun API key (key-xxxxx)',
  required: true,
  condition: (config: any) => config.Provider === 'mailgun',
},
{
  l: 'Mailgun Domain',
  t: 'text',
  h: 'Your Mailgun domain (e.g., mg.yourdomain.com)',
  required: true,
  condition: (config: any) => config.Provider === 'mailgun',
},
```

### AWS SES Fields Section

```typescript
{
  l: 'AWS Region',
  t: 'text',
  h: 'AWS region (e.g., us-east-1)',
  required: true,
  condition: (config: any) => config.Provider === 'ses',
},
{
  l: 'AWS Access Key',
  t: 'password',
  h: 'AWS Access Key ID',
  required: true,
  condition: (config: any) => config.Provider === 'ses',
},
{
  l: 'AWS Secret Key',
  t: 'password',
  h: 'AWS Secret Access Key',
  required: true,
  condition: (config: any) => config.Provider === 'ses',
},
```

### Common Fields (No Condition)

```typescript
{
  l: 'From',
  t: 'text',
  h: 'Sender email address (optional if set in provider config)',
  // NO condition = always shown
},
{
  l: 'To',
  t: 'text',
  h: 'Recipient email addresses (comma-separated for multiple)',
  required: true,
  // NO condition = always shown
},
{
  l: 'Subject',
  t: 'text',
  h: 'Email subject line',
  required: true,
  // NO condition = always shown
},
// ... more common fields ...
```

---

## Backend Configuration Extraction

### Frontend Sends (Space-Separated Keys)

```json
{
  "Provider": "smtp",
  "SMTP Host": "smtp.gmail.com",
  "SMTP Port": 587,
  "SMTP Secure": false,
  "SMTP User": "email@gmail.com",
  "SMTP Password": "app_password",
  "To": "recipient@example.com",
  "Subject": "Daily Report",
  "Body": "Report content",
  "Is HTML": true,
  "Attachments": "[]"
}
```

### normalizeEmailConfig() Converts To (CamelCase)

```json
{
  "provider": "smtp",
  "smtpHost": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecure": false,
  "smtpUser": "email@gmail.com",
  "smtpPassword": "app_password",
  "to": "recipient@example.com",
  "subject": "Daily Report",
  "body": "Report content",
  "isHtml": true,
  "attachments": "[]"
}
```

### Backend emailActionHandler Uses

```typescript
const provider = config.provider; // "smtp"
const smtpConfig = {
  host: config.smtpHost, // "smtp.gmail.com"
  port: config.smtpPort, // 587
  secure: config.smtpSecure, // false
  auth: {
    user: config.smtpUser, // "email@gmail.com"
    pass: config.smtpPassword, // "app_password"
  },
};
const emailOptions = {
  to: config.to, // "recipient@example.com"
  subject: config.subject, // "Daily Report"
  body: config.body, // "Report content"
  html: config.isHtml, // true
  smtpConfig,
  provider,
};
await sendEmail(emailOptions); // Send via provider
```

---

## Testing Flow

### Test 1: Provider Selection

```
1. Open email node
2. See empty Provider dropdown
3. Click dropdown
4. See options: smtp, sendgrid, mailgun, ses
5. Select "smtp"
6. Verify SMTP fields appear ✓
```

### Test 2: Provider Switching

```
1. Provider = "smtp"
   - SMTP fields visible ✓
   - Common fields visible ✓
2. Change to "sendgrid"
   - SMTP fields disappear ✓
   - SendGrid fields appear ✓
   - Common fields still visible ✓
3. Change to "mailgun"
   - SendGrid fields disappear ✓
   - Mailgun fields appear ✓
4. Change back to "smtp"
   - Mailgun fields disappear ✓
   - SMTP fields appear ✓
```

### Test 3: Configuration Extraction

```
1. Fill SMTP config
2. Save workflow
3. Execute workflow
4. Backend normalizes config ✓
5. Extracts SMTP credentials ✓
6. Sends email via SMTP ✓
7. Check logs for success ✓
```

---

## Key Benefits

✅ **Clean UI** - Only show relevant fields  
✅ **Better UX** - Less overwhelming configuration  
✅ **Type-Safe** - TypeScript validates conditions  
✅ **Extensible** - Easy to add new providers  
✅ **Maintainable** - Conditions clearly show field visibility logic  
✅ **Documented** - Help text for each field  
✅ **Flexible** - Support multiple email providers with one node

---

## Summary

- **What**: Dynamic field visibility based on provider selection
- **How**: Conditional functions evaluated during rendering
- **Result**: Clean, provider-specific configuration UI
- **Status**: ✅ Complete and production-ready
