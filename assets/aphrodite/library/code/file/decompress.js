function decompress(from, to, reload) {
    if (reload == undefined) reload = false;
    let is, os;

    try {
        let file = new java.io.File(to);
        if (file.exists() && !reload) return file;

        file.getParentFile().mkdirs();
        file.createNewFile();
        is = Resources.readStream(Resources.id(from));
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