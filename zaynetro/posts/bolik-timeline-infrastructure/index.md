+++
author = "Roman Zaynetdinov"
date = "2023-03-16T12:00:00+03:00"
title = "Bolik Timeline infrastructure"
description = "Bolik Timeline infrastructure is rather simple, yet it comes with a few unique solutions."
draft = false

[extra]
preview_image = { href = "dog_icon.png", alt = "Bolik Timeline logo" }
+++

![Bolik Timeline feature graphic](feature_graphic.jpg)

[Bolik Timeline](https://timeline.bolik.net/) is an application for managing personal documents like notes, photos and memories. It supports offline editing, is end-to-end encrypted and is open source unlike other popular solutions.

Read [an introductory blog post](/post/how-to-build-e2ee-local-first-app/) for more details.

<mermaid-block name="Bolik Timeline architecture">
flowchart LR
    App["#9742; Mobile app"] --> Fly{Fly.io Anycast routing}
    Fly --> S1([LiteFS])
    Fly --> S2([LiteFS])
    %% Warsaw section
    subgraph Warsaw
    S1 --> Backend1[Bolik backend]
    Backend1 --> DB1
    S1 --> DB1[(SQLite)]
    end
    %% Amsterdam section
    subgraph Amsterdam
    S2 --> DB2[(SQLite)]
    S2 --> Backend2[Bolik backend]
    Backend2 --> DB2
    end
    %% Consul
    S1 --> Consul[(Consul)]
    S2 --> Consul
    %% Backblaze
    Backend1 --> S3(["#128452; Backblaze B2"])
    Backend2 --> S3
</mermaid-block>

> Mobile app fetches files directly from B2 (same as S3). It is a bit messy to add this connection to the diagram.

What happens here?

A request from Bolik Timeline application goes through fly.io's network. fly.io uses anycast routing to direct the request to the "closest" backend server (either Amsterdam or Warsaw). Backend's entry point is a [LiteFS](https://github.com/superfly/litefs) process. LiteFS replicates SQLite database across the servers and also proxies HTTP requests to Bolik backend.

> Why does LiteFS work for Bolik Timeline? 
>
> In case leader dies we can tolerate some data loss because system is eventually-consistent and app will reupload lost data on the next connection.


## Use cases

Let's go through a few use cases to see what actually happens.

### Card upload

Card is basic editable unit in the app, think a note or a document. A card has textual content but can also contain file attachments.

All file attachments are encrypted with ChaCha20Poly1305 before upload.

<mermaid-block name="Card upload">
sequenceDiagram
    actor App as Application
    participant Backend as Bolik backend
    participant S3 as Backblaze B2
    %% Backend
    App ->> Backend: I want to upload a file of this size
    activate Backend
    Backend -->> App: Use this presigned URL to upload the file
    deactivate Backend
    %% S3
    App ->> S3: Upload a file
    activate S3
    Note over S3: All good: URL is valid and file size matches.
    S3 -->> App: Ack.
    deactivate S3
    %% App
    App ->> Backend: Upload a card
    activate Backend
    Backend ->> S3: Does this file exist?
    activate S3
    S3 -->> Backend: Yes
    deactivate S3
    Note over Backend: Verify that all file attachments were uploaded<br/>then save the card to SQLite.
    Backend -->> App: Ack.
    deactivate Backend
</mermaid-block>

### Read request

SQLite database is replicated on both servers. Read requests could be served by any node.

### Write request

With writes things get a bit more complicated. When server receives a request that is about to write to a database then the server should check if this node is a leader, if it is not then this request should be forwarded to a leader node.

Fly.io supports retargeting a request out of the box. You only need to respond with [a `fly-replay` header](https://fly.io/docs/reference/dynamic-request-routing/) and Fly's load balancer will forward the request to the specified target transparently to the user.

<mermaid-block name="Manual write request handling">
sequenceDiagram
    actor App as Application
    participant Fly as Fly Load Balancer
    participant Backend1 as Bolik backend in Amsterdam
    participant Backend2 as Bolik backend in Warsaw
    App ->> Fly: Save this card
    activate Fly
    Fly ->> Backend1: Save this card
    activate Backend1
    Note over Backend1: I am a reader and cannot handle this write request.
    Backend1 -->> Fly: Forward this request to Warsaw
    deactivate Backend1
    Fly ->> Backend2: Save this card
    activate Backend2
    Note over Backend2: I am a leader and can handle this write request.
    Backend2 -->> App: Ack.
    deactivate Backend2
    deactivate Fly
</mermaid-block>

Luckily, this use case becomes simpler with the introduction of [HTTP proxying](https://github.com/superfly/litefs/pull/271) in LiteFS. Your application doesn't need to worry about request forwarding. LiteFS will handle that for you.


## Future work

At the moment all servers are located in the EU. While the app works in asynchronous fashion (all updates are fetched on the background) file attachments are downloaded synchronously. 

First easy task would be to set up Backblaze mirroring (cloud replication) across regions. I will need to create a new account in the US and configure Backblaze to automatically mirror two buckets (EU ⇿ US). Then US users should notice a noticable speed up when downloading the files.
