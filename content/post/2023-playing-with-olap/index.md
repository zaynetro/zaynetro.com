+++
author = "Roman Zaynetdinov"
date = 2023-04-18T12:00:00+03:00
title = "Which embedded OLAP database to pick?"
description = "Databases for OLAP (online analytical processing) use a column-oriented storage for speeding up analytical queries significantly and for reducing a database size. There are a couple of embedded implementation that push the limits of speed."
draft = false

[extra]
preview_image = "post/2023-playing-with-olap/preview.png"
+++

## Intro

{{ responsive_img(path="post/2023-playing-with-olap/main.jpg" alt="OLAP databases") }}

I am creating a project that handles visitor events from browsing a website. I need to build an analytical dashboard for reporting purposes. There has been a lot of talk lately that you might not need any cloud solutions and you could survive with an embedded database on a single instance. Is that true?

In this post I will explore how [SQLite](https://sqlite.org/) compares to [DuckDB](https://duckdb.org/), [Polars](https://www.pola.rs/) and [Apache DataFusion](https://arrow.apache.org/datafusion/).

> **Note:** This is not a benchmark! This is me exploring different solutions using their default interfaces.
>
> *If you wish to see the results you can [jump directly to them](#results).*

For my test I am going to generate random events that happen during a visitor session. Let's say a visitor goes to a website and interacts with it. Then they might open a few more pages and interact with them or not. For the purposes of this experiment there are only three distinct events that might happen:

* Page load: `{ "path": "/", "user_agent": "firefox" }`
* Chat message: `{ "text": "Hello!" }`
* Form submission: 
    * `{ "form_type": "feedback", "fields": [{ "name": "score", "value": "80" }] }`
    * *OR* `{ "form_type": "contact-us", "fields": [{ "name": "email", "value": "a@b" }] }`

Every event has a unique id, a session id and a page id. Page id and session id are used to group events from the same page and from the same session accordingly.

Let's define event schema for SQLite:

```sql
CREATE TABLE events (
  id TEXT,
  session_id TEXT,
  page_id TEXT,
  timestamp TEXT,
  event_type TEXT,
  payload TEXT
);
```

Payload is a JSON string. 

SQLite, MySQL and co will store events in a row-oriented storage:

| id   | session_id | page_id | timestamp           | event_type   | payload                |
|:-----|:-----------|:--------|:--------------------|:-------------|:-----------------------|
| id-1 | s-1        | p-1     | 2023-04-18 12:00:00 | page_load    | `{ "path": "/", ...`   |
| id-2 | s-1        | p-1     | 2023-04-18 12:01:00 | chat_message | `{ "text": "Hello!" }` |
| ...  | ...        | ...     | ...                 | ...          | ...                    |

This format works great for inserts and fetching individual rows. 

[Online analytical processing (OLAP)](https://en.wikipedia.org/wiki/Online_analytical_processing) needs are different though. For OLAP you need to query large amounts of data and return grouped results of individual fields.
Column-oriented storage works much in favour. 

What is column-oriented storage? Our example above will be roughly stored as series of values per field:

|            |                      |                        |     |
|:-----------|:---------------------|:-----------------------|:----|
| **id**         | id-1                 | id-2                   | ... |
| **session_id** | s-1                  | s-1                    | ... |
| **page_id**    | p-1                  | p-1                    | ... |
| **timestamp**  | 2023-04-18 12:00:00  | 2023-04-18 12:01:00    | ... |
| **event_type** | page_load            | chat_message           | ... |
| **payload**    | `{ "path": "/", ...` | `{ "text": "Hello!" }` | ... |

This format allows for storage saving and query execution optimizations like:

1. Timestamp values could record a difference from the previous value, a delta instead of storing a complete date.
1. Queries that select a single field need to read only a single row.

Column-oriented storage references:

* <https://en.wikipedia.org/wiki/Column-oriented_DBMS>
* <https://docs.aws.amazon.com/redshift/latest/dg/c_columnar_storage_disk_mem_mgmnt.html>
* <https://parquet.apache.org/docs/file-format/>
* <https://arrow.apache.org/blog/2022/10/05/arrow-parquet-encoding-part-1/>

So far we have been treating payload as a JSON string. In fact OLAP databases support structs and lists so we can define a typed schema for our payload. Let's use DuckDB for schema definition in SQL:

```sql
CREATE TABLE events (
  id VARCHAR,
  session_id VARCHAR,
  page_id VARCHAR,
  timestamp TIMESTAMP,
  event_type VARCHAR,
  payload STRUCT(
    path VARCHAR,
    user_agent VARCHAR,
    text VARCHAR,
    form_type VARCHAR,
    fields STRUCT(name VARCHAR, value VARCHAR)[]
  )
);
```

{{ poll(id="olap-sources" title="Where to you follow tech updates?", items=["Hacker News", "Lobste.rs", "Reddit", "Twitter", "Other"]) }}

## Queries comparison

Querying DuckDB is exactly the same as querying SQLite. Let's try to find the most visited pages:

```sql
SELECT payload->>'$.path' AS path, COUNT(*) AS count
  FROM events
 WHERE
     event_type = 'page_load'
 GROUP BY path
 ORDER BY count DESC
 LIMIT 5
```

This query is the same for SQLite and DuckDB where payload field as JSON. For typed payload field we only need to modify field extraction in the SELECT-case:

```diff
-SELECT payload->>'$.path' AS path, COUNT(*) AS count
+SELECT payload.path AS path, COUNT(*) AS count
```

Now let's take a look at "Average feedback score" query. This query requires extracting a struct field, a first list element and also casting a string to a number.

SQLite is by far the simplest. It also does the casting for us:

```sql
SELECT AVG(payload->>'$.fields[0].value') AS average
  FROM events
 WHERE
     event_type = 'form_submit'
     AND payload->>'$.form_type' = 'feedback';
```

Typed DuckDB:

```sql
SELECT AVG(TRY_CAST(payload.fields[1].value AS INTEGER)) AS average
  FROM events
 WHERE
     event_type = 'form_submit'
     AND payload.form_type = 'feedback';
```

Polars:

```rust
let pres = df
    .filter(
        col("event_type").eq(lit("form_submit"))
        .and(col("payload")
                .struct_()
                .field_by_name("form_type")
                .eq(lit("feedback")),
        ),
    )
    .select([
        // '$.fields[0].value
        col("payload")
            .struct_().field_by_name("fields")
            .arr().first()
            .struct_().field_by_name("value")
            .cast(DataType::Int32)
            .alias("score"),
    ])
    .select([avg("score")])
    .collect()?;
```


## Results

Queries were run on Macbook Air M2 from an application written in Rust. [Source code](https://github.com/zaynetro/compare-olap-rust) for the tests.

### 2M events

My data generator inserted *2'274'231* event rows. Let's see file sizes:

| File                      | Size |
|:--------------------------|:-----|
| SQLite                    | 593M |
| DuckDB *(JSON payload)*   | 190M |
| DuckDB *(Typed payload)*  | 177M |
| Parquet *(Typed payload)* | 171M |
| CSV                       | 555M |
| JSON                      | 701M |

You can see how column-oriented storage solutions decrease the file size. Parquet is ~70% smaller than SQLite!

Now to the queries:

| Query                          | SQLite | DuckDB[^duckdb] | Polars | DataFusion             |
|:-------------------------------|:-------|:----------------|:-------|:-----------------------|
| Count by event_type            | 700ms  | 10ms            | 25ms   | 80ms                   |
| Average page loads per session | 255ms  | 10ms            | 45ms   | 115ms                  |
| Average feedback score         | 255ms  | 35ms            | 160ms  | — [^datafusion-nested] |
| Top pages                      | 370ms  | 30ms            | 190ms  | 460ms                  |
| Page loads per day             | 235ms  | 5ms             | 20ms   | 55ms                   |
| Form submissions               | 485ms  | 40ms            | 225ms  | 550ms                  |
| Form submissions by page       | 535ms  | 60ms            | 380ms  | 535ms                  |

### 22M events

My data generator inserted *22'754'423* event rows. Let's see file sizes:

| File                      | Size |
|:--------------------------|:-----|
| SQLite                    | 5.8G |
| DuckDB *(JSON payload)*   | 1.7G |
| DuckDB *(Typed payload)*  | 1.7G |
| Parquet *(Typed payload)* | 1.7G |

Now to the queries:

| Query                          | SQLite  | DuckDB[^duckdb] *(Typed)*[^duckdb-typed] | Polars | DataFusion             |
|:-------------------------------|:--------|:-----------------------------------------|:-------|:-----------------------|
| Count by event_type            | 10350ms | 70ms                                     | 200ms  | 775ms                  |
| Average page loads per session | 5180ms  | 95ms                                     | 470ms  | 1170ms                 |
| Average feedback score         | 4845ms  | 500ms                                    | 2185ms | — [^datafusion-nested] |
| Top pages                      | 7820ms  | 455ms *(350ms)*                          | 2070ms | 4655ms                 |
| Page loads per day             | 4890ms  | 70ms                                     | 165ms  | 520ms                  |
| Form submissions               | 8020ms  | 345ms *(355ms)*                          | 2972ms | 5830ms                 |
| Form submissions by page       | 12340ms | 620ms *(650ms)*                          | 6980ms | 9380ms                 |

[^duckdb]: DuckDB results with payload as JSON string.

[^datafusion-nested]: DataFusion doesn't fully support nested structs: <https://github.com/apache/arrow-datafusion/issues/2179>

[^duckdb-typed]: In parenthesis you can see DuckDB results with typed payload. 

### Notes about results: 

> * I used Polars and DataFusion as crates. At least for Polars there are additional features that could be enabled to increase the performance which I haven't tried.
> * I have included DuckDB results with payload as JSON string. Typed DuckDB is consistently 1-2ms faster on a smaller dataset. On a larger dataset typed DuckDB was slower on some queries.
> * Polars supports SQL queries as well. I just wanted to play around with DataFrame API in Rust.
> * Looking at [H2O.ai benchmark](https://duckdb.org/2023/04/14/h2oai.html#results) Polars should be as fast as DuckDB. Maybe I am doing something wrong.
> * SQL is a very portable interface. SQLite, DuckDB and DataFusion queries are almost the same.

### Feelings

Overall, it was a nice experiment. I really liked using DuckDB and Polars. Polars feels to be targeted more towards Python users as Rust documentation is a bit lacking. 
DuckDB uses 1-based indexing on arrays. It took me some time to realize it though :/

Honestly, I am impressed with how well DuckDB performed especially with payload as JSON string. I really like the flexibility of just using JSON and not worrying about the schema. 

All projects that I played with are built around [Apache Parquet](https://parquet.apache.org/) and [Apache Arrow](https://arrow.apache.org/). Andy Pavlo described the future of OLAP databases really well:

> The long-term trend to watch is the proliferation of frameworks like Velox, DataFusion, and Polars. Along with projects like Substrait, the commoditization of these query execution components means that all OLAP DBMSs will be roughly equivalent in the next five years. Instead of building a new DBMS entirely from scratch or hard forking an existing system (e.g., how Firebolt forked Clickhouse), people are better off using an extensible framework like Velox. This means that every DBMS will have the same vectorized execution capabilities that were unique to Snowflake ten years ago. And since in the cloud, the storage layer is the same for everyone (e.g., Amazon controls EBS/S3), the critical differentiator between DBMS offerings will be things that are difficult to quantify, like UI/UX stuff and query optimization.  
> Ref: <https://ottertune.com/blog/2022-databases-retrospective/>

If you are not sold to the idea of storing Apache Parquet files on S3 and using an embedded DB engine to query them then you might try [ClickHouse](https://clickhouse.com/).


## Open questions

* I am yet to find a good way to write Parquet files. Using `parquet` crate directly feels a bit complicated (I just can't comprehend the docs). Both Polars and DuckDB could write Parquet files. Shall I stick to the same approach I used for this experiment: write to DuckDB and export from it or is there a better solution?
* DuckDB and Polars could read Apache Parquet files directly from S3. DuckDB also claims that they will download only file parts that are necessary to facilitate the query. I haven't tried an S3 integration but that is definitely something I would like to test.
* Can Polars run faster?

If you have any tips or answers, please, do let me know!
