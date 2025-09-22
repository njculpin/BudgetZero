import { useState } from 'react'
import { Button } from '../ui'

interface RulebookSharingDialogProps {
  projectId: string
  rulebookTitle: string
  onClose: () => void
}

export function RulebookSharingDialog({
  projectId,
  rulebookTitle,
  onClose
}: RulebookSharingDialogProps) {
  const [shareLevel, setShareLevel] = useState<'private' | 'contributors' | 'public'>('contributors')
  const [allowComments, setAllowComments] = useState(true)
  const [allowDownload, setAllowDownload] = useState(false)
  const [expirationDate, setExpirationDate] = useState('')

  const generateShareLink = () => {
    const baseUrl = window.location.origin
    const shareParams = new URLSearchParams({
      level: shareLevel,
      comments: allowComments.toString(),
      download: allowDownload.toString(),
      expires: expirationDate || ''
    })
    return `${baseUrl}/share/rulebook/${projectId}?${shareParams.toString()}`
  }

  const copyShareLink = () => {
    const link = generateShareLink()
    navigator.clipboard.writeText(link).then(() => {
      alert('Share link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link. Please copy it manually.')
    })
  }

  const shareViaEmail = () => {
    const link = generateShareLink()
    const subject = encodeURIComponent(`Shared Rulebook: ${rulebookTitle}`)
    const body = encodeURIComponent(`I'd like to share this game rulebook with you:\n\n${rulebookTitle}\n\nView it here: ${link}`)
    window.open(`mailto:?subject=${subject}&body=${body}`)
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
          <h2 style={{ margin: 0 }}>Share Rulebook</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        <div style={{ padding: 'var(--spacing-lg)' }}>
          {/* Share Level */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: '600',
              fontSize: 'var(--font-size-base)'
            }}>
              Who can access this rulebook?
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                backgroundColor: shareLevel === 'private' ? 'var(--color-gray-50)' : 'white'
              }}>
                <input
                  type="radio"
                  name="shareLevel"
                  value="private"
                  checked={shareLevel === 'private'}
                  onChange={(e) => setShareLevel(e.target.value as typeof shareLevel)}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>🔒 Private</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                    Only project owner and invited editors
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                backgroundColor: shareLevel === 'contributors' ? 'var(--color-gray-50)' : 'white'
              }}>
                <input
                  type="radio"
                  name="shareLevel"
                  value="contributors"
                  checked={shareLevel === 'contributors'}
                  onChange={(e) => setShareLevel(e.target.value as typeof shareLevel)}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>👥 Contributors</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                    Anyone involved in the project
                  </div>
                </div>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                padding: 'var(--spacing-sm)',
                border: '1px solid var(--color-gray-200)',
                borderRadius: 'var(--border-radius)',
                cursor: 'pointer',
                backgroundColor: shareLevel === 'public' ? 'var(--color-gray-50)' : 'white'
              }}>
                <input
                  type="radio"
                  name="shareLevel"
                  value="public"
                  checked={shareLevel === 'public'}
                  onChange={(e) => setShareLevel(e.target.value as typeof shareLevel)}
                />
                <div>
                  <div style={{ fontWeight: '500' }}>🌍 Public</div>
                  <div style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-gray-600)' }}>
                    Anyone with the link can view
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Permissions */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-sm)',
              fontWeight: '600',
              fontSize: 'var(--font-size-base)'
            }}>
              Permissions
            </label>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-sm)' }}>
              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={allowComments}
                  onChange={(e) => setAllowComments(e.target.checked)}
                />
                <span>Allow comments and feedback</span>
              </label>

              <label style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--spacing-sm)',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={allowDownload}
                  onChange={(e) => setAllowDownload(e.target.checked)}
                />
                <span>Allow PDF download</span>
              </label>
            </div>
          </div>

          {/* Expiration */}
          <div style={{ marginBottom: 'var(--spacing-lg)' }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontWeight: '500',
              fontSize: 'var(--font-size-sm)'
            }}>
              Link Expiration (optional)
            </label>
            <input
              type="date"
              value={expirationDate}
              onChange={(e) => setExpirationDate(e.target.value)}
              className="input"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Share Link Preview */}
          <div style={{
            padding: 'var(--spacing-md)',
            backgroundColor: 'var(--color-gray-50)',
            borderRadius: 'var(--border-radius)',
            marginBottom: 'var(--spacing-lg)'
          }}>
            <label style={{
              display: 'block',
              marginBottom: 'var(--spacing-xs)',
              fontWeight: '500',
              fontSize: 'var(--font-size-sm)'
            }}>
              Share Link
            </label>
            <div style={{
              padding: 'var(--spacing-sm)',
              backgroundColor: 'white',
              border: '1px solid var(--color-gray-200)',
              borderRadius: 'var(--border-radius)',
              fontSize: 'var(--font-size-sm)',
              wordBreak: 'break-all',
              color: 'var(--color-gray-700)'
            }}>
              {generateShareLink()}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="primary"
              onClick={copyShareLink}
              style={{ flex: 1 }}
            >
              📋 Copy Link
            </Button>
            <Button
              variant="secondary"
              onClick={shareViaEmail}
              style={{ flex: 1 }}
            >
              📧 Email
            </Button>
          </div>

          {/* Security Notice */}
          <div style={{
            marginTop: 'var(--spacing-lg)',
            padding: 'var(--spacing-sm)',
            backgroundColor: 'var(--color-gray-50)',
            borderLeft: '3px solid var(--color-warning)',
            borderRadius: 'var(--border-radius)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-700)'
          }}>
            <strong>Security Note:</strong> Anyone with the share link will be able to access your rulebook according to the permissions you've set. You can change these settings or disable sharing at any time.
          </div>
        </div>
      </div>
    </div>
  )
}