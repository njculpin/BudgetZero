import React, { useState } from 'react'
import { CollaboratorPresence, RulebookChange } from '../../hooks/useRulebookCollaboration'

interface CollaborationIndicatorsProps {
  collaborators: CollaboratorPresence[]
  recentChanges: RulebookChange[]
  isConnected: boolean
}

export function CollaborationIndicators({
  collaborators,
  recentChanges,
  isConnected
}: CollaborationIndicatorsProps) {
  const [showDetails, setShowDetails] = useState(false)

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const time = new Date(timestamp)
    const diffMs = now.getTime() - time.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffSecs = Math.floor(diffMs / 1000)

    if (diffSecs < 30) return 'just now'
    if (diffMins < 1) return `${diffSecs}s ago`
    if (diffMins < 60) return `${diffMins}m ago`
    return time.toLocaleTimeString()
  }

  const getOperationIcon = (operation: string) => {
    switch (operation) {
      case 'insert': return '✏️'
      case 'delete': return '🗑️'
      case 'format': return '🎨'
      default: return '📝'
    }
  }

  const getOperationText = (operation: string) => {
    switch (operation) {
      case 'insert': return 'added text'
      case 'delete': return 'deleted text'
      case 'format': return 'applied formatting'
      default: return 'made changes'
    }
  }

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: 'var(--spacing-xs)',
      alignItems: 'flex-end'
    }}>
      {/* Connection Status */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: 'var(--spacing-xs)',
        padding: 'var(--spacing-xs) var(--spacing-sm)',
        backgroundColor: isConnected ? 'var(--color-success)' : 'var(--color-gray-400)',
        color: 'white',
        borderRadius: 'var(--border-radius)',
        fontSize: 'var(--font-size-xs)',
        fontWeight: '500'
      }}>
        <div style={{
          width: '6px',
          height: '6px',
          borderRadius: '50%',
          backgroundColor: 'white'
        }} />
        {isConnected ? 'Connected' : 'Disconnected'}
      </div>

      {/* Collaborators */}
      {collaborators.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 'var(--spacing-xs)',
            padding: 'var(--spacing-xs) var(--spacing-sm)',
            backgroundColor: 'white',
            border: '1px solid var(--color-gray-200)',
            borderRadius: 'var(--border-radius)',
            boxShadow: 'var(--shadow)',
            cursor: 'pointer'
          }}
          onClick={() => setShowDetails(!showDetails)}
        >
          {/* Avatar Stack */}
          <div style={{ display: 'flex', marginRight: 'var(--spacing-xs)' }}>
            {collaborators.slice(0, 3).map((collaborator, index) => (
              <div
                key={collaborator.user_id}
                style={{
                  width: '24px',
                  height: '24px',
                  borderRadius: '50%',
                  backgroundColor: collaborator.avatar_url ? 'transparent' : 'var(--color-primary)',
                  border: '2px solid white',
                  marginLeft: index > 0 ? '-8px' : '0',
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: '600',
                  color: 'white',
                  zIndex: 3 - index
                }}
                title={collaborator.email}
              >
                {collaborator.avatar_url ? (
                  <img
                    src={collaborator.avatar_url}
                    alt={collaborator.email}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  collaborator.email.charAt(0).toUpperCase()
                )}
                {collaborator.is_typing && (
                  <div style={{
                    position: 'absolute',
                    bottom: '-2px',
                    right: '-2px',
                    width: '8px',
                    height: '8px',
                    backgroundColor: 'var(--color-warning)',
                    borderRadius: '50%',
                    border: '1px solid white'
                  }} />
                )}
              </div>
            ))}
            {collaborators.length > 3 && (
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-gray-400)',
                border: '2px solid white',
                marginLeft: '-8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 'var(--font-size-xs)',
                fontWeight: '600',
                color: 'white',
                zIndex: 0
              }}>
                +{collaborators.length - 3}
              </div>
            )}
          </div>

          <span style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-700)'
          }}>
            {collaborators.length} {collaborators.length === 1 ? 'editor' : 'editors'} online
          </span>
        </div>
      )}

      {/* Detailed View */}
      {showDetails && (
        <div style={{
          backgroundColor: 'white',
          border: '1px solid var(--color-gray-200)',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: 'var(--spacing-md)',
          minWidth: '300px',
          maxHeight: '400px',
          overflow: 'auto'
        }}>
          {/* Active Collaborators */}
          {collaborators.length > 0 && (
            <div style={{ marginBottom: 'var(--spacing-md)' }}>
              <h4 style={{
                margin: '0 0 var(--spacing-sm) 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--color-gray-800)'
              }}>
                Active Editors
              </h4>
              {collaborators.map(collaborator => (
                <div
                  key={collaborator.user_id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-sm)',
                    padding: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-xs)'
                  }}
                >
                  <div style={{
                    width: '20px',
                    height: '20px',
                    borderRadius: '50%',
                    backgroundColor: collaborator.avatar_url ? 'transparent' : 'var(--color-primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 'var(--font-size-xs)',
                    fontWeight: '600',
                    color: 'white',
                    position: 'relative'
                  }}>
                    {collaborator.avatar_url ? (
                      <img
                        src={collaborator.avatar_url}
                        alt={collaborator.email}
                        style={{
                          width: '100%',
                          height: '100%',
                          borderRadius: '50%',
                          objectFit: 'cover'
                        }}
                      />
                    ) : (
                      collaborator.email.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: 'var(--font-size-sm)',
                      fontWeight: '500',
                      color: 'var(--color-gray-800)'
                    }}>
                      {collaborator.full_name || collaborator.email}
                    </div>
                    <div style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-gray-500)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 'var(--spacing-xs)'
                    }}>
                      {collaborator.is_typing && '✏️ typing...'}
                      {!collaborator.is_typing && `last seen ${formatTimeAgo(collaborator.last_seen)}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Recent Changes */}
          {recentChanges.length > 0 && (
            <div>
              <h4 style={{
                margin: '0 0 var(--spacing-sm) 0',
                fontSize: 'var(--font-size-sm)',
                fontWeight: '600',
                color: 'var(--color-gray-800)'
              }}>
                Recent Changes
              </h4>
              {recentChanges.slice(-5).reverse().map(change => (
                <div
                  key={change.id}
                  style={{
                    padding: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-xs)',
                    backgroundColor: 'var(--color-gray-50)',
                    borderRadius: 'var(--border-radius)',
                    fontSize: 'var(--font-size-xs)'
                  }}
                >
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--spacing-xs)',
                    marginBottom: 'var(--spacing-xs)'
                  }}>
                    <span>{getOperationIcon(change.operation)}</span>
                    <span style={{
                      fontWeight: '500',
                      color: 'var(--color-gray-700)'
                    }}>
                      {change.email}
                    </span>
                    <span style={{ color: 'var(--color-gray-500)' }}>
                      {getOperationText(change.operation)}
                    </span>
                  </div>
                  <div style={{
                    color: 'var(--color-gray-500)',
                    fontSize: 'var(--font-size-xs)'
                  }}>
                    {formatTimeAgo(change.timestamp)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {collaborators.length === 0 && recentChanges.length === 0 && (
            <div style={{
              textAlign: 'center',
              color: 'var(--color-gray-500)',
              fontSize: 'var(--font-size-sm)',
              padding: 'var(--spacing-md)'
            }}>
              No other editors are currently online
            </div>
          )}
        </div>
      )}
    </div>
  )
}