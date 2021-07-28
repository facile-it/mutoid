(self.webpackChunkmutoid_website=self.webpackChunkmutoid_website||[]).push([[600],{3905:function(e,t,n){"use strict";n.d(t,{Zo:function(){return s},kt:function(){return f}});var r=n(7294);function a(e,t,n){return t in e?Object.defineProperty(e,t,{value:n,enumerable:!0,configurable:!0,writable:!0}):e[t]=n,e}function i(e,t){var n=Object.keys(e);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(e);t&&(r=r.filter((function(t){return Object.getOwnPropertyDescriptor(e,t).enumerable}))),n.push.apply(n,r)}return n}function o(e){for(var t=1;t<arguments.length;t++){var n=null!=arguments[t]?arguments[t]:{};t%2?i(Object(n),!0).forEach((function(t){a(e,t,n[t])})):Object.getOwnPropertyDescriptors?Object.defineProperties(e,Object.getOwnPropertyDescriptors(n)):i(Object(n)).forEach((function(t){Object.defineProperty(e,t,Object.getOwnPropertyDescriptor(n,t))}))}return e}function c(e,t){if(null==e)return{};var n,r,a=function(e,t){if(null==e)return{};var n,r,a={},i=Object.keys(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||(a[n]=e[n]);return a}(e,t);if(Object.getOwnPropertySymbols){var i=Object.getOwnPropertySymbols(e);for(r=0;r<i.length;r++)n=i[r],t.indexOf(n)>=0||Object.prototype.propertyIsEnumerable.call(e,n)&&(a[n]=e[n])}return a}var u=r.createContext({}),l=function(e){var t=r.useContext(u),n=t;return e&&(n="function"==typeof e?e(t):o(o({},t),e)),n},s=function(e){var t=l(e.components);return r.createElement(u.Provider,{value:t},e.children)},p={inlineCode:"code",wrapper:function(e){var t=e.children;return r.createElement(r.Fragment,{},t)}},d=r.forwardRef((function(e,t){var n=e.components,a=e.mdxType,i=e.originalType,u=e.parentName,s=c(e,["components","mdxType","originalType","parentName"]),d=l(n),f=a,m=d["".concat(u,".").concat(f)]||d[f]||p[f]||i;return n?r.createElement(m,o(o({ref:t},s),{},{components:n})):r.createElement(m,o({ref:t},s))}));function f(e,t){var n=arguments,a=t&&t.mdxType;if("string"==typeof e||a){var i=n.length,o=new Array(i);o[0]=d;var c={};for(var u in t)hasOwnProperty.call(t,u)&&(c[u]=t[u]);c.originalType=e,c.mdxType="string"==typeof e?e:a,o[1]=c;for(var l=2;l<i;l++)o[l]=n[l];return r.createElement.apply(null,o)}return r.createElement.apply(null,n)}d.displayName="MDXCreateElement"},2854:function(e,t,n){"use strict";n.r(t),n.d(t,{frontMatter:function(){return c},contentTitle:function(){return u},metadata:function(){return l},toc:function(){return s},default:function(){return d}});var r=n(2122),a=n(9756),i=(n(7294),n(3905)),o=["components"],c={sidebar_label:"Data fetching",sidebar_position:1},u="Data fetching",l={unversionedId:"modules/http/data-fetching",id:"modules/http/data-fetching",isDocsHomePage:!1,title:"Data fetching",description:"The main purpose of this module, is to expose an ADT (algebraic data type) to manage the response of http calls",source:"@site/docs/02-modules/01-http/01-data-fetching.md",sourceDirName:"02-modules/01-http",slug:"/modules/http/data-fetching",permalink:"/mutoid/docs/modules/http/data-fetching",editUrl:"https://github.com/facile-it/mutoid/edit/master/website/docs/02-modules/01-http/01-data-fetching.md",version:"current",sidebarPosition:1,frontMatter:{sidebar_label:"Data fetching",sidebar_position:1},sidebar:"tutorialSidebar",previous:{title:"Getting started",permalink:"/mutoid/docs/getting-started"},next:{title:"Resource",permalink:"/mutoid/docs/modules/http/resource"}},s=[{value:"Deep dive",id:"deep-dive",children:[]}],p={toc:s};function d(e){var t=e.components,n=(0,a.Z)(e,o);return(0,i.kt)("wrapper",(0,r.Z)({},p,n,{components:t,mdxType:"MDXLayout"}),(0,i.kt)("h1",{id:"data-fetching"},"Data fetching"),(0,i.kt)("p",null,"The main purpose of this module, is to expose an ADT (algebraic data type) to manage the response of http calls"),(0,i.kt)("p",null,"We don't consider safe design, like this one:"),(0,i.kt)("pre",null,(0,i.kt)("code",{parentName:"pre",className:"language-ts"},"const { data, error } = fetch('/api/user')\n")),(0,i.kt)("h3",{id:"deep-dive"},"Deep dive"),(0,i.kt)("ul",null,(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://medium.com/javascript-inside/slaying-a-ui-antipattern-in-fantasyland-907cbc322d2a"},"Slaying a ui antipattern")),(0,i.kt)("li",{parentName:"ul"},(0,i.kt)("a",{parentName:"li",href:"https://www.youtube.com/watch?v=rs8rzYmKzVE"},"Milano TS - Algebraic Data Type")," ",(0,i.kt)("em",{parentName:"li"},"video ita"))))}d.isMDXComponent=!0}}]);