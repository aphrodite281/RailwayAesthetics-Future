var ErrorSupplier = {
    Int: function(str) {
        str = str + "";
        let num = parseInt(str);
        if (isNaN(num)) return Optional.of([ComponentUtil.translatable("error.aph.invalid_value")]);
        else return Optional.empty();
    }, 
    Float:function(str) {
        str = str + "";
        let num = parseFloat(str);
        if (isNaN(num)) return Optional.of([ComponentUtil.translatable("error.aph.invalid_value")]);
        else return Optional.empty();
    },
    Color:function(str) {
        str = str + "";
        let num = parseInt(str);
        if (isNaN(num) || num < 0 || num > 0xffffff) return Optional.of([ComponentUtil.translatable("error.aph.invalid_color")]);
        else return Optional.empty();
    },
    endWith: function(args) {
        return str => {
            str = str + "";
            for (let arg of args) {
                if (str.endsWith(arg)) return Optional.empty();
            }
            return Optional.of([ComponentUtil.translatable("error.aph.invalid_value")]);
        }
    },
    only: function(args) {
        return str => {
            str = str + "";
            for (let arg of args) {
                if (str == arg) return Optional.empty();
            }
            return Optional.of([ComponentUtil.translatable("error.aph.only_be", args.join(", "))]);
        }
    }, 
    Font: function(str) {
        str = str + "";
        if (str.endsWith(".ttf") || str.endsWith(".otf")) {
            try {
                let font = Resources.readFont(Resources.id(str)]);
                return Optional.empty();
            } catch (e) {
                return Optional.of([ComponentUtil.translatable("error.aph.invalid_font")]);
            }
        } else {
            return Optional.empty();
        }
    }
};