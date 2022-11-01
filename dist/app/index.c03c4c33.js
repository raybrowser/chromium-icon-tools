function e(e){return e&&e.__esModule?e.default:e}
/**
 * @author Michael Wasserman
 * @copyright Michael Wasserman 2018
 * @license MIT https://github.com/michaelwasserman/vector-icon-app/blob/main/LICENSE
 */function t(e){console.log("notimplemented(vector-icon): "+e)}class r{constructor(e,t){this.commands_=e,this.delegate_=t,this.svg_=null,this.paths_=[],this.currentPath_=null,this.pathD_=[],this.clipRect_=null}paint(){var e=this.commands_.length;this.svg_=document.createElementNS("http://www.w3.org/2000/svg","svg"),this.svg_.setAttribute("width","48"),this.svg_.setAttribute("height","48"),this.svg_.setAttribute("fill-rule","evenodd"),this.svg_.classList.add("vector-svg"),this.currentPath_=this.createPath();for(var t=0;t<e&&"END"!=this.commands_[t][0];++t)this.processCommand(this.commands_[t]);if(this.pathD_.length>0&&this.currentPath_.setAttribute("d",this.pathD_.join(" ")),this.clipRect_){var r=document.createElementNS("http://www.w3.org/2000/svg","clipPath");r.setAttribute("id","clip-path"),this.svg_.appendChild(r);var n=document.createElementNS("http://www.w3.org/2000/svg","rect");n.setAttribute("x",this.clipRect_[0]),n.setAttribute("y",this.clipRect_[1]),n.setAttribute("width",this.clipRect_[2]),n.setAttribute("height",this.clipRect_[3]),r.appendChild(n),this.paths_.forEach((e=>e.setAttribute("clip-path","url(#clip-path)")))}var a=this.svg_;return this.paths_.forEach((e=>a.appendChild(e))),this.svg_}closeCurrentPath(){this.currentPath_&&(this.currentPath_.setAttribute("d",this.pathD_.join(" ")),this.pathD_=[],this.currentPath_=null)}createPath(){this.closeCurrentPath();var e=document.createElementNS("http://www.w3.org/2000/svg","path");return e.setAttribute("fill","gray"),e.setAttribute("stroke","gray"),e.setAttribute("stroke-width","0px"),e.setAttribute("stroke-linecap","round"),e.setAttribute("shape-rendering","geometricPrecision"),this.paths_.push(e),e}createCircle(e){var t=parseFloat(e[0]),r=parseFloat(e[1]),n=parseFloat(e[2]);[["M",t,r],["m",-n,"0"],["a",n,n,0,1,0,2*n,0],["a",n,n,0,1,0,2*-n,0]].forEach((e=>this.pathD_.push(e.join(" "))))}createRoundRect(e){var t=parseFloat(e[0]),r=parseFloat(e[1]),n=parseFloat(e[2]),a=parseFloat(e[3]),s=parseFloat(e[4]);[["M",t+s,r],["h",n-s-s],["a",s,s,0,0,1,s,s],["v",a-s-s],["a",s,s,0,0,1,-s,s],["h",-(n-s-s)],["a",s,s,0,0,1,-s,-s],["v",-(a-s-s)],["a",s,s,0,0,1,s,-s]].forEach((e=>this.pathD_.push(e.join(" "))))}processCommand(e){if("CANVAS_DIMENSIONS"==e[0])return this.svg_.setAttribute("width",e[1]),void this.svg_.setAttribute("height",e[1]);if("NEW_PATH"!=e[0]){if("PATH_COLOR_ARGB"==e[0]){var r="rgba("+[e[2],e[3],e[4],e[1]].map((e=>parseInt(e))).join(",")+")";return this.currentPath_.style.fill=r,void(this.currentPath_.style.stroke=r)}if("PATH_MODE_CLEAR"!=e[0])if("STROKE"!=e[0])if("CAP_SQUARE"!=e[0])if("DISABLE_AA"!=e[0])if("CLIP"!=e[0])if("CIRCLE"!=e[0])if("ROUND_RECT"!=e[0])if("//"!=e[0]){var n={MOVE_TO:"M",R_MOVE_TO:"m",ARC_TO:"A",R_ARC_TO:"a",LINE_TO:"L",R_LINE_TO:"l",H_LINE_TO:"H",R_H_LINE_TO:"h",V_LINE_TO:"V",R_V_LINE_TO:"v",CUBIC_TO:"C",R_CUBIC_TO:"c",CUBIC_TO_SHORTHAND:"S",CLOSE:"Z"};if(e[0]in n){var a=[n[e[0]]].concat(e.splice(1).map(parseFloat));this.pathD_.push(a.join(" "))}else t(e.join(","))}else console.log("COMMENT");else this.createRoundRect(e.splice(1));else this.createCircle(e.splice(1));else this.clipRect_=e.splice(1).map((e=>e.trim()+"px"));else this.currentPath_.setAttribute("shape-rendering","crispEdges");else this.currentPath_.style["stroke-linecap"]="square";else this.currentPath_.setAttribute("stroke-width",e[1]+"px");else t(e[0])}else this.currentPath_=this.createPath()}}function n(e){var t=e.split("\n").filter((e=>e.length&&!e.startsWith("//"))).map((e=>e.trim().split(",").filter((e=>e.length>0)))),n=new r(t).paint();return(new XMLSerializer).serializeToString(n)}var a=/[a-zA-Z0-9:_-]/,s=/[\s\t\r\n]/,i=/['"]/;function o(e){var t="",r=[],n=u,o=null,l=null;function c(t){var r=function(e,t,r){if("number"==typeof r)throw new Error("locate takes a { startIndex, offsetLine, offsetColumn } object as the third argument");return function(e,t){void 0===t&&(t={});var r=t.offsetLine||0,n=t.offsetColumn||0,a=e.split("\n"),s=0,i=a.map((function(e,t){var r=s+e.length+1,n={start:s,end:r,line:t};return s=r,n})),o=0;function l(e,t){return e.start<=t&&t<e.end}function c(e,t){return{line:r+e.line,column:n+t-e.start,character:t}}return function(t,r){"string"==typeof t&&(t=e.indexOf(t,r||0));for(var n=i[o],a=t>=n.end?1:-1;n;){if(l(n,t))return c(n,t);n=i[o+=a]}}}(e,r)(t,r&&r.startIndex)}(e,_),n=r.line,a=r.column,s=e.slice(0,_),i=/(^|\n).*$/.exec(s)[0].replace(/\t/g,"  "),o=e.slice(_),l=""+i+/.*(\n|$)/.exec(o)[0]+"\n"+function(e,t){for(var r="";t--;)r+=e;return r}(" ",i.length)+"^";throw new Error(t+" ("+n+":"+a+"). If this is valid SVG, it's probably a bug in svg-parser. Please raise an issue at https://github.com/Rich-Harris/svg-parser/issues – thanks!\n\n"+l)}function u(){for(;_<e.length&&"<"!==e[_]||!a.test(e[_+1]);)t+=e[_++];return h()}function h(){for(var t="";_<e.length&&"<"!==e[_];)t+=e[_++];return/\S/.test(t)&&o.children.push({type:"text",value:t}),"<"===e[_]?p:h}function p(){var t=e[_];if("?"===t)return h;if("!"===t){if("--"===e.slice(_+1,_+3))return d;if("[CDATA["===e.slice(_+1,_+8))return g;if(/doctype/i.test(e.slice(_+1,_+8)))return h}if("/"===t)return f;var n,a={type:"element",tagName:m(),properties:{},children:[]};for(o?o.children.push(a):l=a;_<e.length&&(n=v());)a.properties[n.name]=n.value;var s=!1;return"/"===e[_]&&(_+=1,s=!0),">"!==e[_]&&c("Expected >"),s||(o=a,r.push(a)),h}function d(){var t=e.indexOf("--\x3e",_);return~t||c("expected --\x3e"),_=t+2,h}function g(){var t=e.indexOf("]]>",_);return~t||c("expected ]]>"),o.children.push(e.slice(_+7,t)),_=t+2,h}function f(){var t=m();return t||c("Expected tag name"),t!==o.tagName&&c("Expected closing tag </"+t+"> to match opening tag <"+o.tagName+">"),w(),">"!==e[_]&&c("Expected >"),r.pop(),o=r[r.length-1],h}function m(){for(var t="";_<e.length&&a.test(e[_]);)t+=e[_++];return t}function v(){if(!s.test(e[_]))return null;w();var t=m();if(!t)return null;var r=!0;return w(),"="===e[_]&&(_+=1,w(),r=i.test(e[_])?function(){for(var t=e[_++],r="",n=!1;_<e.length;){var a=e[_++];if(a===t&&!n)return r;"\\"!==a||n||(n=!0),r+=n?"\\"+a:a,n=!1}}():function(){var t="";do{var r=e[_];if(" "===r||">"===r||"/"===r)return t;t+=r,_+=1}while(_<e.length);return t}(),isNaN(r)||""===r.trim()||(r=+r)),{name:t,value:r}}function w(){for(;_<e.length&&s.test(e[_]);)_+=1}for(var _=u.length;_<e.length;)n||c("Unexpected character"),n=n(),_+=1;return n!==h&&c("Unexpected end of input"),"svg"===l.tagName&&(l.metadata=t),{type:"root",children:[l]}}var l,c;c={aliceblue:[240,248,255],antiquewhite:[250,235,215],aqua:[0,255,255],aquamarine:[127,255,212],azure:[240,255,255],beige:[245,245,220],bisque:[255,228,196],black:[0,0,0],blanchedalmond:[255,235,205],blue:[0,0,255],blueviolet:[138,43,226],brown:[165,42,42],burlywood:[222,184,135],cadetblue:[95,158,160],chartreuse:[127,255,0],chocolate:[210,105,30],coral:[255,127,80],cornflowerblue:[100,149,237],cornsilk:[255,248,220],crimson:[220,20,60],cyan:[0,255,255],darkblue:[0,0,139],darkcyan:[0,139,139],darkgoldenrod:[184,134,11],darkgray:[169,169,169],darkgreen:[0,100,0],darkgrey:[169,169,169],darkkhaki:[189,183,107],darkmagenta:[139,0,139],darkolivegreen:[85,107,47],darkorange:[255,140,0],darkorchid:[153,50,204],darkred:[139,0,0],darksalmon:[233,150,122],darkseagreen:[143,188,143],darkslateblue:[72,61,139],darkslategray:[47,79,79],darkslategrey:[47,79,79],darkturquoise:[0,206,209],darkviolet:[148,0,211],deeppink:[255,20,147],deepskyblue:[0,191,255],dimgray:[105,105,105],dimgrey:[105,105,105],dodgerblue:[30,144,255],firebrick:[178,34,34],floralwhite:[255,250,240],forestgreen:[34,139,34],fuchsia:[255,0,255],gainsboro:[220,220,220],ghostwhite:[248,248,255],gold:[255,215,0],goldenrod:[218,165,32],gray:[128,128,128],green:[0,128,0],greenyellow:[173,255,47],grey:[128,128,128],honeydew:[240,255,240],hotpink:[255,105,180],indianred:[205,92,92],indigo:[75,0,130],ivory:[255,255,240],khaki:[240,230,140],lavender:[230,230,250],lavenderblush:[255,240,245],lawngreen:[124,252,0],lemonchiffon:[255,250,205],lightblue:[173,216,230],lightcoral:[240,128,128],lightcyan:[224,255,255],lightgoldenrodyellow:[250,250,210],lightgray:[211,211,211],lightgreen:[144,238,144],lightgrey:[211,211,211],lightpink:[255,182,193],lightsalmon:[255,160,122],lightseagreen:[32,178,170],lightskyblue:[135,206,250],lightslategray:[119,136,153],lightslategrey:[119,136,153],lightsteelblue:[176,196,222],lightyellow:[255,255,224],lime:[0,255,0],limegreen:[50,205,50],linen:[250,240,230],magenta:[255,0,255],maroon:[128,0,0],mediumaquamarine:[102,205,170],mediumblue:[0,0,205],mediumorchid:[186,85,211],mediumpurple:[147,112,219],mediumseagreen:[60,179,113],mediumslateblue:[123,104,238],mediumspringgreen:[0,250,154],mediumturquoise:[72,209,204],mediumvioletred:[199,21,133],midnightblue:[25,25,112],mintcream:[245,255,250],mistyrose:[255,228,225],moccasin:[255,228,181],navajowhite:[255,222,173],navy:[0,0,128],oldlace:[253,245,230],olive:[128,128,0],olivedrab:[107,142,35],orange:[255,165,0],orangered:[255,69,0],orchid:[218,112,214],palegoldenrod:[238,232,170],palegreen:[152,251,152],paleturquoise:[175,238,238],palevioletred:[219,112,147],papayawhip:[255,239,213],peachpuff:[255,218,185],peru:[205,133,63],pink:[255,192,203],plum:[221,160,221],powderblue:[176,224,230],purple:[128,0,128],rebeccapurple:[102,51,153],red:[255,0,0],rosybrown:[188,143,143],royalblue:[65,105,225],saddlebrown:[139,69,19],salmon:[250,128,114],sandybrown:[244,164,96],seagreen:[46,139,87],seashell:[255,245,238],sienna:[160,82,45],silver:[192,192,192],skyblue:[135,206,235],slateblue:[106,90,205],slategray:[112,128,144],slategrey:[112,128,144],snow:[255,250,250],springgreen:[0,255,127],steelblue:[70,130,180],tan:[210,180,140],teal:[0,128,128],thistle:[216,191,216],tomato:[255,99,71],turquoise:[64,224,208],violet:[238,130,238],wheat:[245,222,179],white:[255,255,255],whitesmoke:[245,245,245],yellow:[255,255,0],yellowgreen:[154,205,50]};var u,h;h=function(e){return!(!e||"string"==typeof e)&&(e instanceof Array||Array.isArray(e)||e.length>=0&&(e.splice instanceof Function||Object.getOwnPropertyDescriptor(e,e.length-1)&&"String"!==e.constructor.name))};var p=Array.prototype.concat,d=Array.prototype.slice,g=u=function(e){for(var t=[],r=0,n=e.length;r<n;r++){var a=e[r];h(a)?t=p.call(t,d.call(a)):t.push(a)}return t};g.wrap=function(e){return function(){return e(g(arguments))}};var f=Object.hasOwnProperty,m=Object.create(null);for(var v in c)f.call(c,v)&&(m[c[v]]=v);var w=l={to:{},get:{}};function _(e,t,r){return Math.min(Math.max(t,e),r)}function b(e){var t=Math.round(e).toString(16).toUpperCase();return t.length<2?"0"+t:t}w.get=function(e){var t,r;switch(e.substring(0,3).toLowerCase()){case"hsl":t=w.get.hsl(e),r="hsl";break;case"hwb":t=w.get.hwb(e),r="hwb";break;default:t=w.get.rgb(e),r="rgb"}return t?{model:r,value:t}:null},w.get.rgb=function(e){if(!e)return null;var t,r,n,a=[0,0,0,1];if(t=e.match(/^#([a-f0-9]{6})([a-f0-9]{2})?$/i)){for(n=t[2],t=t[1],r=0;r<3;r++){var s=2*r;a[r]=parseInt(t.slice(s,s+2),16)}n&&(a[3]=parseInt(n,16)/255)}else if(t=e.match(/^#([a-f0-9]{3,4})$/i)){for(n=(t=t[1])[3],r=0;r<3;r++)a[r]=parseInt(t[r]+t[r],16);n&&(a[3]=parseInt(n+n,16)/255)}else if(t=e.match(/^rgba?\(\s*([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)(?=[\s,])\s*(?:,\s*)?([+-]?\d+)\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)){for(r=0;r<3;r++)a[r]=parseInt(t[r+1],0);t[4]&&(t[5]?a[3]=.01*parseFloat(t[4]):a[3]=parseFloat(t[4]))}else{if(!(t=e.match(/^rgba?\(\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*,?\s*([+-]?[\d\.]+)\%\s*(?:[,|\/]\s*([+-]?[\d\.]+)(%?)\s*)?\)$/)))return(t=e.match(/^(\w+)$/))?"transparent"===t[1]?[0,0,0,0]:f.call(c,t[1])?((a=c[t[1]])[3]=1,a):null:null;for(r=0;r<3;r++)a[r]=Math.round(2.55*parseFloat(t[r+1]));t[4]&&(t[5]?a[3]=.01*parseFloat(t[4]):a[3]=parseFloat(t[4]))}for(r=0;r<3;r++)a[r]=_(a[r],0,255);return a[3]=_(a[3],0,1),a},w.get.hsl=function(e){if(!e)return null;var t=e.match(/^hsla?\(\s*([+-]?(?:\d{0,3}\.)?\d+)(?:deg)?\s*,?\s*([+-]?[\d\.]+)%\s*,?\s*([+-]?[\d\.]+)%\s*(?:[,|\/]\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(t){var r=parseFloat(t[4]);return[(parseFloat(t[1])%360+360)%360,_(parseFloat(t[2]),0,100),_(parseFloat(t[3]),0,100),_(isNaN(r)?1:r,0,1)]}return null},w.get.hwb=function(e){if(!e)return null;var t=e.match(/^hwb\(\s*([+-]?\d{0,3}(?:\.\d+)?)(?:deg)?\s*,\s*([+-]?[\d\.]+)%\s*,\s*([+-]?[\d\.]+)%\s*(?:,\s*([+-]?(?=\.\d|\d)(?:0|[1-9]\d*)?(?:\.\d*)?(?:[eE][+-]?\d+)?)\s*)?\)$/);if(t){var r=parseFloat(t[4]);return[(parseFloat(t[1])%360+360)%360,_(parseFloat(t[2]),0,100),_(parseFloat(t[3]),0,100),_(isNaN(r)?1:r,0,1)]}return null},w.to.hex=function(){var e=u(arguments);return"#"+b(e[0])+b(e[1])+b(e[2])+(e[3]<1?b(Math.round(255*e[3])):"")},w.to.rgb=function(){var e=u(arguments);return e.length<4||1===e[3]?"rgb("+Math.round(e[0])+", "+Math.round(e[1])+", "+Math.round(e[2])+")":"rgba("+Math.round(e[0])+", "+Math.round(e[1])+", "+Math.round(e[2])+", "+e[3]+")"},w.to.rgb.percent=function(){var e=u(arguments),t=Math.round(e[0]/255*100),r=Math.round(e[1]/255*100),n=Math.round(e[2]/255*100);return e.length<4||1===e[3]?"rgb("+t+"%, "+r+"%, "+n+"%)":"rgba("+t+"%, "+r+"%, "+n+"%, "+e[3]+")"},w.to.hsl=function(){var e=u(arguments);return e.length<4||1===e[3]?"hsl("+e[0]+", "+e[1]+"%, "+e[2]+"%)":"hsla("+e[0]+", "+e[1]+"%, "+e[2]+"%, "+e[3]+")"},w.to.hwb=function(){var e=u(arguments),t="";return e.length>=4&&1!==e[3]&&(t=", "+e[3]),"hwb("+e[0]+", "+e[1]+"%, "+e[2]+"%"+t+")"},w.to.keyword=function(e){return m[e.slice(0,3)]};const y={generic:["fill","stroke","stroke-width","stroke-linecap"],path:["d"],circle:["cx","cy","r"],rect:["x","y","width","height","rx"],ellipse:["cx","cy","rx","ry"],line:["x1","y1","x2","y2"]};function E(e,t={}){const{discardColors:r=!1}=t,n=o(e).children[0];if("string"==typeof n||"text"===n.type)throw new Error("Detected a text string within the SVG, which is not supported.");let a="",s=0,i=0;if("string"==typeof n.properties?.viewBox?(s=parseInt(n.properties.viewBox.split(" ")[2])||0,i=parseInt(n.properties.viewBox.split(" ")[3])||0):(s=parseInt(`${n.properties?.width}`)||0,i=parseInt(`${n.properties?.height}`)||0),0===s||0===i)throw new Error("<svg> width and/or height could not be parsed");if(s!==i)throw new Error("<svg> width and height must be equal in order to produce accurate conversion");return a+="CANVAS_DIMENSIONS, "+s+",\n",a+=x(n,r),a=`${a.slice(0,-2)}\n`,a}function A(e){switch(e){case"M":return"MOVE_TO";case"m":return"R_MOVE_TO";case"L":return"LINE_TO";case"l":return"R_LINE_TO";case"H":return"H_LINE_TO";case"h":return"R_H_LINE_TO";case"V":return"V_LINE_TO";case"v":return"R_V_LINE_TO";case"A":return"ARC_TO";case"a":return"R_ARC_TO";case"C":return"CUBIC_TO";case"S":return"CUBIC_TO_SHORTHAND";case"c":case"s":return"R_CUBIC_TO";case"Q":return"QUADRATIC_TO";case"T":return"QUADRATIC_TO_SHORTHAND";case"q":case"t":return"R_QUADRATIC_TO";case"Z":case"z":return"CLOSE"}return"~UNKNOWN~"}function O(e){switch(e){case"C":case"c":case"s":return 6;case"S":case"Q":case"q":case"t":return 4;case"T":case"L":case"l":case"H":case"h":case"V":case"v":case"m":case"M":return 2;case"A":case"a":return 7}return 999}function C(e){return void 0===e?0:parseFloat(`${e}`)||0}function k(e){return function(e){return"number"==typeof e&&10*e%10!=0}(e)?`${e}f`:`${e}`}function N(e){return Math.floor(100*e+.5)/100}function T(t,r,n=!1){if("none"===t||"currentColor"===t)return t;if("string"==typeof t){const r=e(l).get.rgb(t);if(!r)throw new Error(`Invalid color value: ${t}`);if(!n)return r}else if(void 0!==t)throw new Error(`Invalid color value: ${t}`);return r||void 0}function I(t){if(t&&"none"!==t&&"currentColor"!==t){let r=e(l).to.hex(t);7===r.length&&(r+="FF");const[n,a,s,i,o,c,u,h,p]=r;return`PATH_COLOR_ARGB, 0x${h+p}, 0x${a+s}, 0x${i+o}, 0x${c+u},\n`}return""}function x(e,t=!1,r,n){let a="";return e.children.forEach((e=>{if("string"==typeof e||"text"===e.type)throw new Error("Detected a text string within the SVG, which is not supported.");!function(e){const{properties:t}=e;if(t)for(let r in t){if(e.tagName&&y.hasOwnProperty(e.tagName)){if(![...y.generic,...y[e.tagName]].includes(r))throw new Error(`Unsupported property in <${e.tagName}> element: ${r}`)}else if(!y.generic.includes(r))throw new Error(`Unsupported property in <${e.tagName}> element: ${r}`);const n=t[r];if(n&&"string"==typeof n&&"%"===n.slice(-1))throw new Error(`Percentage values are not supported in <${e.tagName}> ${r} property`)}}(e);let s="";const i=T(e.properties?.fill,r,t),o=function(e,t,r=!1){const{properties:n}=e;if(!n)return t;const a=T(n.stroke,t?.color,r);let s=t?.width;const i=n["stroke-width"];if("string"==typeof i){if(i){if(i.includes("%"))throw new Error("Percentage values are not supported for stroke-width");s=parseFloat(i)}}else"number"==typeof i&&(s=i);if(s!=s||"number"==typeof s&&s<0)throw new Error(`Invalid stroke-width value: ${s}`);let o=t?.linecap;const l=n["stroke-linecap"];if("round"===l||"square"===l)o=l;else if(l)throw new Error(`Invalid stroke-linecap value: ${l}`);return{color:a,width:s,linecap:o}}(e,n,t);switch(e.tagName){case"g":a+=x(e,t,i,o);break;case"path":{const t=[];let r=!0,n="string"==typeof e.properties?.d?e.properties?.d:"";for(n=n.replaceAll(","," ").trim(),"z"!==n.slice(-1).toLowerCase()&&(r=!1,n+="z");n;){let e=parseFloat(n);if(e!=e){const e=n[0];n=n.substr(1),t.push({command:e,args:[]})}else{let r=t[t.length-1],a=r.command;r.args.length==O(a)&&("m"==a?a="l":"M"==a&&(a="L"),t.push({command:a,args:[]}),r=t[t.length-1],a=r.command);let s=!0;if("a"==a.toLowerCase()&&r.args.length>=3&&r.args.length<=4){if(e=parseInt(n[0]),0!=e&&1!=e)throw new Error(`Unexpected arc argument: ${e}`);n=n.substr(1),s=!1}if(("s"==a.toLowerCase()||"t"==a.toLowerCase())&&0==r.args.length&&("s"==a||"t"==a)){const e=t[t.length-2];if("s"==a&&A(e.command).indexOf("CUBIC_TO")>=0||"t"==a&&A(e.command).indexOf("QUADRATIC_TO")>=0){const t=e.args.length;r.args.push(N(e.args[t-2]-e.args[t-4])),r.args.push(N(e.args[t-1]-e.args[t-3]))}else r.args.push(0),r.args.push(0)}if(e=N(e),r.args.push(e),s){let e=0;for(let t=0;t<n.length;++t)if((0!=t||"-"!=n[t])&&isNaN(parseInt(n[t]))&&("."!=n[t]||1!=++e)){n=n.substr(t);break}}}n=n.trim()}r||t.pop(),t.forEach((e=>{s+=`${A(e.command)}`,e.args.forEach((e=>s+=`, ${k(e)}`)),s+=",\n"}));break}case"circle":{let{cx:t,cy:r,r:n}=e.properties||{};s+="CIRCLE",s+=`, ${k(C(t))}`,s+=`, ${k(C(r))}`,s+=`, ${k(C(n))}`,s+=",\n";break}case"rect":{let{x:t,y:r,width:n,height:a,rx:i}=e.properties||{};s+="ROUND_RECT",s+=`, ${k(C(t))}`,s+=`, ${k(C(r))}`,s+=`, ${k(C(n))}`,s+=`, ${k(C(a))}`,s+=`, ${k(C(i))}`,s+=",\n";break}case"ellipse":{let{cx:t,cy:r,rx:n,ry:a}=e.properties||{};s+="OVAL",s+=`, ${k(C(t))}`,s+=`, ${k(C(r))}`,s+=`, ${k(C(n))}`,s+=`, ${k(C(a))}`,s+=",\n";break}case"line":{let{x1:t,y1:r,x2:n,y2:a}=e.properties||{};s+="MOVE_TO",s+=`, ${k(C(t))}`,s+=`, ${k(C(r))}`,s+=",\n",s+="LINE_TO",s+=`, ${k(C(n))}`,s+=`, ${k(C(a))}`,s+=",\n";break}default:throw new Error(`Unsupported svg element: <${e.tagName}>`)}s&&("none"!==i&&"line"!==e.tagName&&(a+="NEW_PATH,\n",a+=I(i),a+=s),o&&o.color&&"none"!==o.color&&0!==o.width&&(a+="NEW_PATH,\n",a+=function(e,t){let r="";r+=I(t.color);const{width:n=1}=t;if(r+=`STROKE, ${k(n)},\n`,"path"===e.tagName||"line"===e.tagName){if(!t.linecap)throw new Error('You must specify stroke-linecap to be either "round" or "square" for paths and lines if you use stroke');"square"===t.linecap&&(r+="CAP_SQUARE,\n")}return r}(e,o),a+=s))})),a}window.onload=()=>{const e=document.getElementById("input"),t=document.getElementById("output"),r=document.getElementById("preview"),a=document.getElementById("mode-select");a.addEventListener("change",(()=>{e.value="",t.value="",r.innerHTML=""})),e.addEventListener("input",(()=>{const s="icon2svg"===a.value,i=s?t.value:e.value,o=s?n(e.value):E(e.value);t.value=o;const l=document.createElement("img");l.setAttribute("src",`data:image/svg+xml;utf8,${i}`),r.innerHTML="",r.appendChild(l)}))};
//# sourceMappingURL=index.c03c4c33.js.map