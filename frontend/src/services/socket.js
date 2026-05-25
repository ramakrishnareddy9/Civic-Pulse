import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'

let client = null
let subscriptions = {}

export const connectSocket = (token) => {
  if (client && client.active) return client

  client = new Client({
    // Use SockJS for broader transport compatibility
    webSocketFactory: () => new SockJS('/ws'),
    connectHeaders: token ? { Authorization: `Bearer ${token}` } : {},
    debug: (str) => {
      // comment out or route to logger if desired
      // console.debug('[STOMP]', str)
    },
    reconnectDelay: 5000,
  })

  client.onConnect = () => {
    // noop - consumers will subscribe as needed
  }

  client.onStompError = (frame) => {
    console.error('Broker reported error: ', frame.headers['message'])
  }

  client.activate()
  return client
}

export const disconnectSocket = () => {
  try {
    Object.values(subscriptions).forEach((sub) => sub.unsubscribe())
    subscriptions = {}
    if (client) {
      client.deactivate()
      client = null
    }
  } catch (err) {
    console.warn('Error while disconnecting socket', err)
  }
}

export const subscribeTopic = (topic, handler) => {
  if (!client) {
    client = connectSocket()
  }

  if (!client.connected) {
    console.warn(`[STOMP Offline Mode] Queueing subscription to: ${topic} (awaiting connection)`)
    
    const originalOnConnect = client.onConnect
    client.onConnect = (frame) => {
      if (originalOnConnect) {
        try {
          originalOnConnect(frame)
        } catch (e) {}
      }
      try {
        console.log(`[STOMP] Activating queued subscription for: ${topic}`)
        subscriptions[topic] = client.subscribe(topic, (msg) => {
          if (msg.body) {
            try {
              handler(JSON.parse(msg.body))
            } catch (err) {
              console.warn('Failed to parse stomp message', err)
            }
          }
        })
      } catch (err) {
        console.warn(`[STOMP] Failed to subscribe to queued topic ${topic}:`, err.message)
      }
    }
  } else {
    try {
      subscriptions[topic] = client.subscribe(topic, (msg) => {
        if (msg.body) {
          try {
            handler(JSON.parse(msg.body))
          } catch (err) {
            console.warn('Failed to parse stomp message', err)
          }
        }
      })
    } catch (err) {
      console.warn(`[STOMP] Direct subscription failed for topic ${topic}:`, err.message)
    }
  }

  return () => {
    if (subscriptions[topic]) {
      try {
        subscriptions[topic].unsubscribe()
      } catch (e) {}
      delete subscriptions[topic]
    }
  }
}

export const sendToTopic = (destination, payload) => {
  if (!client || !client.active) return
  client.publish({ destination, body: JSON.stringify(payload) })
}
