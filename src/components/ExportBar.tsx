/**
 * ExportBar Component
 * 
 * Provides Copy and Download buttons for the current HL7 message.
 */

import { useState } from 'react';
import { Group, Button, Text, Paper } from '@mantine/core';
import { useAppStore } from '../app/store';
import { copyToClipboard, downloadHL7 } from '../utils';

export function ExportBar() {
  const { isParsed, currentRaw } = useAppStore();
  const [copySuccess, setCopySuccess] = useState(false);

  const handleCopy = async () => {
    const success = await copyToClipboard(currentRaw);
    if (success) {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    }
  };

  const handleDownload = () => {
    downloadHL7(currentRaw);
  };

  if (!isParsed) {
    return null;
  }

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" align="center">
        <Text size="sm" c="dimmed">
          Export Options
        </Text>
        
        <Group gap="sm">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCopy}
            color={copySuccess ? 'green' : undefined}
          >
            {copySuccess ? 'Copied!' : 'Copy to Clipboard'}
          </Button>
          
          <Button variant="filled" size="sm" onClick={handleDownload}>
            Download .hl7
          </Button>
        </Group>
      </Group>
    </Paper>
  );
}
