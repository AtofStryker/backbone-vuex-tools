
# Backbone Vuex Tools
An example repository that can be used to adapt Backbone Models To POJO Objects with Vuex as its state management with a JSON:API Client

* Backbone Vuex Adapter: A tool used to adapt a Backbone model cache to Vuex
* Vuex Store: a Vuex implementation with a JSON:API client, using the Backbone Reactivity Adapter

### Getting Started


#### Prerequisites
```
node >= 12.13.0
npm i -g link-parent-bin
npm i -g lerna
npm i -g typescript
```

#### Depending on your setup, you may need to install `jest` as your test runner
```
npm i -g jest
```

##### install - will link all local dependencies and hoist all install dependencies
```
npm install
```

##### build all subsequent packages
```
npm run build 
```
##### test all subsequent packages
```
npm run test 
```
##### cleaning stale dependencies

```
npm run clean 
```

##### cleaning  stale builds
```
npm run cleanBuilds
```