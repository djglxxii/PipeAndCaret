/**
 * InspectorPanel Component
 * 
 * Shows details and allows editing of the selected tree node.
 */

import { useMemo, useCallback } from 'react';
import { Paper, Stack, Text, TextInput, Box, Badge, Divider } from '@mantine/core';
import { useAppStore, getLeafValue } from '../app/store';
import { formatPath } from '../app/types';

export function InspectorPanel() {
  const { message, selectedPath, updateLeafValue } = useAppStore();

  // Get the current value at the selected path
  const currentValue = useMemo(() => {
    if (
      !message ||
      !selectedPath ||
      selectedPath.fieldIndex === undefined ||
      selectedPath.repeatIndex === undefined ||
      selectedPath.componentIndex === undefined ||
      selectedPath.subcomponentIndex === undefined
    ) {
      return null;
    }

    return getLeafValue(
      message,
      selectedPath.segmentIndex,
      selectedPath.fieldIndex,
      selectedPath.repeatIndex,
      selectedPath.componentIndex,
      selectedPath.subcomponentIndex
    );
  }, [message, selectedPath]);

  // Get path string for display
  const pathString = useMemo(() => {
    if (!message || !selectedPath) return null;

    const segment = message.segments[selectedPath.segmentIndex];
    if (!segment) return null;

    if (selectedPath.fieldIndex === undefined) {
      return segment.name;
    }

    return formatPath(
      segment.name,
      selectedPath.fieldIndex,
      selectedPath.repeatIndex,
      selectedPath.componentIndex,
      selectedPath.subcomponentIndex
    );
  }, [message, selectedPath]);

  // Get node type for display
  const nodeType = useMemo(() => {
    if (!selectedPath) return null;

    if (selectedPath.subcomponentIndex !== undefined) return 'Subcomponent';
    if (selectedPath.componentIndex !== undefined) return 'Component';
    if (selectedPath.repeatIndex !== undefined) return 'Repeat';
    if (selectedPath.fieldIndex !== undefined) return 'Field';
    return 'Segment';
  }, [selectedPath]);

  // Check if this is an editable leaf
  const isEditableLeaf = selectedPath?.subcomponentIndex !== undefined;

  // Handle value change
  const handleValueChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (
        !selectedPath ||
        selectedPath.fieldIndex === undefined ||
        selectedPath.repeatIndex === undefined ||
        selectedPath.componentIndex === undefined ||
        selectedPath.subcomponentIndex === undefined
      ) {
        return;
      }

      updateLeafValue(
        selectedPath.segmentIndex,
        selectedPath.fieldIndex,
        selectedPath.repeatIndex,
        selectedPath.componentIndex,
        selectedPath.subcomponentIndex,
        e.target.value
      );
    },
    [selectedPath, updateLeafValue]
  );

  // Get segment info for display
  const segmentInfo = useMemo(() => {
    if (!message || !selectedPath) return null;
    return message.segments[selectedPath.segmentIndex] || null;
  }, [message, selectedPath]);

  // Get field info for display
  const fieldInfo = useMemo(() => {
    if (!segmentInfo || selectedPath?.fieldIndex === undefined) return null;
    return segmentInfo.fields.find((f) => f.index === selectedPath.fieldIndex) || null;
  }, [segmentInfo, selectedPath?.fieldIndex]);

  if (!selectedPath) {
    return (
      <Paper p="md" withBorder h="100%">
        <Stack gap="md">
          <Text fw={600} size="sm">
            Inspector
          </Text>
          <Text size="sm" c="dimmed">
            Select a node in the tree to view details.
          </Text>
        </Stack>
      </Paper>
    );
  }

  return (
    <Paper p="md" withBorder h="100%">
      <Stack gap="md">
        <Text fw={600} size="sm">
          Inspector
        </Text>

        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Path
          </Text>
          <Text
            size="sm"
            style={{ fontFamily: 'monospace', backgroundColor: 'var(--mantine-color-gray-1)', padding: '4px 8px', borderRadius: '4px' }}
          >
            {pathString}
          </Text>
        </Box>

        <Box>
          <Text size="xs" c="dimmed" mb={4}>
            Type
          </Text>
          <Badge variant="light" color="blue">
            {nodeType}
          </Badge>
        </Box>

        {segmentInfo && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Segment
            </Text>
            <Text size="sm">{segmentInfo.name}</Text>
          </Box>
        )}

        {fieldInfo && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Field Index
            </Text>
            <Text size="sm">{fieldInfo.index}</Text>
          </Box>
        )}

        {fieldInfo && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Structure
            </Text>
            <Text size="xs">
              {fieldInfo.repeats.length} repeat(s),{' '}
              {fieldInfo.repeats[0]?.components.length || 0} component(s)
            </Text>
          </Box>
        )}

        <Divider />

        {isEditableLeaf && currentValue !== null && (
          <Box>
            <Text size="xs" c="dimmed" mb={4}>
              Value
            </Text>
            <TextInput
              value={currentValue}
              onChange={handleValueChange}
              placeholder="Enter value..."
              styles={{
                input: {
                  fontFamily: 'monospace',
                },
              }}
            />
          </Box>
        )}

        {!isEditableLeaf && (
          <Text size="sm" c="dimmed">
            Select a leaf node (subcomponent) to edit its value.
          </Text>
        )}
      </Stack>
    </Paper>
  );
}
