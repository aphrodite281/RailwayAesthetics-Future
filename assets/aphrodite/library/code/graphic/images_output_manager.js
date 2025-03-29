importPackage(java.io);
importPackage(java.awt);
importPackage(javax.imageio);
importPackage(java.util.concurrent);

include(Resources.id("aphrodite:library/code/file/decompress.js"));

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
        decompress("aphrodite:library/code/graphic/video_converter.py", path + "/video_converter.py");
    }
}