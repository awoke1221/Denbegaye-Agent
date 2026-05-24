from pathlib import Path
import re

path = Path('app/agent-builder/constants/nodeTypes.tsx')
text = path.read_text(encoding='utf-8')
lines = text.splitlines()
required_labels = {
    'API Key', 'Model', 'Endpoint Path', 'HTTP Method', 'URL', 'Method', 'Code', 'Condition', 'Expression', 'Items', 'Delay', 'Provider',
    'From', 'To', 'Subject', 'Body', 'Bot Token', 'Chat ID', 'Message', 'Account SID', 'Auth Token', 'Author URN', 'Video Title', 'Video File',
    'Page ID', 'Calendar ID', 'Event Title', 'Start Time', 'End Time', 'Spreadsheet ID', 'Operation', 'Gmail Address', 'Search Query',
    'Webhook URL', 'Channel', 'Content', 'Base URL', 'Path', 'Template ID', 'Draft ID', 'Attachment ID', 'Download Path', 'Batch Size',
    'Label Name', 'API URL', 'Auth Method', 'Access Token', 'Chat Platform', 'Workspace', 'Channel/Room', 'Form ID', 'Form Selector', 'Website URL',
    'Phone Number'
}
optional_labels = {
    'Headers', 'Attachments', 'Description', 'Subject Filter', 'Sender Filter', 'Keyword Filter', 'Field Filter', 'Field Mapping',
    'Input Schema', 'Icon Emoji', 'Libraries', 'Video Description', 'Link', 'Range', 'Max Results', 'Username', 'Timezone',
    'End Date', 'Start Date', 'Poll Interval', 'Query', 'Sheet Name', 'Authentication', 'Email Address', 'Provider', 'Body'
}

out_lines = []
inside_configs = False
brace_level = 0
current_obj_lines = []
current_label = None
label_regex = re.compile(r"l:\s*'([^']+)'")

for line in lines:
    stripped = line.strip()
    if inside_configs:
        if current_obj_lines:
            current_obj_lines.append(line)
            brace_level += line.count('{') - line.count('}')
            if current_label is None:
                match = label_regex.search(line)
                if match:
                    current_label = match.group(1)
            if brace_level == 0:
                obj_text = '\n'.join(current_obj_lines)
                if 'required:' not in obj_text:
                    required = True
                    if current_label in optional_labels:
                        required = False
                    for i in range(len(current_obj_lines) - 1, -1, -1):
                        if current_obj_lines[i].strip().startswith('}'):
                            indent = current_obj_lines[i][:len(current_obj_lines[i]) - len(current_obj_lines[i].lstrip())]
                            current_obj_lines.insert(i, indent + '  required: ' + ('true' if required else 'false') + ',')
                            break
                out_lines.extend(current_obj_lines)
                current_obj_lines = []
                current_label = None
            continue
        if stripped.startswith('configs:') and stripped.endswith('['):
            inside_configs = True
            out_lines.append(line)
            continue
        if stripped in ('],', ']'):
            inside_configs = False
            out_lines.append(line)
            continue
        if stripped.startswith('{'):
            current_obj_lines = [line]
            brace_level = line.count('{') - line.count('}')
            current_label = None
            match = label_regex.search(line)
            if match:
                current_label = match.group(1)
            if brace_level == 0:
                obj_text = '\n'.join(current_obj_lines)
                if 'required:' not in obj_text:
                    required = True
                    if current_label in optional_labels:
                        required = False
                    for i in range(len(current_obj_lines) - 1, -1, -1):
                        if current_obj_lines[i].strip().startswith('}'):
                            indent = current_obj_lines[i][:len(current_obj_lines[i]) - len(current_obj_lines[i].lstrip())]
                            current_obj_lines.insert(i, indent + '  required: ' + ('true' if required else 'false') + ',')
                            break
                out_lines.extend(current_obj_lines)
                current_obj_lines = []
                current_label = None
            continue
        out_lines.append(line)
        continue
    if stripped.startswith('configs:') and stripped.endswith('['):
        inside_configs = True
    out_lines.append(line)

new_text = '\n'.join(out_lines)
if new_text != text:
    path.write_text(new_text, encoding='utf-8')
    print('Updated nodeTypes config required flags')
else:
    print('No changes made')
