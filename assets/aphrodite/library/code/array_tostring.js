Object.defineProperty(Array.prototype, 'toString', {
    value: function() {
        let str = '[';
        for (let i = 0; i < this.length; i++) {
            try {str += this[i].toString();} catch (e) {str += this[i];}
            if (i < this.length - 1) {
                str += ',';
            }
        }
        str += ']';
        return str;
    }
});