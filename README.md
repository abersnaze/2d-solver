
# Typescript module

This is an npm module built with TypeScript. It contains several useful build scripts. You can find the scripts by running the command

```sh
npm run
```

* `npm run clean`: clean the output folders `./es` and `./js`.
* `npm run tslint`: lint the ts files
* `npm run tsc`: compile the TypeScript in `./ts` into ES2015 in the `./es` folder.
* `npm run babel`: compile the ES2015 in the `./es` into JavaScript in the `./js` folder.
* `npm run compile`: run both the tsc and the babel steps.
* `npm run test`: run unit tests.
* `npm run watch`: continuously run unit tests.


