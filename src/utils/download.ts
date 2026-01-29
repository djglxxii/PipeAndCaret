/**
 * Download Utilities
 */

/**
 * Download text content as a file
 */
export function downloadFile(
  content: string,
  filename: string,
  mimeType: string = 'text/plain'
): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  
  // Cleanup
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Download HL7 message as .hl7 file
 */
export function downloadHL7(content: string, filename?: string): void {
  const defaultFilename = `hl7_message_${new Date().toISOString().slice(0, 10)}.hl7`;
  downloadFile(content, filename || defaultFilename, 'application/hl7-v2');
}
