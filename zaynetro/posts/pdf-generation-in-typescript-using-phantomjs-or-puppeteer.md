+++
author = "Roman Zaynetdinov"
title = "PDF generation in Typescript using PhantomJS or Puppeteer"
date = "2018-01-04T10:54:39+02:00"
+++

Surprisingly, PDF generation is not a trivial task to accomplish and may
lead to hours of boring work. Including generating valid XML and processing it
through a couple of utilities to finally get a PDF file.

There is one type of applications though that everyone uses on day-to-day basis
which handles PDF generation with great confidence. Could we reuse browsers
to solve so common issue? It turns out we can do that
very much straightforwardly and simply.

Headless WebKit to the rescue! Webkit can be run in [headless mode](https://en.wikipedia.org/wiki/Headless_browser)
and can run on the servers in the cloud.

In the post will use Typescript on Node.js.
You are not limited to this setup as WebKit runs as a separate process
and can be managed by any programming language.

There are a few Node.js libraries that build a layer on top WebKit process
that allows you to control the process in a scriptable manner:

* [PhantomJS](http://phantomjs.org/)
* [Puppeteer](https://github.com/GoogleChrome/puppeteer)

Both of them support loading any webpage and rendering PDF file from HTML page
contents. That's what we are planning to achieve by the end of this post.

*Note:* This post covers only PDF generation with those solutions although
you can do much more with them.


## PhantomJS

> PhantomJS is a headless WebKit scriptable with a JavaScript API.
> It has fast and native support for various web standards: DOM handling,
> CSS selector, JSON, Canvas, and SVG.

In addition to that quote from [phantomjs.org](http://phantomjs.org/)
PhantomJS supports rendering HTML pages into PDF documents
([docs](http://phantomjs.org/api/webpage/method/render.html)).

In a nutshell PDF generation can be as simple as:

```typescript
import { Response, Request } from 'express';
import * as phantom from 'phantom';
import * as os from 'os';
import * as crypto from 'crypto';
import * as path from 'path';

async function renderPDF(req: Request, res: Response) {
  const instance = await phantom.create();
  const page = await instance.createPage();
  const status = await page.open('https://duckduckgo.com/');

  const dir = os.tmpdir();
  const name = crypto.randomBytes(12).toString('hex') + '.pdf';
  const pdfPath = path.join(dir, name);
  await page.render(pdfPath);

  res.sendFile(pdfPath);
  instance.exit();
}

```

This will render duckduckgo.com page into PDF and save to a local file that
will be served from express application.

The power of PhantomJS is that it is a headless WebKit behind the scenes.
Any page WebKit can render PhantomJS will render as well.

There is one catch with current PhantomJS version (v2.1.1):

> PhantomJS at the moment is using old WebKit version. Not all modern HTML/CSS
> features are supported.

It is a bit dissapointing but the promise to release a new version that is going
to use a modern engine.

In addition to PDF PhantomJS documentation say:

> Renders the web page to an image buffer and saves it as the specified filename.
> Supported formats:
>
> * PDF
> * PNG
> * JPEG
> * BMP
> * PPM
> * GIF support depends on the build of Qt used

This means we can generate not only PDF files from HTML but also other image types.

The good thing about PDF support is that text is selectable in the PDF so the
document is not just an image
(*[this is not working in PhantomJS for macos](https://github.com/ariya/phantomjs/issues/10373)*).


### PhantomJS: Other request types

In the example above webpage was loaded as if you typed it in the browser
dialog (just a GET request). The power of PhantomJS comes in allowing us to send
any request type, request headers and request payload whenever we want
to load the page.

From [phantom docs](http://phantomjs.org/api/webpage/method/open.html):

```javascript
var webPage = require('webpage');
var page = webPage.create();
var settings = {
  operation: "POST",
  encoding: "utf8",
  headers: {
    "Content-Type": "application/json"
  },
  data: JSON.stringify({
    some: "data",
    another: ["custom", "data"]
  })
};

page.open('http://your.custom.api', settings, function(status) {
  console.log('Status: ' + status);
  // Do other things here...
});
```

You can find an example of how this can be useful in
[the sample repo](https://github.com/zaynetro/pdf-generator-typescript-sample/blob/38b46637f5c0847e29dcb2a3692cfb57001846fe/src/controllers/template.ts#L43).

## Puppeteer

Alternative solution to PhantomJS is [Puppeteer](https://github.com/GoogleChrome/puppeteer).

> Puppeteer is a Node library which provides a high-level API to control
> headless Chrome or Chromium over the DevTools Protocol. It can also be
> configured to use full (non-headless) Chrome or Chromium.


```typescript
import { Response, Request, NextFunction } from 'express';
import * as puppeteer from 'puppeteer';

async renderPDF(req: Request, res: Response, next: NextFunction) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  const response = await page.goto('https://duckduckgo.com/', {
    waitUntil: 'networkidle2'
  });

  const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
  res.send(pdfBuffer);

  await browser.close();
}

```

As can see API is very much similar to the one we just saw with PhantomJS.

One thing I like about using Puppeteer is that it generates exactly the same
PDF as if you'd have pressed print button on a page in the
browser.

Puppeteer also supports sending other request types in addition to the basic
GET method. You can see the usage in
[the sample repo](https://github.com/zaynetro/pdf-generator-typescript-sample/blob/38b46637f5c0847e29dcb2a3692cfb57001846fe/src/controllers/template.ts#L110).


## Bonus: API validation

Something I was struggling with when doing a Node.js service was
API models validation. That's why I decided to include a special section
on how you could achive that.

If you decide to implement HTML rendering by POST request it would be nice
to include API validation as well. This can be easily achieved by reading models
definitions from your app [swagger](https://swagger.io/specification/) file.

```typescript
import { Response, Request, NextFunction } from 'express';
import * as SwaggerParser from 'swagger-parser';
import * as Ajv from 'ajv';

async function validatedAPI(req: Request, res: Response, next: NextFunction) {
  const schema = await SwaggerParser.dereference('./public/swagger.yaml');
  const ajv = new Ajv();
  const valid = ajv.validate(this.schema.definitions.TemplateParameters, req.body);
  if (!valid) {
    return next(new Error('Invalid request payload: ' + ajv.errorsText()));
  }

  res.send('validated');
};
```

In the example above swagger spec contains `TemplateParameters` schema definition which
is used by [ajv](https://github.com/epoberezkin/ajv) to validate request body.


## Sample project

Everything that is discussed in this post can be found in
the [pdf-generation-sample repository](https://github.com/zaynetro/pdf-generator-typescript-sample).
