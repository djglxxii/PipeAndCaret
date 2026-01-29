/**
 * PipeAndCaret - HL7 Message Editor
 * 
 * Main application component.
 */

import { Stack, Container, Title, Text, Box, Group } from '@mantine/core';
import { RawPanel, EditorTabs, ExportBar } from './components';

export function App() {
  return (
    <Box
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--mantine-color-gray-0)',
        paddingTop: '24px',
        paddingBottom: '24px',
      }}
    >
      <Container size="xl">
        <Stack gap="lg">
          {/* Header */}
          <Box>
            <Group justify="space-between" align="flex-end">
              <Box>
                <Title order={1} size="h2">
                  PipeAndCaret
                </Title>
                <Text size="sm" c="dimmed">
                  Anonymous, client-side HL7 v2 message editor
                </Text>
              </Box>
              <Text size="xs" c="dimmed">
                All processing happens locally. No data is transmitted.
              </Text>
            </Group>
          </Box>

          {/* Raw HL7 Input/Output Panel */}
          <RawPanel />

          {/* Editor Tabs (Grid/Tree) */}
          <EditorTabs />

          {/* Export Bar */}
          <ExportBar />

          {/* Footer */}
          <Box>
            <Text size="xs" c="dimmed" ta="center">
              MVP - No HL7 semantic validation or conformance profiles.
              Delimiters are extracted from MSH segment.
            </Text>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
}
