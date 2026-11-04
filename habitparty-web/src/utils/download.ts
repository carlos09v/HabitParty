/**
 * Dispara o download de um arquivo de texto ou binário a partir de uma string
 */
export function downloadBlob(
  content: string,
  filename: string,
  mimeType = "text/csv;charset=utf-8;",
): void {
  const isCsv = mimeType.toLowerCase().includes("csv");
  const normalizedContent =
    isCsv && !content.startsWith("\uFEFF") ? `\uFEFF${content}` : content;
  const blob = new Blob([normalizedContent], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
