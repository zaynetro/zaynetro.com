+++
author = "Roman Zaynetdinov"
date = 2023-02-04T12:00:00+03:00
title = "Support light and dark color themes in CSS"
draft = false

[extra]
preview_image = { href = "post/light-dark-modes-css/css_logo.png", alt = "CSS logo" }
+++

Do you want you website to look different depending on user's color preference. This website supports both light and dark modes. Try changing the setting and see this site updating live.

## Basic example

```css
body {
  background-color: #fff;
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: #000;
  }
}
```

So what happens here? By default background color of the web page will be white but in case user uses dart mode black color will be applied.

If you prefer to separate CSS styles into several files you can conditionally import them *(OK, both files will be imported but only one matching the condition will be applied)*.

```css
/* Apply styles from "theme-dark.css" if user uses dart mode */
@import url("theme-dark.css") (prefers-color-scheme: dark);

/* Apply styles from "theme-light.css" if user uses light mode */
@import url("theme-light.css") (prefers-color-scheme: light);
```


## CSS variables

It's 2023 now and if you don't care about supporting IE you can use [CSS variables](https://caniuse.com/css-variables). Let's see how our example might look like with variables.

```css
:root {
  --bg-color: #fff;
}

@media (prefers-color-scheme: dark) {
  :root {
    --bg-color: #000;
  }
}

body {
  background-color: var(--bg-color);
}
```

I think this example is self-explanatory. Instead of overriding the styles we override a variable.


## JavaScript

What if you want to change the theme with JavaScript? It is suprisingly easy to do:

```js
if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
  // This will run only once and if user uses dark theme.
}

window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (event) => {
  // This will run every time user setting changes.
});
```

Thanks to this StackOverflow [answer](https://stackoverflow.com/a/57795495).


## Zola

[Zola](https://www.getzola.org/) supports syntax highlighting of code snippets. 

In your `config.toml`:

```toml
[markdown]
# Enable syntax highlighting
highlight_code = true
# Instead of adding inline styles export styles as CSS files.
highlight_theme = "css"
highlight_themes_css = [
  { theme = "solarized", filename = "syntax-theme-dark.css" },
  { theme = "solarized-light", filename = "syntax-theme-light.css" },
]
```

And then in your CSS file:

```css
@import url("/syntax-theme-dark.css") (prefers-color-scheme: dark);
@import url("/syntax-theme-light.css") (prefers-color-scheme: light);
```

Now your code snippets support light and dark modes.
