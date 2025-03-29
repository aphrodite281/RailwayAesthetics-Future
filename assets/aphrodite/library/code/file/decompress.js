function decompress(from, to) {
    let is, os;

    try {
        is = Resources.readStream(Resources.id(from));
        let file = new java.io.File(to);
        file.getParentFile().mkdirs();
        os = new java.io.FileOutputStream(file);
        let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 4096);
        let bytesRead = -1;
        while ((bytesRead = is.read(buffer)) != -1) {
            os.write(buffer, 0, bytesRead);
        }
        os.close();
        os = null;
        is.close();
        is = null;
        return file;
    } catch (e) {
        if (os != null) {
            os.close();
            os = null;
        }
        if (is != null) {
            is.close();
            is = null;
        }
        throw e;
    }
}