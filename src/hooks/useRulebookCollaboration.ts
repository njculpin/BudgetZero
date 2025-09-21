import { useEffect, useState, useRef } from 'react'
import { supabase, getCurrentUser } from '../lib/supabase'
import { RealtimeChannel } from '@supabase/supabase-js'

export interface CollaboratorPresence {
  user_id: string
  email: string
  full_name?: string
  avatar_url?: string
  cursor_position?: number
  last_seen: string
  is_typing: boolean
}

export interface RulebookChange {
  id: string
  user_id: string
  email: string
  operation: 'insert' | 'delete' | 'format'
  position: number
  content: string
  timestamp: string
}

export function useRulebookCollaboration(projectId: string, rulebookId?: string) {
  const [collaborators, setCollaborators] = useState<CollaboratorPresence[]>([])
  const [recentChanges, setRecentChanges] = useState<RulebookChange[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)
  const userRef = useRef<any>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout>()

  useEffect(() => {
    if (!rulebookId) return

    const setupCollaboration = async () => {
      const user = await getCurrentUser()
      if (!user) return

      userRef.current = user
      const channelName = `rulebook:${rulebookId}`

      // Create the realtime channel
      const channel = supabase.channel(channelName, {
        config: {
          presence: {
            key: user.id
          }
        }
      })

      channelRef.current = channel

      // Track presence (who's online)
      channel
        .on('presence', { event: 'sync' }, () => {
          const presenceState = channel.presenceState()
          const collaboratorList: CollaboratorPresence[] = []

          Object.keys(presenceState).forEach(userId => {
            const presence = presenceState[userId][0] as CollaboratorPresence
            if (presence && userId !== user.id) {
              collaboratorList.push(presence)
            }
          })

          setCollaborators(collaboratorList)
        })
        .on('presence', { event: 'join' }, ({ key, newPresences }) => {
          console.log('User joined:', key, newPresences)
        })
        .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
          console.log('User left:', key, leftPresences)
        })

      // Track content changes
      channel
        .on('broadcast', { event: 'content_change' }, (payload) => {
          const change = payload.payload as RulebookChange
          if (change.user_id !== user.id) {
            setRecentChanges(prev => [...prev.slice(-9), change])
          }
        })
        .on('broadcast', { event: 'cursor_move' }, (payload) => {
          const { user_id, position } = payload.payload
          if (user_id !== user.id) {
            setCollaborators(prev => prev.map(collab =>
              collab.user_id === user_id
                ? { ...collab, cursor_position: position }
                : collab
            ))
          }
        })
        .on('broadcast', { event: 'typing_start' }, (payload) => {
          const { user_id } = payload.payload
          if (user_id !== user.id) {
            setCollaborators(prev => prev.map(collab =>
              collab.user_id === user_id
                ? { ...collab, is_typing: true }
                : collab
            ))
          }
        })
        .on('broadcast', { event: 'typing_stop' }, (payload) => {
          const { user_id } = payload.payload
          if (user_id !== user.id) {
            setCollaborators(prev => prev.map(collab =>
              collab.user_id === user_id
                ? { ...collab, is_typing: false }
                : collab
            ))
          }
        })

      // Subscribe and track presence
      await channel.subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setIsConnected(true)

          // Track our own presence
          await channel.track({
            user_id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name,
            avatar_url: user.user_metadata?.avatar_url,
            last_seen: new Date().toISOString(),
            is_typing: false
          })
        }
      })
    }

    setupCollaboration()

    return () => {
      // Clean up typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
        typingTimeoutRef.current = undefined
      }

      // Unsubscribe from realtime channel
      if (channelRef.current) {
        channelRef.current.unsubscribe()
        channelRef.current = null
      }

      // Clear user reference
      userRef.current = null

      // Reset state to prevent stale data
      setCollaborators([])
      setRecentChanges([])
      setIsConnected(false)
    }
  }, [rulebookId])

  const broadcastContentChange = async (
    operation: 'insert' | 'delete' | 'format',
    position: number,
    content: string
  ) => {
    if (!channelRef.current || !userRef.current) return

    const change: RulebookChange = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2)}`,
      user_id: userRef.current.id,
      email: userRef.current.email || '',
      operation,
      position,
      content,
      timestamp: new Date().toISOString()
    }

    await channelRef.current.send({
      type: 'broadcast',
      event: 'content_change',
      payload: change
    })
  }

  const broadcastCursorMove = async (position: number) => {
    if (!channelRef.current || !userRef.current) return

    await channelRef.current.send({
      type: 'broadcast',
      event: 'cursor_move',
      payload: {
        user_id: userRef.current.id,
        position
      }
    })
  }

  const broadcastTypingStart = async () => {
    if (!channelRef.current || !userRef.current) return

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing_start',
      payload: {
        user_id: userRef.current.id
      }
    })

    // Auto-stop typing after 3 seconds
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
    typingTimeoutRef.current = setTimeout(() => {
      broadcastTypingStop()
    }, 3000)
  }

  const broadcastTypingStop = async () => {
    if (!channelRef.current || !userRef.current) return

    await channelRef.current.send({
      type: 'broadcast',
      event: 'typing_stop',
      payload: {
        user_id: userRef.current.id
      }
    })

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = undefined
    }
  }

  return {
    collaborators,
    recentChanges,
    isConnected,
    broadcastContentChange,
    broadcastCursorMove,
    broadcastTypingStart,
    broadcastTypingStop
  }
}