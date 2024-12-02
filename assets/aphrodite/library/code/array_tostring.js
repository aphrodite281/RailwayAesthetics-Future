Object.defineProperty(Array.prototype, 'toString', {
    value: function() {
        let str = '[';
        for (let i = 0; i < this.length; i++) {
            str += this[i].toString();
            if (i < this.length - 1) {
                str += ',';
            }
        }
        str += ']';
        return str;
    }
});