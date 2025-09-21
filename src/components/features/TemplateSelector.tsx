import React, { useState } from 'react'
import { RulebookTemplate, getAllTemplates, getTemplatesByCategory } from '../../utils/rulebookTemplates'
import { Button } from '../ui'
import { Card, CardHeader, CardBody } from '../ui'

interface TemplateSelectorProps {
  onSelectTemplate: (template: RulebookTemplate) => void
  onClose: () => void
  gameCategory?: string
}

export function TemplateSelector({ onSelectTemplate, onClose, gameCategory }: TemplateSelectorProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(gameCategory || 'all')
  const allTemplates = getAllTemplates()

  const filteredTemplates = selectedCategory === 'all'
    ? allTemplates
    : getTemplatesByCategory(selectedCategory)

  const categories = [
    { value: 'all', label: 'All Templates' },
    { value: 'board-game', label: 'Board Games' },
    { value: 'card-game', label: 'Card Games' },
    { value: 'rpg', label: 'RPG' },
    { value: 'miniature-game', label: 'Miniature Games' },
    { value: 'other', label: 'Other' }
  ]

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
        maxWidth: '800px',
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
          <h2 style={{ margin: 0 }}>Choose a Rulebook Template</h2>
          <Button variant="secondary" size="small" onClick={onClose}>
            ✕ Close
          </Button>
        </div>

        <div style={{
          padding: 'var(--spacing-lg)',
          borderBottom: '1px solid var(--color-gray-200)'
        }}>
          <div style={{
            display: 'flex',
            gap: 'var(--spacing-sm)',
            flexWrap: 'wrap'
          }}>
            {categories.map(category => (
              <Button
                key={category.value}
                size="small"
                variant={selectedCategory === category.value ? 'primary' : 'secondary'}
                onClick={() => setSelectedCategory(category.value)}
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: 'var(--spacing-lg)'
        }}>
          {filteredTemplates.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: 'var(--spacing-2xl)',
              color: 'var(--color-gray-600)'
            }}>
              <p>No templates found for this category.</p>
            </div>
          ) : (
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 'var(--spacing-md)'
            }}>
              {filteredTemplates.map(template => (
                <Card key={template.id} style={{ cursor: 'pointer' }}>
                  <CardHeader>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: 'var(--spacing-sm)'
                    }}>
                      <h3 style={{ margin: 0, fontSize: 'var(--font-size-lg)' }}>
                        {template.name}
                      </h3>
                      <span style={{
                        padding: '0.25rem 0.5rem',
                        backgroundColor: 'var(--color-primary)',
                        color: 'white',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: 'var(--font-size-xs)',
                        fontWeight: '500',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap'
                      }}>
                        {template.category.replace('-', ' ')}
                      </span>
                    </div>
                  </CardHeader>
                  <CardBody>
                    <p style={{
                      color: 'var(--color-gray-600)',
                      fontSize: 'var(--font-size-sm)',
                      marginBottom: 'var(--spacing-md)',
                      lineHeight: '1.5'
                    }}>
                      {template.description}
                    </p>

                    <div style={{ marginBottom: 'var(--spacing-md)' }}>
                      <h4 style={{
                        fontSize: 'var(--font-size-sm)',
                        fontWeight: '600',
                        marginBottom: 'var(--spacing-xs)',
                        color: 'var(--color-gray-700)'
                      }}>
                        Includes:
                      </h4>
                      <div style={{
                        display: 'flex',
                        flexWrap: 'wrap',
                        gap: 'var(--spacing-xs)'
                      }}>
                        {template.sections.map(section => (
                          <span
                            key={section}
                            style={{
                              padding: '0.125rem 0.375rem',
                              backgroundColor: 'var(--color-gray-100)',
                              color: 'var(--color-gray-700)',
                              borderRadius: 'var(--border-radius-sm)',
                              fontSize: 'var(--font-size-xs)'
                            }}
                          >
                            {section}
                          </span>
                        ))}
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      size="small"
                      onClick={() => onSelectTemplate(template)}
                      style={{ width: '100%' }}
                    >
                      Use This Template
                    </Button>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </div>

        <div style={{
          padding: 'var(--spacing-lg)',
          borderTop: '1px solid var(--color-gray-200)',
          backgroundColor: 'var(--color-gray-50)',
          textAlign: 'center'
        }}>
          <p style={{
            margin: 0,
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-gray-600)'
          }}>
            You can customize any template after selecting it. These are just starting points to help you get organized.
          </p>
        </div>
      </div>
    </div>
  )
}