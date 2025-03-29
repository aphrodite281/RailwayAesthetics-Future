include(Resources.id("aphrodite:library/code/file/decompress.js"));

var newGifEncoder = (function () {
    const NAME = "newGifEncoder";

    if (GlobalRegister.containsKey(NAME)) return GlobalRegister.get(NAME);

    const JAR = decompress("aphrodite:library/jar/animated_gif_encoder_1.03.jar", "aph/_library/AnimatedGifEncoder-1.03.jar");

    let arr = java.lang.reflect.Array.newInstance(java.net.URL, 1);
    arr[0] = JAR.toURI().toURL();
    const CLASS_LOADER = new java.net.URLClassLoader(arr, java.lang.ClassLoader.getSystemClassLoader());
    const CLAZZ = CLASS_LOADER.loadClass("com.fmsoftware.animatedgifencoder.GifDecoder");

    function newGifEncoder() {
        return CLAZZ.getDeclaredConstructor().newInstance();
    }

    GlobalRegister.put(NAME, newGifEncoder);

    return newGifEncoder;
})();