import { useState } from 'react'
import { Button } from '../ui'
import { exportRulebookToPDF, getExportableElement, cleanupExportElement, PDFExportOptions } from '../../utils/pdfExport'

interface PDFExportDialogProps {
  editorElement: HTMLElement
  projectId: string
  rulebookTitle: string
  onClose: () => void
}

export function PDFExportDialog({
  editorElement,
  projectId,
  rulebookTitle,
  onClose
}: PDFExportDialogProps) {
  const [options, setOptions] = useState<PDFExportOptions>({
    filename: `${rulebookTitle || projectId}-rulebook.pdf`,
    quality: 0.95,
    scale: 2,
    format: 'a4',
    orientation: 'portrait',
    margin: 20
  })
  const [isExporting, setIsExporting] = useState(false)
  const [includeMetadata, setIncludeMetadata] = useState(true)
  const [includeTableOfContents, setIncludeTableOfContents] = useState(true)
  const [customCover, setCustomCover] = useState('')

  const handleExport = async () => {
    setIsExporting(true)
    try {
      const exportElement = getExportableElement(editorElement)

      // Add custom cover page if specified
      if (customCover || includeMetadata) {
        const coverHtml = createCoverPage()
        exportElement.innerHTML = coverHtml + exportElement.innerHTML
      }

      // Add table of contents if specified
      if (includeTableOfContents) {
        const tocHtml = createTableOfContents(exportElement)
        const contentStart = exportElement.innerHTML.indexOf('<h1>')
        if (contentStart > -1) {
          exportElement.innerHTML =
            exportElement.innerHTML.substring(0, contentStart) +
            tocHtml +
            exportElement.innerHTML.substring(contentStart)
        }
      }

      await exportRulebookToPDF(exportElement, options)
      cleanupExportElement(exportElement)
      onClose()
    } catch (error) {
      console.error('Error exporting PDF:', error)
      alert('Failed to export PDF. Please try again.')
    } finally {
      setIsExporting(false)
    }
  }

  const createCoverPage = () => {
    const coverTitle = customCover || rulebookTitle || 'Game Rulebook'
    const currentDate = new Date().toLocaleDateString()

    return `
      <div style="
        page-break-after: always;
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        min-height: 90vh;
        text-align: center;
        padding: 40px;
      ">
        <h1 style="
          font-size: 48px;
          font-weight: 700;
          color: #1f2937;
          margin-bottom: 30px;
          line-height: 1.2;
        ">${coverTitle}</h1>

        ${includeMetadata ? `
          <div style="
            margin-top: 60px;
            padding: 30px;
            background-color: #f9fafb;
            border-radius: 12px;
            max-width: 400px;
          ">
            <p style="margin: 10px 0; font-size: 16px; color: #6b7280;">
              <strong>Generated:</strong> ${currentDate}
            </p>
            <p style="margin: 10px 0; font-size: 16px; color: #6b7280;">
              <strong>Format:</strong> ${options.format?.toUpperCase()} ${options.orientation}
            </p>
            <p style="margin: 10px 0; font-size: 14px; color: #9ca3af; font-style: italic;">
              Created with Budget Zero Game Design Platform
            </p>
          </div>
        ` : ''}
      </div>
    `
  }

  const createTableOfContents = (element: HTMLElement) => {
    const headings = element.querySelectorAll('h1, h2, h3')
    const tocItems: string[] = []

    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1))
      const text = heading.textContent || ''
      const _indent = '  '.repeat(level - 1)

      tocItems.push(`
        <div style="
          margin-left: ${(level - 1) * 20}px;
          margin-bottom: 8px;
          font-size: ${level === 1 ? '16px' : level === 2 ? '14px' : '12px'};
          font-weight: ${level === 1 ? '600' : '400'};
          color: ${level === 1 ? '#1f2937' : '#4b5563'};
          display: flex;
          justify-content: space-between;
          align-items: center;
        ">
          <span>${text}</span>
          <span style="
            border-bottom: 1px dotted #d1d5db;
            flex: 1;
            margin: 0 10px;
            min-width: 20px;
          "></span>
          <span>${index + 1}</span>
        </div>
      `)
    })

    if (tocItems.length === 0) return ''

    return `
      <div style="
        page-break-after: always;
        padding: 40px 0;
      ">
        <h2 style="
          font-size: 28px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 30px;
          text-align: center;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 15px;
        ">Table of Contents</h2>
        <div style="margin-top: 30px;">
          ${tocItems.join('')}
        </div>
      </div>
    `
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: 'var(--spacing-md)'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: 'var(--border-radius-lg)',
        width: '100%',
        maxWidth: '500px',
        maxHeight: '80vh',
        overflow: 'auto'
      }}>
        <div style={{
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Export PDF</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          {/* Filename */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontWeight: '500',
              fontSize: 'var(--font-size-sm)'
            }}>
              Filename
            </label>
            <input
              type="text"
              value={options.filename}
              onChange={(e) => setOptions(prev => ({ ...prev, filename: e.target.value }))}
              className="input"
              placeholder="rulebook.pdf"
            />
          </div>

          {/* Custom Cover Title */}
          <div style={{ marginBottom: 'var(--spacing-md)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontWeight: '500',
              fontSize: 'var(--font-size-sm)'
            }}>
              Cover Page Title (optional)
            </label>
            <input
              type="text"
              value={customCover}
              onChange={(e) => setCustomCover(e.target.value)}
              className="input"
              placeholder={rulebookTitle || 'Leave empty to use rulebook title'}
            />
          </div>

          {/* Format Options */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)'
              }}>
                Paper Size
              </label>
              <select
                value={options.format}
                onChange={(e) => setOptions(prev => ({ ...prev, format: e.target.value as 'a4' | 'letter' }))}
                className="input"
              >
                <option value="a4">A4</option>
                <option value="letter">Letter</option>
              </select>
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)'
              }}>
                Orientation
              </label>
              <select
                value={options.orientation}
                onChange={(e) => setOptions(prev => ({ ...prev, orientation: e.target.value as 'portrait' | 'landscape' }))}
                className="input"
              >
                <option value="portrait">Portrait</option>
                <option value="landscape">Landscape</option>
              </select>
            </div>
          </div>

          {/* Quality and Scale */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 'var(--spacing-md)',
            marginBottom: 'var(--spacing-md)'
          }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)'
              }}>
                Quality: {Math.round((options.quality || 0.95) * 100)}%
              </label>
              <input
                type="range"
                min="0.5"
                max="1"
                step="0.05"
                value={options.quality}
                onChange={(e) => setOptions(prev => ({ ...prev, quality: parseFloat(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: 'var(--spacing-xs)',
                fontWeight: '500',
                fontSize: 'var(--font-size-sm)'
              }}>
                Margin: {options.margin}mm
              </label>
              <input
                type="range"
                min="10"
                max="40"
                step="5"
                value={options.margin}
                onChange={(e) => setOptions(prev => ({ ...prev, margin: parseInt(e.target.value) }))}
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Additional Options */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              marginBottom: 'var(--spacing-sm)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={includeMetadata}
                onChange={(e) => setIncludeMetadata(e.target.checked)}
              />
              <span>Include metadata and cover page</span>
            </label>

            <label style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-xs)',
              cursor: 'pointer'
            }}>
              <input
                type="checkbox"
                checked={includeTableOfContents}
                onChange={(e) => setIncludeTableOfContents(e.target.checked)}
              />
              <span>Generate table of contents</span>
            </label>
          </div>

          {/* Export Button */}
          <Button
            variant="primary"
            onClick={handleExport}
            disabled={isExporting}
            style={{ width: '100%' }}
          >
            {isExporting ? '📄 Exporting...' : '📄 Export PDF'}
          </Button>
        </div>
      </div>
    </div>
  )
}