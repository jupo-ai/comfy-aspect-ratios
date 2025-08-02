import { api } from "../../scripts/api.js";
import { $el } from "../../scripts/ui.js";

const author = "jupo";
const packageName = "AspectRatios";

export function _name(name) {
    return `${author}.${packageName}.${name}`;
}

export function _endpoint(part) {
    return `/${author}/${packageName}/${part}`;
}

export function loadCSS(file) {
    function __joinPath(...part) {
        return part.map(part => part.replace("/\/+$/", "")).join("/");
    }

    const thisFile = import.meta.url;
    const webDirectory = thisFile.slice(0, thisFile.lastIndexOf("/"));
    const url = __joinPath(webDirectory, file)

    $el("link", {
        parent: document.head, 
        rel: "stylesheet", 
        type: "text/css", 
        href: url.startsWith("http") ? url: getUrl(url), 
    });
}