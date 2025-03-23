var WebImageManager = (function () {
    const NAME = "WebImageManager";
    const ENTRANCE = {
        getInstance: function() {
            return GlobalRegister.get(NAME); 
        },
        toString: function() {
            return NAME;
        }
    };

    if (GlobalRegister.containsKey(NAME)) return ENTRANCE;

    function WebImageManager() {
        const CACHE = new Map();
        const IN_PROGRESS = new Set();
        const EXECUTOR = java.util.concurrent.Executors.newCachedThreadPool();

        const PATH_CACHE = "_aph-cache/";
        const FILE_CACHE = new java.io.File(PATH_CACHE);

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
            
            let io = null;
            try {
                io = Packages.javax.imageio.ImageIO.createImageInputStream(file);
                // let reader = Packages.javax.imageio.ImageIO.getImageReadersByFormatName("gif").next();
                let reader = Packages.javax.imageio.ImageIO.getImageReaders(io).next();
                reader.setInput(io);
                let n = reader.getNumImages(true);

                let imgs = [];
                let delays = [];
                for (let i = 0; i < n; i++) {
                    let image = reader.read(i);

                    let metadata = reader.getImageMetadata(i);
                    let tree = metadata.getAsTree("javax_imageio_gif_image_1.0");
                    children = tree.getChildNodes();
                    let delay = 100;
                    for (let j = 0; j < children.getLength(); j++) {
                        let node = children.item(j);
                        if (node.getNodeName().equals("GraphicControlExtension")) {
                            delay = parseInt(node.getAttributes().getNamedItem("delayTime").getNodeValue()) * 10;
                        }
                    }
                    imgs.push(image);
                    delays.push(delay);
                    // long += delay;
                    // this.frames.push(new Frame(image, delay, long));
                }

                let base = new java.awt.image.BufferedImage(reader.getWidth(0), reader.getHeight(0), java.awt.image.BufferedImage.TYPE_INT_ARGB);
                let g = base.createGraphics();
                g.setComposite(java.awt.AlphaComposite.SrcOver);
                for (let img of imgs) {
                    g.drawImage(img, 0, 0, null);
                }

                let long = 0;
                for (let i = 0; i < n; i++) {
                    let img = imgs[i];
                    g.drawImage(img, 0, 0, null);
                    let delay = delays[i];
                    long += delay;
                    this.frames.push(new Frame(base, delay, long));
                }

                this.duration = long;
                success = true;
                if (io != null) io.close();
                io = null;
            } catch (e) {
                if (io != null) io.close();
                io = null;
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

        function _loadImage(uri, reDownload) {
            try {
                const url = new java.net.URL(uri);
                const conn = url.openConnection(); 
                const responseCode = conn.getResponseCode();
                if (responseCode == java.net.HttpURLConnection.HTTP_OK) {
                    let fileName = PATH_CACHE + uri.substring(uri.lastIndexOf('/') + 1);
                    let disposition = conn.getHeaderField("Content-Disposition");
                    let contentType = conn.getContentType();

                    print("Loading image: " + fileName + " from " + uri + " to" + fileName + "\n" + "Content-Type:" + contentType + ", " + "Content-Disposition:" + disposition);

                    const file = new java.io.File(fileName);
                    function download() {
                        FILE_CACHE.mkdirs();
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
                            return _loadImage(uri, true);
                        }
                    }
                } else throw new Error("Failed to load image: " + uri + " with response code: " + responseCode);
            } catch (e) {
                print("Failed to load image: " + uri + " with error: " + e.message + "\n" + e.stackTrace);
                MinecraftClient.displayMessage("§cFailed to load image: " + uri + " with error: " + e.message, false);
                if (e.javaException != null) e.javaException.printStackTrace();
            }
        }

        this.loadImage = function(url, callback, reDownload) {
            url = url + "";
            if (callback == undefined) callback = function() {};
            if (reDownload == undefined) reDownload = false;
            if (CACHE.has(url) && !reDownload) {
                callback(CACHE.get(url));
                MinecraftClient.displayMessage("§eLoaded image:" + url + " from cache", true);
                return;
            } else {
                if (IN_PROGRESS.has(url)) return;
                IN_PROGRESS.add(url);
                EXECUTOR.submit(new java.lang.Runnable({run: function() {
                    try {
                        let startTime = Date.now();
                        let img = _loadImage(url, reDownload);
                        IN_PROGRESS.delete(url);
                        if (img instanceof Gif || img instanceof Bitmap) {
                            if (CACHE.has(url)) {
                                let ele = CACHE.get(url);
                                if (ele instanceof Gif || ele instanceof Bitmap) ele.dispose();
                            }
                            CACHE.set(url, img);
                        }
                        callback(img);
                        print("Done loading image:" + url + " in " + (Date.now() - startTime) + "ms");
                        MinecraftClient.displayMessage("§eDone loading image:" + url + " in " + (Date.now() - startTime) + "ms", true);
                    } catch (e) {
                        print("Failed to load image: " + url + " with error: " + e.message + "\n" + e.stackTrace);
                        IN_PROGRESS.delete(url);
                        callback(null);
                        MinecraftClient.displayMessage("§cFailed to load image: " + url + " with error: " + e.message, false);
                    }
                }}));
            }
        }

        this.toString = function() {
            return NAME;
        }

        this._cleanCache = function() {
            let copy = new Map(CACHE);
            CACHE.clear();
            for (let [url, img] of copy) {
                if (img instanceof Gif || img instanceof Bitmap) img.dispose();
            }
        }

        this._deepClean = function() {
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
    }

    GlobalRegister.put(NAME, new WebImageManager());
    
    return ENTRANCE;
})();