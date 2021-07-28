(self.webpackChunkmutoid_website=self.webpackChunkmutoid_website||[]).push([[600],{3905:function(e,t,r){"use strict";r.d(t,{Zo:function(){return p},kt:function(){return m}});var n=r(7294);function a(e,t,r){return t in e?Object.defineProperty(e,t,{value:r,enumerable:!0,configurable:!0,writable:!0}):e[t]=r,e}function i(e,t){var r=Object.keys(e);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(e);t&&(n=n.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),r.push.apply(r,n)}return r}function o(e){for(var t=1;t<arguments.length;t++){var r=null!=arguments[t]?arguments[t]:{};t%2?i(Object(r),!0).forEach((function(t){a(e,t,r[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(r)):i(Object(r)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(r,t))}))}return e}function c(e,t){if(null==e)return{};var r,n,a=function(e,t){if(null==e)return{};var r,n,a={},i=Object.keys(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||(a[r]=e[r]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(n=0;n<i.length;n++)r=i[n],t.indexOf(r)>=0||Object.prototype.propertyIsEnumerable.call(e,r)&&(a[r]=e[r])}return a}var l=n.createContext({}),u=function(e){var t=n.useContext(l),r=t;return e&&(r="function"==typeof e?e(t):o(o({},t),e)),r},p=function(e){var t=u(e.components);return n.createElement(l.Provider,{value:t},e.children)},s={inlineCode:"code",wrapper:function(e){var t=e.children;return n.createElement(n.Fragment,{},t)}},d=n.forwardRef((function(e,t){var r=e.components,a=e.mdxType,i=e.originalType,l=e.parentName,p=c(e,["components","mdxType","originalType","parentName"]),d=u(r),m=a,f=d["".concat(l,".").concat(m)]||d[m]||s[m]||i;return r?n.createElement(f,o(o({ref:t},p),{},{components:r})):n.createElement(f,o({ref:t},p))}));function m(e,t){var r=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=r.length,o=new Array(i);o[0]=d;var c={};for(var l in t)hasOwnProperty.call(t,l)&&(c[l]=t[l]);c.originalType=e,c.mdxType="string"==typeof e?e:a,o[1]=c;for(var u=2;u<i;u++)o[u]=r[u];return n.createElement.apply(null,o)}return n.createElement.apply(null,r)}d.displayName="MDXCreateElement"},2854:function(e,t,r){"use strict";r.r(t),r.d(t,{frontMatter:function(){return c},contentTitle:function(){return l},metadata:function(){return u},toc:function(){return p},default:function(){return d}});var n=r(2122),a=r(9756),i=(r(7294),r(3905)),o=["components"],c={sidebar_label:"Data fetching",sidebar_position:1},l="Data fetching",u={unversionedId:"modules/http/data-fetching",id:"modules/http/data-fetching",isDocsHomePage:!1,title:"Data fetching",description:"The main purpose of this module, it's expose an ADT (algebraic data type) for managing the response of http calls",source:"@site/docs/02-modules/01-http/01-data-fetching.md",sourceDirName:"02-modules/01-http",slug:"/modules/http/data-fetching",permalink:"/mutoid/docs/modules/http/data-fetching",editUrl:"https://github.com/facile-it/mutoid/edit/master/website/docs/02-modules/01-http/01-data-fetching.md",version:"current",sidebarPosition:1,frontMatter:{sidebar_label:"Data fetching",sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Getting started",permalink:"/mutoid/docs/getting-started"},next:{title:"Resource",permalink:"/mutoid/docs/modules/http/resource"}},p=[{value:"Module content",id:"module-content",children:[]},{value:"Deep dive",id:"deep-dive",children:[]}],s={toc:p};function d(e){var t=e.components,r=(0,a.Z)(e,o);return(0,i.kt)("wrapper",(0,n.Z)({},s,r,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"data-fetching"},"Data fetching"),(0,i.kt)("p",null,"The main purpose of this module, it's expose an ADT (algebraic data type) for managing the response of http calls"),(0,i.kt)("p",null,"We don't consider safe design, something like this:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const { data, error } = fetch('/api/user')\n")),(0,i.kt)("h3",{id:"module-content"},"Module content"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"./resource"},"Resource")," ",(0,i.kt)("em",{parentName:"li"},"the ADT")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"./fetch-factory-and-cache"},"Fetch factory and cache")," ",(0,i.kt)("em",{parentName:"li"},"helper for standardize responses and cache")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"./data-serializer"},"Data serializer")," ",(0,i.kt)("em",{parentName:"li"},"helper for serialize data"))),(0,i.kt)("h3",{id:"deep-dive"},"Deep dive"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://medium.com/javascript-inside/slaying-a-ui-antipattern-in-fantasyland-907cbc322d2a"},"Slaying a ui antipattern")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://www.youtube.com/watch?v=rs8rzYmKzVE"},"Milano TS - Algebraic Data Type")," ",(0,i.kt)("em",{parentName:"li"},"vidoe ita"))))}d.isMDXComponent=!0}}]);