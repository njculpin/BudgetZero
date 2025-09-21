import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

export interface PDFExportOptions {
  filename?: string
  quality?: number
  scale?: number
  format?: 'a4' | 'letter'
  orientation?: 'portrait' | 'landscape'
  margin?: number
}

export async function exportRulebookToPDF(
  element: HTMLElement,
  options: PDFExportOptions = {}
): Promise<void> {
  const {
    filename = 'rulebook.pdf',
    quality = 0.95,
    scale = 2,
    format = 'a4',
    orientation = 'portrait',
    margin = 20
  } = options

  try {
    const canvas = await html2canvas(element, {
      scale,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      removeContainer: true,
      logging: false,
      height: element.scrollHeight,
      width: element.scrollWidth
    })

    const imgWidth = format === 'a4' ? 210 : 216
    const imgHeight = format === 'a4' ? 297 : 279
    const pageWidth = orientation === 'portrait' ? imgWidth : imgHeight
    const pageHeight = orientation === 'portrait' ? imgHeight : imgWidth
    const contentWidth = pageWidth - (margin * 2)
    const contentHeight = pageHeight - (margin * 2)

    canvas.toDataURL('image/jpeg', quality)
    const pdf = new jsPDF({
      orientation,
      unit: 'mm',
      format: format === 'a4' ? 'a4' : [216, 279]
    })

    const canvasWidth = canvas.width
    const canvasHeight = canvas.height
    const ratio = canvasWidth / canvasHeight

    let finalWidth = contentWidth
    let finalHeight = contentWidth / ratio

    if (finalHeight > contentHeight) {
      finalHeight = contentHeight
      finalWidth = contentHeight * ratio
    }

    const totalPages = Math.ceil(canvasHeight / (canvasWidth * (finalHeight / finalWidth)))
    const pageCanvasHeight = canvasWidth * (finalHeight / finalWidth)

    for (let page = 0; page < totalPages; page++) {
      if (page > 0) {
        pdf.addPage()
      }

      const yOffset = page * pageCanvasHeight
      const pageCanvas = document.createElement('canvas')
      const pageCtx = pageCanvas.getContext('2d')

      pageCanvas.width = canvasWidth
      pageCanvas.height = Math.min(pageCanvasHeight, canvasHeight - yOffset)

      if (pageCtx) {
        pageCtx.fillStyle = '#ffffff'
        pageCtx.fillRect(0, 0, pageCanvas.width, pageCanvas.height)

        pageCtx.drawImage(
          canvas,
          0, yOffset, canvasWidth, pageCanvas.height,
          0, 0, canvasWidth, pageCanvas.height
        )

        const pageImgData = pageCanvas.toDataURL('image/jpeg', quality)
        pdf.addImage(pageImgData, 'JPEG', margin, margin, finalWidth, finalHeight)
      }
    }

    pdf.save(filename)
  } catch (error) {
    console.error('Error exporting PDF:', error)
    throw new Error('Failed to export PDF. Please try again.')
  }
}

export function createPrintableVersion(content: string): string {
  return `
    <div style="
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1f2937;
      max-width: none;
      margin: 0;
      padding: 40px;
      background: white;
    ">
      ${content}
    </div>
  `
}

export function getExportableElement(editorElement: HTMLElement): HTMLElement {
  const exportDiv = document.createElement('div')
  exportDiv.className = 'rulebook-export'
  exportDiv.style.position = 'absolute'
  exportDiv.style.left = '-9999px'
  exportDiv.style.top = '0'
  exportDiv.style.width = '210mm'
  exportDiv.style.minHeight = '297mm'
  exportDiv.style.padding = '20mm'
  exportDiv.style.backgroundColor = 'white'
  exportDiv.style.fontFamily = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  exportDiv.style.fontSize = '12pt'
  exportDiv.style.lineHeight = '1.4'
  exportDiv.style.color = '#1f2937'

  const content = editorElement.querySelector('.tiptap')?.innerHTML || ''
  exportDiv.innerHTML = createPrintableVersion(content)

  document.body.appendChild(exportDiv)

  return exportDiv
}

export function cleanupExportElement(element: HTMLElement): void {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element)
  }
}