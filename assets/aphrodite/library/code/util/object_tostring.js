Object.defineProperty(Object.prototype, 'toString', {
    value: function() {
        let str = '{';
        let keys = Object.keys(this).sort(); // 对键进行排序
        for (let i = 0; i < keys.length; i++) {
            let key = keys[i];
            try {
                str += key + ':' + this[key].toString();
            } catch (e) {
                str += key + ':' + this[key];
            }
            if (i < keys.length - 1) {
                str += ',';
            }
        }
        str += '}';
        return str;
    }
});