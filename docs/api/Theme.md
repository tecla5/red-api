# Theme

Theme manager

- `init(runtime)`
- `app()`
- `context()`
- `settings()`
- `serveFile(baseUrl,file)`

Default context

```js
{
    page: {
        title: "Node-RED",
        favicon: "favicon.ico",
        tabicon: "red/images/node-red-icon-black.svg"
    },
    header: {
        title: "Node-RED",
        image: "red/images/node-red.png"
    },
    asset: {
        red: (process.env.NODE_ENV == "development")? "red/red.js":"red/red.min.js",
        main: (process.env.NODE_ENV == "development")? "red/main.js":"red/main.min.js",

    }
}
```

