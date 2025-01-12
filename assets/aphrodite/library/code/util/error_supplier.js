const ErrorSupplier = {
    Int: str => {
        let num = parseInt(str);
        if (isNaN(num)) return java.util.Optional.of(ComponentUtil.translatable("error.raf.invalid_value"));
        else return java.util.Optional.empty();
    }, 
    Float: str => {
        let num = parseFloat(str);
        if (isNaN(num)) return java.util.Optional.of(ComponentUtil.translatable("error.raf.invalid_value"));
        else return java.util.Optional.empty();
    },
    endWith: args => {
        return str => {
            for (let arg of args) {
                if (str.endsWith(arg)) return java.util.Optional.empty();
            }
            return java.util.Optional.of(ComponentUtil.translatable("error.raf.invalid_value"));
        }
    },
    Font: str => {
        try {
            let font = Resources.readFont(Resources.id(str));
            return java.util.Optional.empty();
        } catch (e) {
            return java.util.Optional.of(ComponentUtil.translatable("error.raf.invalid_font"));
        }
    }
}