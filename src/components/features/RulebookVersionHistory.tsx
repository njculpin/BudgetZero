import React, { useState } from 'react'
import DOMPurify from 'dompurify'
import { Button } from '../ui'
import { Card, CardHeader, CardBody } from '../ui'
import { useRulebookVersions } from '../../hooks/useRulebooks'
import { RulebookVersion } from '../../lib/supabase'

interface RulebookVersionHistoryProps {
  rulebookId: string
  onClose: () => void
  onRestoreVersion?: (version: RulebookVersion) => void
}

export function RulebookVersionHistory({
  rulebookId,
  onClose,
  onRestoreVersion
}: RulebookVersionHistoryProps) {
  const { data: versions, isLoading } = useRulebookVersions(rulebookId)
  const [selectedVersion, setSelectedVersion] = useState<RulebookVersion | null>(null)

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return {
      date: date.toLocaleDateString(),
      time: date.toLocaleTimeString()
    }
  }

  const formatTimeDiff = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 1) return 'just now'
    if (diffMins < 60) return `${diffMins} minutes ago`
    if (diffHours < 24) return `${diffHours} hours ago`
    if (diffDays < 7) return `${diffDays} days ago`
    return formatDate(dateString).date
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
        maxWidth: '1000px',
        maxHeight: '80vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-gray-200)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0 }}>Version History</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        <div style={{
          flex: 1,
          overflow: 'hidden',
          display: 'flex'
        }}>
          {/* Version List */}
          <div style={{
            width: '300px',
            borderRight: '1px solid var(--color-gray-200)',
            overflow: 'auto'
          }}>
            <div style={{ padding: 'var(--spacing-md)' }}>
              <h3 style={{
                margin: '0 0 var(--spacing-md) 0',
                fontSize: 'var(--font-size-base)',
                fontWeight: '600'
              }}>
                Versions
              </h3>

              {isLoading ? (
                <p>Loading versions...</p>
              ) : versions && versions.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-xs)' }}>
                  {versions.map((version) => (
                    <div
                      key={version.id}
                      onClick={() => setSelectedVersion(version)}
                      style={{
                        padding: 'var(--spacing-sm)',
                        borderRadius: 'var(--border-radius)',
                        cursor: 'pointer',
                        backgroundColor: selectedVersion?.id === version.id
                          ? 'var(--color-primary)'
                          : 'transparent',
                        color: selectedVersion?.id === version.id
                          ? 'white'
                          : 'var(--color-gray-800)',
                        border: '1px solid',
                        borderColor: selectedVersion?.id === version.id
                          ? 'var(--color-primary)'
                          : 'var(--color-gray-200)',
                        transition: 'all var(--transition-base)'
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: 'var(--spacing-xs)'
                      }}>
                        <span style={{ fontWeight: '600' }}>v{version.version}</span>
                        <span style={{
                          fontSize: 'var(--font-size-xs)',
                          opacity: 0.8
                        }}>
                          {formatTimeDiff(version.created_at)}
                        </span>
                      </div>
                      {version.change_summary && (
                        <p style={{
                          margin: 0,
                          fontSize: 'var(--font-size-sm)',
                          opacity: 0.9,
                          lineHeight: 1.3
                        }}>
                          {version.change_summary}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-gray-600)' }}>No version history available.</p>
              )}
            </div>
          </div>

          {/* Version Preview */}
          <div style={{
            flex: 1,
            overflow: 'auto',
            padding: 'var(--spacing-lg)'
          }}>
            {selectedVersion ? (
              <div>
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 'var(--spacing-lg)',
                  paddingBottom: 'var(--spacing-md)',
                  borderBottom: '1px solid var(--color-gray-200)'
                }}>
                  <div>
                    <h3 style={{ margin: 0, marginBottom: 'var(--spacing-xs)' }}>
                      Version {selectedVersion.version}
                    </h3>
                    <p style={{
                      margin: 0,
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-gray-600)'
                    }}>
                      {formatDate(selectedVersion.created_at).date} at {formatDate(selectedVersion.created_at).time}
                    </p>
                    {selectedVersion.change_summary && (
                      <p style={{
                        margin: 'var(--spacing-xs) 0 0 0',
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '500',
                        color: 'var(--color-gray-700)'
                      }}>
                        {selectedVersion.change_summary}
                      </p>
                    )}
                  </div>
                  {onRestoreVersion && (
                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => onRestoreVersion(selectedVersion)}
                    >
                      🔄 Restore This Version
                    </Button>
                  )}
                </div>

                {/* Content Preview */}
                <div style={{
                  border: '1px solid var(--color-gray-200)',
                  borderRadius: 'var(--border-radius)',
                  padding: 'var(--spacing-lg)',
                  backgroundColor: 'var(--color-gray-50)',
                  maxHeight: '400px',
                  overflow: 'auto'
                }}>
                  <div
                    dangerouslySetInnerHTML={{
                      __html: DOMPurify.sanitize(selectedVersion.content, {
                        ALLOWED_TAGS: ['p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'br', 'table', 'thead', 'tbody', 'tr', 'th', 'td'],
                        ALLOWED_ATTR: ['class', 'style']
                      })
                    }}
                    style={{
                      fontFamily: 'var(--font-family)',
                      lineHeight: 1.6,
                      color: 'var(--color-gray-800)'
                    }}
                  />
                </div>
              </div>
            ) : (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                height: '100%',
                color: 'var(--color-gray-500)',
                textAlign: 'center'
              }}>
                <div>
                  <p style={{ margin: 0, marginBottom: 'var(--spacing-sm)' }}>
                    📝 Select a version from the list to see its content
                  </p>
                  <p style={{ margin: 0, fontSize: 'var(--font-size-sm)' }}>
                    You can restore any previous version of your rulebook
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}