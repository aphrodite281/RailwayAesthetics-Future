include(Resources.id("aphrodite:library/code/file/decompress.js"));

var Batik = (function() {
    const NAME = "Batik";

    // if (GlobalRegister.containsKey(NAME)) return GlobalRegister.get(NAME);

    const JAR = decompress("aphrodite:library/jar/aph_batik_1.8.jar", "aph/_library/aph_batik_1.8.jar");

    let arr = java.lang.reflect.Array.newInstance(java.net.URL, 1);
    arr[0] = JAR.toURI().toURL();
    const CLASS_LOADER = new java.net.URLClassLoader(arr, java.lang.ClassLoader.getSystemClassLoader());
    
    const SCOPE = {};

    function loadClass(name) {
        let clazz = CLASS_LOADER.loadClass(name);
        let tok = name.lastIndexOf(".");
        name = name.substring(tok + 1);
        SCOPE[name] = clazz;
        SCOPE["new" + name] = function(args) {
            if (args == undefined) args = [];
            if (args.length == 0) return clazz.getDeclaredConstructor().newInstance();
            return clazz.getConstructor(args[0]).newInstance(args[1]);
        }
        return clazz;
    }

    const TranscoderInput = CLASS_LOADER.loadClass("org.apache.batik.transcoder.TranscoderInput");
    const TranscoderOutput = CLASS_LOADER.loadClass("org.apache.batik.transcoder.TranscoderOutput");
    const PNGTranscoder = CLASS_LOADER.loadClass("org.apache.batik.transcoder.image.PNGTranscoder");
    const KEY_WIDTH = PNGTranscoder.getField("KEY_WIDTH").get(null);
    const KEY_HEIGHT = PNGTranscoder.getField("KEY_HEIGHT").get(null);

    function transformSVG2BufferedImage(is, width, height) {
        let transcoder = PNGTranscoder.getDeclaredConstructor().newInstance();
        transcoder.addTranscodingHint(KEY_WIDTH, java.lang.Float.valueOf(width));
        transcoder.addTranscodingHint(KEY_HEIGHT, java.lang.Float.valueOf(height));
        let input = TranscoderInput.getConstructor(java.io.InputStream).newInstance(is);
        let outpuStream = new java.io.ByteArrayOutputStream();
        let output = TranscoderOutput.getConstructor(java.io.OutputStream).newInstance(outpuStream);
        transcoder.transcode(input, output);
        outpuStream.flush();
        
        return Packages.javax.imageio.ImageIO.read(new java.io.ByteArrayInputStream(outpuStream.toByteArray()));
    }

    const BatikTranscoder = {
        transformSVG2BufferedImage: transformSVG2BufferedImage
    }

    GlobalRegister.put(NAME, BatikTranscoder);

    return BatikTranscoder;
})();