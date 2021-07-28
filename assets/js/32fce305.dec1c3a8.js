(self.webpackChunkmutoid_website=self.webpackChunkmutoid_website||[]).push([[698],{3905:function(t,e,n){"use strict";n.d(e,{Zo:function(){return l},kt:function(){return d}});var r=n(7294);function a(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function i(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?o(Object(n),!0).forEach((function(e){a(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function s(t,e){if(null==t)return{};var n,r,a=function(t,e){if(null==t)return{};var n,r,a={},o=Object.keys(t);for(r=0;r<o.length;r++)n=o[r],e.indexOf(n)>=0||(a[n]=t[n]);return a}(t,e);if(Object.getOwnPropertySymbols){var o=Object.getOwnPropertySymbols(t);for(r=0;r<o.length;r++)n=o[r],e.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(t,n)&&(a[n]=t[n])}return a}var u=r.createContext({}),c=function(t){var e=r.useContext(u),n=e;return t&&(n="function"==typeof t?t(e):i(i({},e),t)),n},l=function(t){var e=c(t.components);return r.createElement(u.Provider,{value:e},t.children)},p={inlineCode:"code",wrapper:function(t){var e=t.children;return r.createElement(r.Fragment,{},e)}},m=r.forwardRef((function(t,e){var n=t.components,a=t.mdxType,o=t.originalType,u=t.parentName,l=s(t,["components","mdxType","originalType","parentName"]),m=c(n),d=a,f=m["".concat(u,".").concat(d)]||m[d]||p[d]||o;return n?r.createElement(f,i(i({ref:e},l),{},{components:n})):r.createElement(f,i({ref:e},l))}));function d(t,e){var n=arguments,a=e&&e.mdxType;if("string"==typeof t||a){var o=n.length,i=new Array(o);i[0]=m;var s={};for(var u in e)hasOwnProperty.call(e,u)&&(s[u]=e[u]);s.originalType=t,s.mdxType="string"==typeof t?t:a,i[1]=s;for(var c=2;c<o;c++)i[c]=n[c];return r.createElement.apply(null,i)}return r.createElement.apply(null,n)}m.displayName="MDXCreateElement"},6748:function(t,e,n){"use strict";n.r(e),n.d(e,{frontMatter:function(){return s},contentTitle:function(){return u},metadata:function(){return c},toc:function(){return l},default:function(){return m}});var r=n(2122),a=n(9756),o=(n(7294),n(3905)),i=["components"],s={sidebar_label:"State",sidebar_position:2},u="State management",c={unversionedId:"modules/state",id:"modules/state",isDocsHomePage:!1,title:"State management",description:"`ts",source:"@site/docs/02-modules/02-state.md",sourceDirName:"02-modules",slug:"/modules/state",permalink:"/mutoid/docs/modules/state",editUrl:"https://github.com/facile-it/mutoid/edit/master/website/docs/02-modules/02-state.md",version:"current",sidebarPosition:2,frontMatter:{sidebar_label:"State",sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Data serializer",permalink:"/mutoid/docs/modules/http/data-serializer"},next:{title:"React",permalink:"/mutoid/docs/modules/react"}},l=[{value:"Create store",id:"create-store",children:[]},{value:"Read the status from anywhere",id:"read-the-status-from-anywhere",children:[]},{value:"Mutation",id:"mutation",children:[{value:"ctorMutation",id:"ctormutation",children:[]},{value:"ctorPartialMutation",id:"ctorpartialmutation",children:[]}]},{value:"Store notifier",id:"store-notifier",children:[]}],p={toc:l};function m(t){var e=t.components,n=(0,a.Z)(t,i);return(0,o.kt)("wrapper",(0,r.Z)({},p,n,{components:e,mdxType:"MDXLayout"}),(0,o.kt)("h1",{id:"state-management"},"State management"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-ts"},"import * as MS from 'mutoid/state'\n")),(0,o.kt)("h2",{id:"create-store"},"Create store"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"declare module 'mutoid/state/stores' {\n    interface Stores {\n        appStore: 'mutation' | 'partialMutation'\n    }\n}\n\nconst appStore = () => MS.ctor({ name: 'appStore', initState: { userName: 'Marco' } })\n")),(0,o.kt)("p",null,"You can choose to use a singleton store or a lazy store. In some cases, to use a lazy store it's a better choice",(0,o.kt)("br",{parentName:"p"}),"\n","If you declare the store name and the mutation names with module augmentation, the notifier can inference the mutation name in the subject",(0,o.kt)("br",{parentName:"p"}),"\n","In any case, if you don't declare anything there is a fallback to string"),(0,o.kt)("h2",{id:"read-the-status-from-anywhere"},"Read the status from anywhere"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"import { pipe } from 'fp-ts/pipeable'\nimport * as T from 'fp-ts/Task'\nimport * as C from 'fp-ts/Console'\n\nconst program = pipe(\n    MS.toTask(appStore),\n    T.map(s => `Hello ${s.userName}`),\n    T.chainIOK(C.log)\n)\n\nprogram()\n")),(0,o.kt)("p",null,(0,o.kt)("em",{parentName:"p"},"If you use a lazy store, make sure to use the correct instance")),(0,o.kt)("h2",{id:"mutation"},"Mutation"),(0,o.kt)("h3",{id:"ctormutation"},"ctorMutation"),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"declare const store: Store<S>\ndeclare const id: number\n\nconst identityMutation = () => MS.ctorMutation('mutation', (id: number) => (currentState: S): Observable<S> => of(s))\n\nconst mutation = MS.mutationRunner(store, identityMutation)\n\n// run\nmutation(id)\n")),(0,o.kt)("p",null,(0,o.kt)("em",{parentName:"p"},"mutation with deps")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"declare const store: Store<S>\ndeclare const id: number\ndeclare const deps: {\n    someService: someService\n}\n\nconst identityMutation = (deps: typeof deps) =>\n    MS.ctorMutation('mutation', (id: number) => (currentState: S): Observable<S> => of(s))\n\nconst mutation = MS.mutationRunner(store, identityMutation, { deps: { someService } })\n\n// run\nmutation(id)\n")),(0,o.kt)("h3",{id:"ctorpartialmutation"},"ctorPartialMutation"),(0,o.kt)("p",null,(0,o.kt)("em",{parentName:"p"},"mutation runs only if the state matches the predicate, useful if your store is a state machine")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"declare const store: Store<S>\ndeclare const id: number\n\nconst identityPartialMutation = () =>\n    MS.ctorPartialMutation(\n        'partialMutation',\n        (currentState: S): currentState is SS => currentState.type === 'ss',\n        (id: number) => (currentState: SS): Observable<S> => of(s)\n    )\n\nconst mutation = MS.mutationRunner(store, identityPartialMutation)\n\n// run\nmutation(id)\n")),(0,o.kt)("p",null,"If you want to cancel the mutation ",(0,o.kt)("inlineCode",{parentName:"p"},"MS.mutationRunner"),' accept as third parameter "options" with propriety ',(0,o.kt)("inlineCode",{parentName:"p"},"notifierTakeUntil?: Observable<unknown>")),(0,o.kt)("h2",{id:"store-notifier"},"Store notifier"),(0,o.kt)("p",null,"emit: ",(0,o.kt)("inlineCode",{parentName:"p"},"initStore"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"mutationLoad"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"mutationStart"),", ",(0,o.kt)("inlineCode",{parentName:"p"},"mutationEnd")),(0,o.kt)("pre",null,(0,o.kt)("code",{parentName:"pre",className:"language-typescript"},"declare const store: Store<S>\n\nstore.notifier$.subscribe(e =>\n    Sentry.addBreadcrumb({\n        category: 'mutation',\n        message: action.type,\n        level: Severity.Info,\n        data: e,\n    })\n)\n")))}m.isMDXComponent=!0}}]);