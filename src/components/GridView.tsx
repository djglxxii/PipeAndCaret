/**
 * GridView Component
 * 
 * AG Grid spreadsheet-style view of HL7 segments.
 * Each row is a segment occurrence, columns are fields.
 */

import { useMemo, useCallback, useRef } from 'react';
import { AgGridReact } from 'ag-grid-react';
import type { ColDef, CellValueChangedEvent, CellClassParams } from 'ag-grid-community';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
import { useAppStore, getFieldValue } from '../app/store';
import { getFieldDisplayString, parseHL7 } from '../hl7';
import { getChangedFieldKeys } from '../utils/diff';

// Register AG Grid modules
ModuleRegistry.registerModules([AllCommunityModule]);

interface RowData {
  segmentIndex: number;
  segmentName: string;
  occurrenceIndex: number;
  [key: string]: string | number; // field1, field2, etc.
}

// Number of field columns to display (1-10 for MVP)
const FIELD_COUNT = 10;

export function GridView() {
  const gridRef = useRef<AgGridReact>(null);
  const { message, originalRaw, updateFieldFromString } = useAppStore();

  // Calculate changed fields for highlighting
  const changedFieldKeys = useMemo(() => {
    if (!message || !originalRaw) return new Set<string>();
    
    const originalResult = parseHL7(originalRaw);
    if (!originalResult.success) return new Set<string>();
    
    return getChangedFieldKeys(originalResult.message, message);
  }, [message, originalRaw]);

  // Build row data from message
  const rowData: RowData[] = useMemo(() => {
    if (!message) return [];

    // Track occurrence index per segment name
    const occurrenceCounts: Record<string, number> = {};

    return message.segments.map((segment, segmentIndex) => {
      // Calculate occurrence index for this segment name
      const name = segment.name;
      occurrenceCounts[name] = (occurrenceCounts[name] || 0) + 1;
      const occurrenceIndex = occurrenceCounts[name];

      const row: RowData = {
        segmentIndex,
        segmentName: name,
        occurrenceIndex,
      };

      // Add field values
      for (let fieldIdx = 1; fieldIdx <= FIELD_COUNT; fieldIdx++) {
        const field = getFieldValue(message, segmentIndex, fieldIdx);
        
        if (field) {
          row[`field${fieldIdx}`] = getFieldDisplayString(field, message.delimiters);
        } else {
          row[`field${fieldIdx}`] = '';
        }
      }

      return row;
    });
  }, [message]);

  // Cell class function for highlighting changed cells
  const getCellClass = useCallback(
    (params: CellClassParams<RowData>): string => {
      if (!params.data || !params.colDef.field?.startsWith('field')) return '';
      
      const fieldNum = parseInt(params.colDef.field.replace('field', ''), 10);
      const key = `${params.data.segmentIndex}:${fieldNum}`;
      
      if (changedFieldKeys.has(key)) {
        return 'cell-changed';
      }
      
      return '';
    },
    [changedFieldKeys]
  );

  // Column definitions
  const columnDefs: ColDef<RowData>[] = useMemo(() => {
    const cols: ColDef<RowData>[] = [
      {
        field: 'segmentName',
        headerName: 'Seg',
        width: 70,
        pinned: 'left',
        editable: false,
        cellClass: 'cell-segment-name',
      },
      {
        field: 'occurrenceIndex',
        headerName: '#',
        width: 50,
        pinned: 'left',
        editable: false,
        cellClass: 'cell-occurrence',
      },
    ];

    // Add field columns
    for (let i = 1; i <= FIELD_COUNT; i++) {
      cols.push({
        field: `field${i}`,
        headerName: `F${i}`,
        width: 150,
        editable: true,
        cellClass: getCellClass,
      });
    }

    return cols;
  }, [getCellClass]);

  // Handle cell value change
  const onCellValueChanged = useCallback(
    (event: CellValueChangedEvent<RowData>) => {
      if (!event.data || !event.colDef.field?.startsWith('field')) return;

      const fieldNum = parseInt(event.colDef.field.replace('field', ''), 10);
      const segmentIndex = event.data.segmentIndex;
      const newValue = event.newValue as string;

      updateFieldFromString(segmentIndex, fieldNum, newValue);
    },
    [updateFieldFromString]
  );

  // Default column definition
  const defaultColDef: ColDef = useMemo(
    () => ({
      resizable: true,
      sortable: false,
      filter: false,
    }),
    []
  );

  if (!message) {
    return null;
  }

  return (
    <div
      className="ag-theme-alpine"
      style={{ width: '100%', height: '100%', minHeight: '300px' }}
    >
      <style>
        {`
          .cell-changed {
            background-color: #fff3cd !important;
          }
          .cell-segment-name {
            font-weight: 600;
            background-color: #f8f9fa;
          }
          .cell-occurrence {
            background-color: #f8f9fa;
            text-align: center;
          }
        `}
      </style>
      <AgGridReact<RowData>
        ref={gridRef}
        rowData={rowData}
        columnDefs={columnDefs}
        defaultColDef={defaultColDef}
        onCellValueChanged={onCellValueChanged}
        getRowId={(params) => `${params.data.segmentIndex}`}
        suppressRowClickSelection
        enableCellTextSelection
        ensureDomOrder
      />
    </div>
  );
}
