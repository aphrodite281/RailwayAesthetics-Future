include(Resources.id("aphrodite:library/code/jar/gif_encoder.js"));

var WebImageManager = (function () {
    const NAME = "WebImageManager";

    if (GlobalRegister.containsKey(NAME)) return GlobalRegister.get(NAME);

    function WebImageManager() {
        const CACHE = new Map();
        const IN_PROGRESS = new Set();
        const EXECUTOR = java.util.concurrent.Executors.newCachedThreadPool();

        const PATH_CACHE = "aph/_web_image_cache/";
        const FILE_CACHE = new java.io.File(PATH_CACHE);
        const CACHE_CANONICAL_PATH = FILE_CACHE.getCanonicalPath() + "";

        function Gif(file) {
            function Frame(image, delay, endTime) {
                this.texture = new GraphicsTexture(image.getWidth(), image.getHeight());
                this.texture.graphics.drawImage(image, 0, 0, null);
                this.texture.upload();
                this.width = image.getWidth();
                this.height = image.getHeight();
                this.delay = delay;
                this.startTime = endTime - delay;
                this.endTime = endTime;

                this.dispose = function() {
                    this.texture.close();
                }
            }

            this.frames = [];
            
            try {
                let io = new java.io.BufferedInputStream(new java.io.FileInputStream(file));
                let encoder = newGifEncoder();
                encoder.read(io);

                let len = encoder.getFrameCount();
                let time = 0;
                for (let i = 0; i < len; i++) {
                    let frame = encoder.getFrame(i);
                    let delay = encoder.getDelay(i);
                    time += delay;
                    this.frames.push(new Frame(frame, delay, time));
                }

                this.duration = time;
                success = true;
            } catch (e) {
                throw e;
            }

            const duration = () => this.duration;
            const frames = () => this.frames;

            function Reader(loop, speed) {
                let startTime = 0;
                if (loop == undefined) loop = true;
                if (speed == undefined) speed = 1;

                this.start = function(time) {
                    if (time == undefined) time = Date.now();
                    this.startTime = time;
                }

                this.loop = function(cir) {
                    if (cir != undefined) loop = cir;
                    return loop;
                }

                this.speed = function(spe) {
                    if (spe != undefined) speed = spe;
                    return speed;
                }

                this._getFrame = function(time) {
                    if (time < 0) {
                        if (loop) return this._getFrame(duration() - (-1 * time) % duration());
                        else return frames()[0];
                    }
                    if (time > duration()) {
                        if (loop) return this._getFrame(time % duration());
                        else return frames()[frames().length - 1];
                    }
                    for (let frame of frames()) {
                        if (time < frame.endTime) return frame;
                    }
                    throw new Error("Invalid time: " + time);
                }

                this.getFrame = function(time) {
                    if (time == undefined) time = Date.now();
                    time = time - startTime;
                    time *= speed;
                    return this._getFrame(time);
                }
            }

            this.createReader = function(loop, speed) {
                return new Reader(loop, speed);
            }

            this.TYPE = "gif";

            this.toString = function() {
                return "_Gif(" + file + ")";
            }

            this.dispose = function() {
                for (let frame of this.frames) {
                    frame.dispose();
                }
            }
        }

        function Bitmap(file) {
            let img = Packages.javax.imageio.ImageIO.read(file);
            this.texture = new GraphicsTexture(img.getWidth(), img.getHeight());
            this.texture.graphics.drawImage(img, 0, 0, null);
            this.texture.upload();
            this.width = img.getWidth();
            this.height = img.getHeight();

            this.toString = function() {
                return "_Bitmap(" + file + ")";
            }

            this.TYPE = "bitmap";

            this.dispose = function() {
                this.texture.close();
            }
        }

        function _loadImage1(file) {
            try {
                if ((file.getName() + "").endsWith(".gif")) {
                    return new Gif(file);
                } else {
                    return new Bitmap(file);
                }
            } catch (e) {
                print("Error loading image: " + file);
            }
        }

        function _loadImage0(uri, reDownload) {
            try {
                const url = new java.net.URL(uri);
                const conn = url.openConnection(); 
                const responseCode = conn.getResponseCode();
                if (responseCode == java.net.HttpURLConnection.HTTP_OK) {
                    let fileName = PATH_CACHE + uri.replace("://", "/").replace("\\", "/");
                    let disposition = conn.getHeaderField("Content-Disposition");
                    let contentType = conn.getContentType();

                    print("Loading image: " + fileName + " from " + uri + " to" + fileName + "\n" + "Content-Type:" + contentType + ", " + "Content-Disposition:" + disposition);

                    const file = new java.io.File(fileName);
                    function download() {
                        file.getParentFile().mkdirs();
                        file.createNewFile();
                        let ip = null;
                        let op = null;

                        try {
                            ip = conn.getInputStream();
                            op = new java.io.FileOutputStream(file);
                            let bytesRead = -1;
                            const buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 4096);
                            while ((bytesRead = ip.read(buffer)) != -1) {
                                op.write(buffer, 0, bytesRead);
                            }
                        } catch (e) {
                            if (op != null) op.close();
                            if (ip != null) ip.close();
                            throw e;
                        }
                        if (op != null) op.close();
                        if (ip != null) ip.close();
                    }

                    function parse() {
                        if (fileName.endsWith(".gif")) {
                            return new Gif(file);
                        } else {
                            return new Bitmap(file);
                        }
                    }

                    if (!file.exists() || reDownload) {
                        MinecraftClient.displayMessage("§eDownloading image" + uri + " to" + fileName, true);
                        download();
                        return parse();
                    } else {
                        try {
                            let res =  parse();
                            print("Loaded image: " + url + " from disk cache");
                            MinecraftClient.displayMessage("§eLoaded image: " + uri + " from disk cache", true);
                            return res;
                        } catch (e) {
                            print("Re-download image: " + " from " + uri + " to" + fileName + "\n" + "Cause of error: " + e.message + "\n" + e.stackTrace);
                            return _loadImage0(uri, true);
                        }
                    }
                } else throw new Error("Failed to load image: " + uri + " with response code: " + responseCode);
            } catch (e) {
                print("Failed to load image: " + uri + " with error: " + e.message + "\n" + e.stackTrace);
                MinecraftClient.displayMessage("§cFailed to load image: " + uri + " with error: " + e.message, false);
                if (e.javaException != null) e.javaException.printStackTrace();
            }
        }

        function _loadImage(fileOrUrl, fromDisk, reDownload) {
            if (fromDisk) return _loadImage1(fileOrUrl);
            else return _loadImage0(fileOrUrl, reDownload);
        }

        function loadImage(url, callback, reDownload) {
            url = url + "";
            let uri = url.replace("://", "/").replace("\\", "/");
            if (callback == undefined) callback = function() {};
            if (reDownload == undefined) reDownload = false;
            if (CACHE.has(uri) && !reDownload) {
                callback(CACHE.get(uri));
                MinecraftClient.displayMessage("§eLoaded image:" + url + " from cache", true);
                return;
            } else {
                if (IN_PROGRESS.has(uri)) return;
                IN_PROGRESS.add(uri);
                EXECUTOR.submit(new java.lang.Runnable({run: function() {
                    try {
                        let startTime = Date.now();
                        let img = _loadImage(url, false, reDownload);
                        IN_PROGRESS.delete(uri);
                        if (img instanceof Gif || img instanceof Bitmap) {
                            if (CACHE.has(uri)) {
                                let ele = CACHE.get(uri);
                                if (ele instanceof Gif || ele instanceof Bitmap) ele.dispose();
                            }
                            CACHE.set(uri, img);
                        }
                        callback(img);
                        print("Done loading image:" + url + " in " + (Date.now() - startTime) + "ms");
                        MinecraftClient.displayMessage("§eDone loading image:" + url + " in " + (Date.now() - startTime) + "ms", true);
                    } catch (e) {
                        print("Failed to load image: " + url + " with error: " + e.message + "\n" + e.stackTrace);
                        IN_PROGRESS.delete(uri);
                        callback(null);
                        MinecraftClient.displayMessage("§cFailed to load image: " + url + " with error: " + e.message, false);
                    }
                }}));
            }
        }

        this.loadImage = loadImage;

        function load(file) {
            if (file.isDirectory()) {
                for (let f of file.listFiles()) {
                    load(f);
                }
            } else {
                let p = file.getCanonicalPath() + "";
                let index = p.indexOf(CACHE_CANONICAL_PATH);
                let uri = p.substring(index + CACHE_CANONICAL_PATH.length + 1).replace(/\\/g, "/");
                let res = _loadImage(file, true);
                if (res != null) CACHE.set(uri, res);
            }
        }

        this.rebuildCache = function() {
            CACHE.clear();

            if (!FILE_CACHE.exists()) return;

            load(FILE_CACHE);
        }

        this.deepClean = function() {
            let copy = new Map(CACHE);
            CACHE.clear();
            for (let [url, img] of copy) {
                if (img instanceof Gif || img instanceof Bitmap) img.dispose();
            }
            java.io.File(PATH_CACHE).delete();
        }

        this.getCacheSize = function() {
            return CACHE.size;
        }

        this.getCache = function() {
            return CACHE;
        }

        this.toString = function() {
            return NAME;
        }
    }

    const INSTANCE = new WebImageManager();

    INSTANCE.rebuildCache();

    GlobalRegister.put(NAME, INSTANCE);
    
    return INSTANCE;
})();