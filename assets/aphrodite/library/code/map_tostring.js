Object.defineProperty(Map.prototype, 'toString', {
    value: function() {
        let str = '[';
        let entries = this.entries();
        let entry = entries.next();
        while (!entry.done) {
            let [key, value] = entry.value;
            str += `[${key.toString()},${value.toString()}]`;
            entry = entries.next();
            if (!entry.done) {
                str += ',';
            }
        }
        str += ']';
        return str;
    }
});