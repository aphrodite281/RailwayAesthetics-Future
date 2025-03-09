importPackage(java.io);
importPackage(java.awt);
importPackage(javax.imageio);
importPackage(java.util.concurrent);

var ImagesOutputManager = {
    Sync: function(path) {
        this.preserve = function (img, time) {
            let file = new File(path + "/" + time + ".png");
            file.mkdirs();
            try {
                ImageIO.write(img, "PNG", file);
            } catch (e) {
                print("Error while writing image to file: " + e);
            }
        }
        
        this.close = function () {

        }

        this.toString = function () {
            return "ImagesOutputManager Sync ->" + path;
        }
    },
    ASync: function(path, count) {
        count = count || 5;
        let executor = Executors.newFixedThreadPool(count);

        this.preserve = function (img, time) {
            executor.submit(new Runnable({run: () => {
                let file = new File(path + "//" + time + ".png");
                file.mkdirs();
                try {
                    ImageIO.write(img, "PNG", file);
                } catch (e) {
                    print("Error while writing image to file: " + e);
                }
            }}));
        }

        this.close = function () {
            executor.shutdown();
        }

        this.toString = function () {
            return "ImagesOutputManager ASync ->" + path + "(" + count + " / " + executor.getActiveCount() + ')';
        }
    },
    saveVideoConverterTo: function (path) {
        let file = new File(path + "/video_converter.py");
        if (file.exists()) return;
        file.getParentFile().mkdirs();
        let os = new FileOutputStream(file);
        let is = Resources.readStream(Resources.id("aphrodite:library/code/graphic/video_converter.py"));
        try {
            let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
            let len = 0;
            while ((len = is.read(buffer)) > 0) {
                os.write(buffer, 0, len);
            }
            os.close();
        } catch (e) {
            os.close();
            throw e;
        }
    }
}