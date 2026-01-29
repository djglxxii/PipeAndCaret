/**
 * RawPanel Component
 * 
 * Displays the raw HL7 textarea input/output with parse button
 * and error display. After parsing, shows read-only output with
 * "Edit Raw" toggle.
 */

import { Textarea, Button, Alert, Group, Switch, Text, Stack, Paper } from '@mantine/core';
import { useAppStore } from '../app/store';

export function RawPanel() {
  const {
    rawInput,
    currentRaw,
    isParsed,
    isEditingRaw,
    parseError,
    setRawInput,
    parseMessage,
    enableRawEditing,
  } = useAppStore();

  const handleParse = () => {
    parseMessage();
  };

  const handleRawChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setRawInput(e.target.value);
  };

  const handleEditRawToggle = () => {
    enableRawEditing();
  };

  // Determine what to show in textarea
  const textareaValue = isParsed && !isEditingRaw ? currentRaw : rawInput;
  const isReadOnly = isParsed && !isEditingRaw;

  return (
    <Paper p="md" withBorder>
      <Stack gap="sm">
        <Group justify="space-between" align="center">
          <Text fw={600} size="sm">
            {isParsed ? 'Serialized HL7 Output' : 'Raw HL7 Input'}
          </Text>
          
          <Group gap="md">
            {isParsed && (
              <Switch
                label="Edit Raw (Re-parse)"
                checked={isEditingRaw}
                onChange={handleEditRawToggle}
                size="sm"
              />
            )}
            
            <Button
              onClick={handleParse}
              disabled={!rawInput.trim() && !isEditingRaw}
              size="sm"
            >
              Parse
            </Button>
          </Group>
        </Group>

        <Textarea
          value={textareaValue}
          onChange={handleRawChange}
          readOnly={isReadOnly}
          placeholder="Paste HL7 message here...&#10;&#10;Example:&#10;MSH|^~\&|SENDING|FACILITY|RECEIVING|FACILITY|20231215120000||ADT^A01|MSG001|P|2.5&#10;PID|1||12345^^^MRN||DOE^JOHN^Q||19800115|M"
          minRows={8}
          maxRows={15}
          autosize
          styles={{
            input: {
              fontFamily: 'monospace',
              fontSize: '12px',
              backgroundColor: isReadOnly ? 'var(--mantine-color-gray-1)' : undefined,
            },
          }}
        />

        {parseError && (
          <Alert color="red" title="Parse Error">
            <Text size="sm">{parseError.message}</Text>
            {parseError.segmentIndex !== undefined && (
              <Text size="xs" c="dimmed" mt="xs">
                Segment index: {parseError.segmentIndex}
                {parseError.segmentName && ` (${parseError.segmentName})`}
              </Text>
            )}
            {parseError.snippet && (
              <Text size="xs" c="dimmed" mt="xs" style={{ fontFamily: 'monospace' }}>
                Snippet: {parseError.snippet}
              </Text>
            )}
          </Alert>
        )}
      </Stack>
    </Paper>
  );
}
