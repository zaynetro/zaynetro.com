+++
author = "Roman Zaynetdinov"
date = "2017-04-10T20:02:24+03:00"
title = "Hello world!"
+++

This is my first blog post. I will try some features over here.

* Bold text: **bold text**
* Italic text: *italic text*
* Underscore text: _underscore text_
* Strikethrough text: ~~strikethrough text~~
* Inline code: `inline code`


Tasks:

* [ ] a task list item
* [ ] list syntax required
* [ ] incomplete
* [x] completed

Fractions:

* one third 1/3


## Some code

Some code below:

```javascript
// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    var a = 'hey';
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}
```

More:

```rust
fn get_server_id() -> String {
    let letters = "abcdefghijklmnopqrstuvwxyz";
    let half = (letters.len() as f32 / 2.0) as usize;
    let i = rand::thread_rng().gen_range(0, half);
    let j = rand::thread_rng().gen_range(0, half);
    let mut chars = letters.chars();
    let a = chars.nth(i);
    let b = chars.nth(j);
    format!("{}{}", a.unwrap(), b.unwrap()).to_uppercase()
}
```

More:

```go
func getScoresMessage(scores map[string]int) (string, bool) {
	str, err := json.Marshal(scores)
	if err != nil {
		return "", false
	}

	return string(str), true
}
```

More:

```bash
#!/bin/bash

if [[ ! -a "$HOME/.vimrc" ]]; then
  touch "$HOME/.vimrc"
fi

vimrc_changed=`diff -q vimrc $HOME/.vimrc`

# Check if user has vim and git
check_requirements() {
  local vimloc=`which vim`
  if [[ ! -x $vimloc ]]; then
          echo "vim is required"
          exit 1
  fi

  local gitloc=`which git`
  if [[ ! -x $gitloc ]]; then
          echo "git is required"
          exit 1
  fi
}

```

More:

```vim
" .vimrc file
" Created by Roman Zaynetdinov
" //github.com/zaynetro
"

" Vim options {{{

set modelines=1       " Enable file specific overrides
"set nocompatible     " Use Vim settings, rather than Vi (not working in neovim)
set mouse=a           " Enable mouse in all modes
set background=dark
set number            " Show line numbers
set relativenumber    " Show relative line numbers
set cursorline        " Highlight current line
set lazyredraw        " Redraw only when need to
set showmatch         " Highlight matching [{()}]
set incsearch         " Search as characters are entered
set ignorecase        " Case-insensitive search
set hlsearch          " Highlight search results
set showbreak=⇇       " Char to show on the wrapped lines

" }}}


" Key mappings {{{

let mapleader=","     " Set leader key binding
" Quick escape
imap jk <ESC>
" Space open/closes folds
nnoremap <space> za

" }}}
```

## Links

* Home page: [Home page](https://zaynetro.com)

Look, just because I don't be givin' no man a foot massage don't make it right for Marsellus to throw Antwone into a glass motherfuckin' house, fuckin' up the way the nigger talks. Motherfucker do that shit to me, he better paralyze my ass, 'cause I'll kill the motherfucker, know what I'm sayin'?

Now that there is the Tec-9, a crappy spray gun from South Miami. This gun is advertised as the most popular gun in American crime. Do you believe that shit? It actually says that in the little book that comes with it: the most popular gun in American crime. Like they're actually proud of that shit.

This is my first blog post. I will try some features over here.

* Bold text: **bold text**
* Italic text: *italic text*
* Underscore text: _underscore text_
* Strikethrough text: ~~strikethrough text~~
* Inline code: `inline code`
