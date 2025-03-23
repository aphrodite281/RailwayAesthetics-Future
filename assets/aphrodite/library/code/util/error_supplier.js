var ErrorSupplier = {
    Int: function(str) {
        str = str + "";
        let num = parseInt(str);
        if (isNaN(num)) return Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        else return Optional.empty();
    }, 
    Float:function(str) {
        str = str + "";
        let num = parseFloat(str);
        if (isNaN(num)) return Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        else return Optional.empty();
    },
    Color:function(str) {
        str = str + "";
        let num = parseInt(str);
        if (isNaN(num) || num < 0 || num > 0xffffffff) return Optional.of(ComponentUtil.translatable("error.aph.invalid_color"));
        else return Optional.empty();
    },
    endWith: function(args) {
        return str => {
            str = str + "";
            for (let arg of args) {
                if (str.endsWith(arg)) return Optional.empty();
            }
            return Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        }
    },
    only: function(args) {
        return str => {
            str = str + "";
            for (let arg of args) {
                if (str == arg) return Optional.empty();
            }
            return Optional.of(ComponentUtil.translatable("error.aph.only_be", args.join(", ")));
        }
    }, 
    Font: function(str) {
        str = str + "";
        if (str.endsWith(".ttf") || str.endsWith(".otf")) {
            if (!Resources.hasResource(Resources.id(str))) {
                return Optional.of(ComponentUtil.translatable("error.aph.invalid_font"));
            }
        }
        return Optional.empty();
    },
    Number: function(str) {
        str = str + "";
        let num = Number(str);
        if (isNaN(num)) return Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        return Optional.empty();
    }, 
    numberRange: function(min, max, includeMin, includeMax) {
        return function(str) {
            str = str + "";
            let num = Number(str);
            if ((min != null && (includeMin? num < min : num <= min)) || (max != null && (includeMax? num > max : num >= max))) {
                return Optional.of(ComponentUtil.translatable("error.aph.number_range", min == null? "-Infinity" : min, max == null? "Infinity" : max));
            }
            return Optional.empty();
        }
    }
};

ErrorSupplier.RenderType = ErrorSupplier.only(["exterior", "exteriortranslucent", "interior", "interiortranslucent", "light", "lighttranslucent"]);