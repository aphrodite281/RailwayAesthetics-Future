function tostring (obj) {
    if (obj === null) return "null";
    if (obj === undefined) return "undefined";
    let type = typeof obj;
    if (type === "string") return obj;
    if (type === "number" || type === "boolean" || type === "bigint") return obj.toString();
    if (type === "function") return "function";
    if (obj instanceof Date) return obj.toISOString();
    if (obj instanceof Error) return obj.error + "\n" + obj.stack;
    if (obj instanceof RegExp) return obj.toString();
    if (obj instanceof Array) {
        let str = "Array[";
        for (let i = 0; i < obj.length; i++) {
            str += tostring(obj[i]) + ",";
        }
        str = str.slice(0, -1) + "]";
        return str;
    }

    if (obj instanceof Map) {
        let str = "Map{";
        for (let [key, value] of obj) {
            str += tostring(key) + ":" + tostring(value) + ",";
        }
        str = str.slice(0, -1) + "}";
        return str;
    }
    if (obj instanceof Set) {
        let str = "Set[";
        for (let item of obj) {
            str += tostring(item) + ",";
        }
        str = str.slice(0, -1) + "]";
        return str;
    }


    let str0 = obj.toString();
    if (str0 == "[object Object]") {
        let str = "Object{";
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) {
                str += key + ":" + tostring(obj[key]) + ",";
            }
        }
        str = str.slice(0, -1) + "}";
        return str;
    }

    return str0;
}

function fun() {
    return "fun";
}