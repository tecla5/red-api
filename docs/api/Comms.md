# Coomunications

For publish/subscribe notifications over Web socket connection

Public API

- `init(_server,runtime)`
- `start()`
- `stop()`
- `publish(topic,data,retain)`

Methods

- `handleStatus(event)`
- `handleRuntimeEvent(event)`
- `publishTo(ws,topic,data)`
- `handleRemoteSubscription(ws,topic)`
- `removeActiveConnection(ws)`
- `removePendingConnection(ws)`
