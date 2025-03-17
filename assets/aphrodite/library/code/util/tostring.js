function toString(obj, isFirst) {
    if (isFirst === undefined) isFirst = true;
    if (obj === null) {
        return "null";
    } else if (typeof obj === "undefined") {
        return "undefined";
    } else if (typeof obj === "string") {
        return obj;
    } else if (typeof obj === "number") {
        if (isNaN(obj)) {
            return "NaN";
        } else if (!isFinite(obj)) {
            return (obj > 0? "Infinity" : "-Infinity");
        } else {
            return obj.toString();
        }
    } else if (typeof obj === "boolean") {
        return obj.toString();
    } else if (typeof obj === "function") {
        return obj.toString();
    } else {
        if (obj instanceof Array) {
            let str = "[";
            for (var i = 0; i < obj.length; i++) {
                str += toString(obj[i]);
                if (i < obj.length - 1) {
                    str += ", ";
                }
            }
            str += "]";
            return str;
        } else if (obj instanceof Map) {
            let str = "{";
            for (var [key, value] of obj) {
                str += key + ": " + toString(value);
                if (key !== Object.keys(obj)[Object.keys(obj).length - 1]) {
                    str += ", ";
                }
            }
            str += "}";
            return str;
        } else if (obj instanceof java.lang.String) {
            return obj + "";
        } else {
            if (isFirst) {
                let str = "{";
                for (var key in obj) {
                    if (obj.hasOwnProperty(key)) {
                        str += key + ": " + toString(obj[key], false);
                        if (key !== Object.keys(obj)[Object.keys(obj).length - 1]) {
                            str += ", ";
                        }
                    }
                }
                str += "}";
                return str;
            } else {
                return obj.toString();
            }
        }
    }
}