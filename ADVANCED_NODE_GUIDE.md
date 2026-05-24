# Advanced AI Agent Node - Complete Guide

## Overview

The newly redesigned **AdvancedAgentNode** is a fully-featured, professional-grade AI configuration node with comprehensive settings management, model selection, and prompt engineering capabilities.

## Visual Design

### Collapsed State (280x220px)

```
┌─────────────────────────────────┐
│ 🧠 Advanced AI Node             │ ← Header with status
│    Gemini 2.0 Flash            │
├─────────────────────────────────┤
│ [Status Indicators] ▼           │
│ 🧠 🔒 💻 (Configuration badges) │
└─────────────────────────────────┘
```

### Expanded State (420x580px)

```
┌─────────────────────────────────────┐
│ 🧠 Advanced AI Node          [▲]    │
│    Gemini 2.0 Flash                │
├─────────────────────────────────────┤
│  Model │ Config │ Prompt           │ ← Tab navigation
├─────────────────────────────────────┤
│  [Tab Content Area - Scrollable]    │
│                                     │
│                                     │
│                                     │
├─────────────────────────────────────┤
│ ✓ Ready to Use          [Done]      │
└─────────────────────────────────────┘
```

## Key Features

### 1. AI Model Selection

**Available Models:**

- **Gemini 2.0 Flash** - Google (Advanced, Fast)
- **GPT-4 Turbo** - OpenAI (Advanced)
- **GPT-4o** - OpenAI (Advanced)
- **Claude 3.5 Sonnet** - Anthropic (Advanced)
- **Grok-2** - xAI (Advanced)
- **DeepSeek V3** - DeepSeek
- **Gemini 1.5 Pro** - Google
- **GPT-4 Mini** - OpenAI (Lightweight)

### 2. Configuration Parameters

#### Temperature (0.0 - 2.0)

- **0.0-0.3**: Focused, deterministic responses (technical analysis)
- **0.4-0.6**: Moderate creativity with precision
- **0.7-0.9**: Balanced creative and accurate
- **1.0-2.0**: High creativity, diverse outputs (creative writing)

#### Max Tokens (256 - 4096)

- **256-512**: Brief responses
- **768-1024**: Standard responses
- **2048**: Extended content
- **4096**: Maximum output (research, documentation)

#### Top P (0.0 - 1.0)

- **0.85-0.92**: Conservative, high-quality
- **0.90-0.95**: Balanced quality and diversity
- **0.95-1.0**: Maximum diversity

#### Top K (0 - 100)

- **0-20**: Conservative, focused
- **20-40**: Balanced
- **40-100**: Creative, exploratory

### 3. Configuration Presets

**Creative Writing**

```
Temperature: 0.9
Max Tokens: 2048
Top P: 0.95
Top K: 40
```

**Technical Analysis**

```
Temperature: 0.3
Max Tokens: 1024
Top P: 0.85
Top K: 20
```

**Balanced**

```
Temperature: 0.7
Max Tokens: 1536
Top P: 0.9
Top K: 30
```

**Research**

```
Temperature: 0.5
Max Tokens: 4096
Top P: 0.92
Top K: 40
```

### 4. System Message Configuration

Define the AI's behavior with a system prompt:

```
"You are a helpful AI assistant specializing in [domain]"
"You are a technical expert in [field]"
"You analyze [subject] with [approach]"
```

### 5. Prompt Variables

Support for dynamic prompt variables:

- `{context}` - Additional context data
- `{user_input}` - User's input
- `{timestamp}` - Current timestamp
- Custom variables via data flow

## Usage Workflow

### Step 1: Expand the Node

Click the chevron (▼) in the header to expand the full configuration interface.

### Step 2: Configure Model (Model Tab)

1. Select your preferred AI model from the dropdown
2. Enter your API key (secure input with toggle visibility)
3. Set system message for AI behavior

### Step 3: Adjust Parameters (Config Tab)

1. Choose a preset or manually adjust:
   - Temperature slider
   - Max Tokens slider
   - Top P slider
   - Top K slider
2. Presets auto-populate all parameters

### Step 4: Write Prompt (Prompt Tab)

1. Enter your main prompt with variables
2. Use `{variable_name}` syntax for dynamic content
3. Paste example prompts from your workflow

### Step 5: Validate & Close

- Check status indicator (✓ Ready or ⚠ Configuration Needed)
- Click "Done" to collapse and save

## Status Indicators

### Collapsed View Icons

- 🧠 Blue: Model selected
- 🔒 Green: API Key configured
- 💻 Indigo: Prompt set

### Validation States

- **✓ Ready to Use**: All required fields filled (model, API key, prompt)
- **⚠ Configuration Needed**: Missing required settings

## Connection Handles

The node has 4 specialized handles for different data flows:

| Handle  | Position | Color   | Purpose                 |
| ------- | -------- | ------- | ----------------------- |
| Input   | Top      | Indigo  | Receive input data      |
| Output  | Bottom   | Emerald | Send processed output   |
| Control | Left     | Amber   | Receive control signals |
| Error   | Right    | Red     | Output error states     |

## Advanced Features

### 1. Real-time Validation

- Checks configuration completeness in real-time
- Provides visual feedback for missing settings
- Prevents incomplete node execution

### 2. Animated UI

- Pulsing gradient background when expanded
- Smooth transitions between states
- Hover effects on interactive elements

### 3. Persistent Configuration

- All settings saved to node data
- Configuration preserved across saves
- Easy duplication with all settings

### 4. Visual Design

- Dark theme with indigo/purple accent
- Professional gradient backgrounds
- Clear visual hierarchy
- Icon-based quick reference

## Integration Points

### With Agent Builder

The node integrates seamlessly with the ReactFlow canvas:

- Connect to other nodes via handles
- Settings persist in node.data
- Configuration accessible via props

### API Integration

The node prepares configuration for backend:

```typescript
{
  model: "gemini-2.0-flash",
  apiKey: "sk-...",
  prompt: "Your prompt here {variables}",
  temperature: 0.7,
  maxTokens: 1536,
  topP: 0.9,
  topK: 30,
  systemMessage: "You are a helpful assistant",
  configTemplate: "balanced"
}
```

## Tips & Best Practices

### Model Selection

- Use **Gemini 2.0 Flash** for fast, creative outputs
- Use **GPT-4 Turbo** for complex reasoning
- Use **Claude 3.5 Sonnet** for nuanced analysis
- Use **DeepSeek** for cost-effective solutions

### Parameter Tuning

- Start with presets, then fine-tune
- Temperature: Higher = more creative, Lower = more focused
- Max Tokens: Depends on output requirements
- Top P: Keep between 0.85-0.95 for quality

### Prompt Engineering

- Be specific and clear
- Use variables for dynamic content
- Include examples for complex tasks
- Test with different models

### Security

- Never expose API keys in logs
- Use toggle to hide keys from view
- Consider environment variables for production
- Rotate keys regularly

## Troubleshooting

### Configuration Not Saving

- Ensure all fields are properly filled
- Check for special characters in values
- Refresh the page if needed

### Model Not Responding

- Verify API key is correct
- Check model availability
- Ensure prompt is properly formatted

### Missing Handle Connections

- Expand the node to see handles clearly
- Hover over handles to highlight
- Check for conflicting connections

## Example Configurations

### SEO Content Writer

```
Model: Gemini 2.0 Flash
Template: Creative Writing
System: "You are an SEO expert writing optimized content"
Prompt: "Write SEO-optimized article about {topic}"
```

### Code Generator

```
Model: GPT-4 Turbo
Template: Technical Analysis
System: "You are an expert programmer"
Prompt: "Generate {language} code for {requirement}"
```

### Data Analyst

```
Model: Claude 3.5 Sonnet
Template: Research
System: "You are a professional data analyst"
Prompt: "Analyze {data} and provide insights"
```

## Performance Considerations

- **Compact Mode**: ~2KB in memory
- **Expanded Mode**: Full configuration loaded
- **Auto-collapse**: Recommended for canvas performance
- **Multiple Nodes**: Works efficiently with 50+ nodes

## Future Enhancements

- [ ] Custom parameter ranges
- [ ] Saved prompt templates
- [ ] Model benchmarking
- [ ] Cost calculator
- [ ] Execution history
- [ ] A/B testing interface
