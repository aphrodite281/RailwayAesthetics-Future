Object.defineProperty(Map.prototype, 'toString', {
    value: function() {
        let str = '{';
        let entries = this.entries();
        let entry = entries.next();
        while (!entry.done) {
            let [key, value] = entry.value;
            try {str += `[${key.toString()},${value.toString()}]`;} catch (e) {str += `[${key},${value}]`}
            entry = entries.next();
            if (!entry.done) {
                str += ',';
            }
        }
        str += '}';
        return str;
    }
});