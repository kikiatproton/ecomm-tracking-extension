# Chrome Extension For E-comm QA

A tool for inspecting gluon calls

## Install in Chrome

1. download the code
2. open `chrome://extensions/`
3. turn on Developer mode
4. click "Load unpacked" button
5. choose the `dist` folder

## Development
### Prerequisites

* [node + npm](https://nodejs.org/) (Current Version)

### Project Structure

* src/typescript: TypeScript source files
* src/assets: static files
* dist: Chrome Extension directory
* dist/js: Generated JavaScript files

### Setup

```
npm install
```

### Import as Visual Studio Code project

...

### Build

```
npm run build
```

### Build in watch mode

### terminal

```
npm run watch
```

### Visual Studio Code

Run watch mode.

type `Ctrl + Shift + B`

### Load extension to chrome

Load `dist` directory

### Test
`npx jest` or `npm run test`
