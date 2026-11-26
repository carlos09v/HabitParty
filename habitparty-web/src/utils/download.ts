/**
 * Dispara o download de um arquivo de texto ou binário a partir de uma string ou Blob.
 */
export function downloadBlob(
  content: string | Blob,
  filename: string,
  mimeType = "text/csv;charset=utf-8;",
): void {
  let blob: Blob;
  if (content instanceof Blob) {
    blob = content;
  } else {
    const isCsv = mimeType.toLowerCase().includes("csv");
    const normalizedContent =
      isCsv && !content.startsWith("\uFEFF") ? `\uFEFF${content}` : content;
    blob = new Blob([normalizedContent], { type: mimeType });
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 1000);
}
