# hengine

> A 2D game engine for javascript/typescript.

## TOC

- [Introduction](#introduction)
- [Usage](#usage)
- [Links](#links)

## Introduction

`hengine` is a 2D game engine with many basic functionalities such as scene management, graphic rendering, interaction detection and a simple physics engine. With `hengine`, you can easily create your own games. Also, you can use `hengine` to present other awesome 2D graphics.

## Usage

### npm

1. Use npm to install it as a dependency:

    ```bash
    npm install hengine
    ```

2. Import the exports of this lib:

    ```js
    // es2015+
    import * as HE from "hengine";
    // es5
    const HE = require("hengine");
    ```

3. Use it in your code.

### CDN

1. Include one of the following script tags in your HTML file:

    via jsdelivr:

    ```html
    <script type="text/javascript" crossorigin="anonymous" src="https://cdn.jsdelivr.net/npm/hengine@latest/dist/hengine.umd.min.js"></script>
    ```

    or via unpkg:

    ```html
    <script type="text/javascript" crossorigin="anonymous" src="https://unpkg.com/hengine@latest/dist/hengine.umd.min.js"></script>
    ```

2. Access the APIs via the `HE` global.

If you want a specified version, just replace `latest` with that in the url. By the way, it is recommended to use a specified version in production.

For more information about these two CDN sites, visit [www.jsdelivr.com](https://www.jsdelivr.com) or [unpkg.com](https://unpkg.com).

## Links

- [Documents](https://github.com/huang2002/hengine/wiki)
- [Changelog](./CHANGELOG.md)
- [License (MIT)](./LICENSE)
