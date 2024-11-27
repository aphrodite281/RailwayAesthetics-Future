importPackage (java.io);
importPackage (java.lang);

const Farme = {};
Farme.create = function(name, x, y) {
    if (arguments.length != 3) {
        print("Usage: Farme.create(name, x, y)");
        throw "Error in Farme.create()";
    }
    const path = "araf_temp/araf_jframe.class";
    const id = Resources.id("aphrodite:library/code/araf_jframe.class");
    const init = () => {
        let is = Resources.readStream(id);
        let outputFile = new File(path);
        if (!outputFile.getParentFile().exists()) {
            outputFile.getParentFile().mkdirs();
        }
        outputFile.createNewFile();
        let outputStream = new FileOutputStream(outputFile);
        try {
            let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
            let len = 0;
            while ((len = is.read(buffer)) > 0) {
                outputStream.write(buffer, 0, len);
            }
            outputStream.close();
        } catch (e) {
            outputStream.close();
            print(e);
            throw e;
        }
    }
    let file = new File(path);
    if (!file.exists()) {
        init();
    }
    //java -cp. aph.araf_jframe
    let pb = new ProcessBuilder("java", "-cp.", "araf_temp.araf_jframe");
    pb.start();

    let processBuilder = new ProcessBuilder("java", "araf_temp.araf_jframe", name, x, y);
    let process = processBuilder.start();
    this.process = process;
}