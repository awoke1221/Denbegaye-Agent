# Dynamic Email Node Configuration - Update Guide

## Overview

The email action node in the frontend has been upgraded with **dynamic, provider-aware configuration fields**. When users select an email provider, only the relevant configuration fields for that provider are displayed.

---

## How It Works

### Configuration Flow

```
User selects Provider (SMTP)
    ↓
Frontend checks field.condition()
    ↓
Only SMTP-specific fields display:
  - SMTP Host
  - SMTP Port
  - SMTP Secure
  - SMTP User
  - SMTP Password
    ↓
Common fields display (always):
  - From
  - To
  - Subject
  - Body
  - Is HTML
  - Attachments
```

---

## Provider-Specific Fields

### 1. SMTP Configuration

**When Provider = "smtp"**

Displays these fields:

| Field         | Type     | Required | Help Text                                       |
| ------------- | -------- | -------- | ----------------------------------------------- |
| SMTP Host     | text     | Yes      | e.g., smtp.gmail.com                            |
| SMTP Port     | number   | Yes      | e.g., 587 for Gmail                             |
| SMTP Secure   | checkbox | No       | Use TLS/SSL encryption                          |
| SMTP User     | text     | Yes      | Your email address (e.g., your-email@gmail.com) |
| SMTP Password | password | Yes      | Your password or app password for Gmail         |

**Example Configuration:**

```json
{
  "Provider": "smtp",
  "SMTP Host": "smtp.gmail.com",
  "SMTP Port": 587,
  "SMTP Secure": false,
  "SMTP User": "your-email@gmail.com",
  "SMTP Password": "xxxxxxxxxxxxxxxx"
}
```

---

### 2. SendGrid Configuration

**When Provider = "sendgrid"**

Displays these fields:

| Field               | Type     | Required | Help Text                                        |
| ------------------- | -------- | -------- | ------------------------------------------------ |
| SendGrid API Key    | password | Yes      | Your SendGrid API key (SG.xxxxx)                 |
| SendGrid From Email | text     | Yes      | Verified sender email (e.g., noreply@domain.com) |

**Example Configuration:**

```json
{
  "Provider": "sendgrid",
  "SendGrid API Key": "SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "SendGrid From Email": "noreply@yourdomain.com"
}
```

---

### 3. Mailgun Configuration

**When Provider = "mailgun"**

Displays these fields:

| Field           | Type     | Required | Help Text                                     |
| --------------- | -------- | -------- | --------------------------------------------- |
| Mailgun API Key | password | Yes      | Your Mailgun API key (key-xxxxx)              |
| Mailgun Domain  | text     | Yes      | Your Mailgun domain (e.g., mg.yourdomain.com) |

**Example Configuration:**

```json
{
  "Provider": "mailgun",
  "Mailgun API Key": "key-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
  "Mailgun Domain": "mg.yourdomain.com"
}
```

---

### 4. AWS SES Configuration

**When Provider = "ses"**

Displays these fields:

| Field          | Type     | Required | Help Text                    |
| -------------- | -------- | -------- | ---------------------------- |
| AWS Region     | text     | Yes      | AWS region (e.g., us-east-1) |
| AWS Access Key | password | Yes      | AWS Access Key ID            |
| AWS Secret Key | password | Yes      | AWS Secret Access Key        |

**Note:** For SES, the "From" field is NOT shown (handled by AWS IAM)

**Example Configuration:**

```json
{
  "Provider": "ses",
  "AWS Region": "us-east-1",
  "AWS Access Key": "AKIAIOSFODNN7EXAMPLE",
  "AWS Secret Key": "wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
}
```

---

### 5. Common Fields (Always Shown)

These fields appear regardless of provider selection:

| Field       | Type     | Required | Help Text                                                         |
| ----------- | -------- | -------- | ----------------------------------------------------------------- |
| From        | text     | No\*     | Sender email address (optional if set in provider config)         |
| To          | text     | Yes      | Recipient email addresses (comma-separated for multiple)          |
| Subject     | text     | Yes      | Email subject line                                                |
| Body        | textarea | Yes      | Email body (HTML or plain text)                                   |
| Is HTML     | checkbox | No       | Treat body as HTML (checked) or plain text (unchecked)            |
| Attachments | textarea | No       | JSON array: [{"filename": "file.pdf", "url": "https://..."}, ...] |

\*Not shown for SES provider

---

## Technical Implementation

### Type Definition

The `AgentNodeTypeField` type now includes a `condition` property:

```typescript
export type AgentNodeTypeField = {
  l: string;
  t: string;
  o?: string[];
  h?: string;
  required?: boolean;
  condition?: (configValues: Record<string, any>) => boolean;
};
```

### Conditional Field Example

```typescript
{
  l: 'SMTP Host',
  t: 'text',
  h: 'e.g., smtp.gmail.com',
  required: true,
  condition: (config: any) => config.Provider === 'smtp',
}
```

The `condition` function:

- Receives the current node configuration
- Returns `true` if the field should be displayed
- Returns `false` if the field should be hidden

### Rendering Logic

In `NodeManagement.tsx`, the `renderConfigField` function now:

1. Checks if a field has a `condition` property
2. If it does, evaluates the condition against current config
3. Returns `null` if condition is false (field hidden)
4. Filters out `null` values in `renderGenericNodeConfig`

```typescript
if (field.condition) {
  const shouldShow = field.condition(node.data?.config || {});
  if (!shouldShow) return null;
}
```

---

## Email Node Configuration in Frontend

Location: `app/agent-builder/constants/nodeTypes.tsx`

The email node now has comprehensive provider-specific configuration:

```typescript
{
  id: 'action-email',
  label: 'Send Email',
  configs: [
    {
      l: 'Provider',
      t: 'select',
      o: ['smtp', 'sendgrid', 'mailgun', 'ses'],
      h: 'Email service provider',
      required: true,
    },
    // SMTP fields with conditions
    {
      l: 'SMTP Host',
      t: 'text',
      h: 'e.g., smtp.gmail.com',
      required: true,
      condition: (config: any) => config.Provider === 'smtp',
    },
    // ... more SMTP fields ...
    // SendGrid fields with conditions
    {
      l: 'SendGrid API Key',
      t: 'password',
      h: 'Your SendGrid API key (SG.xxxxx)',
      required: true,
      condition: (config: any) => config.Provider === 'sendgrid',
    },
    // ... more SendGrid fields ...
    // Mailgun fields with conditions
    // ... Mailgun fields ...
    // AWS SES fields with conditions
    // ... SES fields ...
    // Common fields
    {
      l: 'To',
      t: 'text',
      h: 'Recipient email addresses (comma-separated for multiple)',
      required: true,
    },
    // ... more common fields ...
  ],
}
```

---

## UI/UX Behavior

### Field Display Logic

1. **Provider selector always visible** - User must choose a provider first
2. **Provider-specific fields appear dynamically** - Only show when provider is selected
3. **Common fields always visible** - Email details are always needed
4. **Smooth transitions** - Fields appear/disappear as provider changes
5. **Clear labeling** - Help text explains what each field needs
6. **Password fields masked** - API keys and passwords shown as dots

### Example User Interaction

1. User clicks email node
2. Configuration panel opens
3. Provider dropdown visible (defaults to blank)
4. User selects "SMTP"
   - SMTP Host field appears
   - SMTP Port field appears
   - SMTP Secure checkbox appears
   - SMTP User field appears
   - SMTP Password field appears
5. Common fields (To, Subject, Body) are visible below
6. User enters values:
   - SMTP Host: `smtp.gmail.com`
   - SMTP Port: `587`
   - SMTP Secure: unchecked
   - SMTP User: `myemail@gmail.com`
   - SMTP Password: `myapppassword`
   - From: `myemail@gmail.com`
   - To: `recipient@example.com`
   - Subject: `Daily Report`
   - Body: `Here is your report...`

---

## Backend Integration

### How Backend Uses Configuration

When the workflow executes, the backend `emailActionHandler` receives the node configuration:

```typescript
const emailActionHandler = async (context: any) => {
  const provider = context.config?.Provider || 'smtp';

  if (provider === 'smtp') {
    // Use SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD from context.config
    const smtpConfig = {
      host: context.config?.['SMTP Host'],
      port: context.config?.['SMTP Port'],
      secure: context.config?.['SMTP Secure'],
      auth: {
        user: context.config?.['SMTP User'],
        pass: context.config?.['SMTP Password'],
      },
    };
    // Send via SMTP
  } else if (provider === 'sendgrid') {
    // Use SendGrid API Key and From Email
    const apiKey = context.config?.['SendGrid API Key'];
    const fromEmail = context.config?.['SendGrid From Email'];
    // Send via SendGrid
  }
  // ... etc for other providers
};
```

---

## Adding New Providers

To add a new email provider:

1. **Add to provider list** in nodeTypes.tsx:

   ```typescript
   o: ['smtp', 'sendgrid', 'mailgun', 'ses', 'new-provider'];
   ```

2. **Add provider-specific fields** with condition:

   ```typescript
   {
     l: 'New Provider API Key',
     t: 'password',
     h: 'Your API key',
     required: true,
     condition: (config: any) => config.Provider === 'new-provider',
   }
   ```

3. **Implement backend handler** in `emailService.ts`:

   ```typescript
   async function sendViaNewProvider(options: EmailOptions): Promise<EmailResult> {
     // Implementation
   }
   ```

4. **Add to provider switch** in `sendEmail()` function

---

## Validation

### Frontend Validation

- Required fields are marked with `*`
- Type validation based on field `t` (text, number, password, etc.)
- User cannot submit without required fields
- Password fields hidden for security

### Backend Validation

- Backend validates provider credentials exist
- Returns error if required fields are missing
- Checks for valid email format
- Verifies provider-specific requirements

---

## Files Modified

### Frontend Changes

1. **`app/agent-builder/constants/nodeTypes.tsx`**
   - Extended `AgentNodeTypeField` type with `condition` property
   - Updated email node configuration with provider-specific fields
   - Added conditional rendering logic

2. **`app/agent-builder/components/NodeManagement.tsx`**
   - Updated `renderConfigField()` to check field conditions
   - Updated `renderGenericNodeConfig()` to filter hidden fields
   - No breaking changes to existing logic

### Backend Changes

- `src/utils/emailService.ts` - Already supports all provider configurations
- `src/nodes/index.ts` - Already handles provider selection and configuration

---

## Testing the Implementation

### Test SMTP Configuration

1. Open workflow builder
2. Add email node
3. Select provider: "smtp"
4. Verify SMTP-specific fields appear:
   - SMTP Host
   - SMTP Port
   - SMTP Secure
   - SMTP User
   - SMTP Password
5. Common fields still visible (To, Subject, Body)
6. Fill in values and execute workflow

### Test SendGrid Configuration

1. Select provider: "sendgrid"
2. Verify fields:
   - SendGrid API Key
   - SendGrid From Email
3. Common fields visible
4. Fill and test

### Test Provider Switching

1. Select provider: "smtp"
2. Fill in SMTP fields
3. Change provider to "sendgrid"
4. Verify SMTP fields disappear
5. Verify SendGrid fields appear
6. Previous SMTP values should not be lost (if possible)

---

## Advanced Features

### Field Dependencies

The condition function has access to all current config values, enabling complex logic:

```typescript
// Example: Show API key only if provider selected
condition: (config: any) => config.Provider !== undefined && config.Provider !== '';

// Example: Show host only if not using managed service
condition: (config: any) => config.Provider === 'smtp' && config['Custom SMTP'] === true;
```

### Dynamic Help Text

Help text explains provider requirements:

- "e.g., smtp.gmail.com" for SMTP Host
- "SG.xxxxx" for SendGrid API key
- "key-xxxxx" for Mailgun API key

### Password Field Security

- Sensitive fields use `t: 'password'` type
- Values displayed as dots in UI
- Not sent to browser console logs
- Backend receives value only during execution

---

## User Guide

### Setting Up SMTP (Gmail)

1. Add email node to workflow
2. Select Provider: **smtp**
3. Configure fields:
   - **SMTP Host**: `smtp.gmail.com`
   - **SMTP Port**: `587`
   - **SMTP Secure**: `false` (unchecked)
   - **SMTP User**: `your-email@gmail.com`
   - **SMTP Password**: Generate app password at myaccount.google.com/apppasswords
4. Fill common fields (To, Subject, Body)
5. Save and execute

### Setting Up SendGrid

1. Add email node
2. Select Provider: **sendgrid**
3. Configure fields:
   - **SendGrid API Key**: Get from SendGrid dashboard
   - **SendGrid From Email**: Your verified sender email
4. Fill common fields
5. Save and execute

### Setting Up Mailgun

1. Add email node
2. Select Provider: **mailgun**
3. Configure fields:
   - **Mailgun API Key**: Get from Mailgun dashboard
   - **Mailgun Domain**: Your Mailgun domain
4. Fill common fields
5. Save and execute

---

## Summary

✅ **What Changed:**

- Email node now shows provider-specific fields dynamically
- Users see only relevant configuration options
- Clear, helpful field labels and examples
- Type-safe implementation in frontend
- Seamless integration with backend email service

✅ **Benefits:**

- Better UX - less cluttered configuration
- Clearer for users - provider context obvious
- Easier maintenance - provider logic centralized
- Extensible - easy to add new providers
- Type-safe - condition functions are validated

✅ **Backward Compatible:**

- Existing workflows continue to work
- Common fields unchanged
- No breaking changes

---

## Next Steps

1. ✅ Frontend configuration updated
2. ✅ Dynamic field rendering implemented
3. ✅ Backend email service ready
4. Test with real workflows
5. Monitor user feedback
6. Add additional providers as needed
