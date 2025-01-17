var ErrorSupplier = {
    Int: str => {
        let num = parseInt(str);
        if (isNaN(num)) return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        else return java.util.Optional.empty();
    }, 
    Float: str => {
        let num = parseFloat(str);
        if (isNaN(num)) return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        else return java.util.Optional.empty();
    },
    Color: str => {
        let num = parseInt(str);
        if (isNaN(num) || num < 0 || num > 0xffffff) return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_color"));
        else return java.util.Optional.empty();
    },
    endWith: args => {
        return str => {
            for (let arg of args) {
                if (str.endsWith(arg)) return java.util.Optional.empty();
            }
            return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_value"));
        }
    },
    only: args => {
        return str => {
            for (let arg of args) {
                if (str == arg) return java.util.Optional.empty();
            }
            return java.util.Optional.of(ComponentUtil.translatable("error.aph.only_be", args.join(", ")));
        }
    }, 
    Font: str => {
        if (str.endsWith(".ttf") || str.endsWith(".otf")) {
            try {
                let font = Resources.readFont(Resources.id(str));
                return java.util.Optional.empty();
            } catch (e) {
                return java.util.Optional.of(ComponentUtil.translatable("error.aph.invalid_font"));
            }
        } else {
            return java.util.Optional.empty();
        }
    },
};

ErrorSupplier.Boolean = ErrorSupplier.only(["true", "false"]);