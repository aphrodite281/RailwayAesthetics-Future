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

    // if (GlobalRegister.containsKey(NAME)) return ENTRANCE;

    function WebImageManager() {
        const CACHE = new Map();
        const IN_PROGRESS = new Set();
        const EXECUTOR = java.util.concurrent.Executors.newCachedThreadPool();

        const PATH_CACHE = "_aph-cache/";
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

            function decode(io) {
                // Header
                let name = io.readBytes(3);
                let version = io.readByte(3);

                // Logical Screen Descriptor
                let logicalScreenWidth = io.readUnsignedShort();
                let logicalScreenHeight = io.readUnsignedShort();
                let globalColorTableFlag = io.readBit();
                let colorResolution = io.readBits(3) + 1;
                let sortFlag = io.readBit();
                let sizeOfGlobalColorTable = io.readBits(3);
                let backgroundColorIndex = io.readByte();
                let pixelAspectRatio = io.readByte();
                
                // Global Color Table
                let golbalColorTable = [];
                if (globalColorTableFlag) {
                    let size = Math.pow(2, sizeOfGlobalColorTable + 1);
                    for (let i = 0; i < size; i++) {
                        let r = io.readByte();
                        let g = io.readByte();
                        let b = io.readByte();
                        golbalColorTable.push({r: r, g: g, b: b});
                    }
                }

                // 
            }

            this.frames = [];
            
            let io0 = null;
            let io = null;
            try {
                io0 = Packages.javax.imageio.ImageIO.createImageInputStream(file);
                // let reader = Packages.javax.imageio.ImageIO.getImageReadersByFormatName("gif").next();
                let reader = Packages.javax.imageio.ImageIO.getImageReaders(io0).next();
                reader.setInput(io0);
                let n = reader.getNumImages(true);

                let streamMetadata = reader.getStreamMetadata();
                let tree = streamMetadata.getAsTree("javax_imageio_gif_stream_1.0");
                let children = tree.getChildNodes();
                let w = null, h = null;
                for (let i = 0; i < children.getLength(); i++) {
                    let node = children.item(i);
                    let name = node.getNodeName() + "";
                    if (name.equals("LogicalScreenDescriptor")) {
                        w = parseInt(node.getAttributes().getNamedItem("logicalScreenWidth").getNodeValue());
                        h = parseInt(node.getAttributes().getNamedItem("logicalScreenHeight").getNodeValue());
                    }
                }

                let io = Packages.javax.imageio.ImageIO.createImageOutputStream(file);

                let imgs = [];
                let delays = [];
                let locations = [];
                let methods = [];
                for (let i = 0; i < n; i++) {
                    let image = reader.read(i);

                    let metadata = reader.getImageMetadata(i);
                    let tree = metadata.getAsTree("javax_imageio_gif_image_1.0");
                    let children = tree.getChildNodes();
                    let delay = 100;
                    let location = [0, 0];
                    let method = "doNotDispose";
                    for (let j = 0; j < children.getLength(); j++) {
                        let node = children.item(j);
                        let name = node.getNodeName();
                        if (name.equals("GraphicControlExtension")) {
                            delay = parseInt(node.getAttributes().getNamedItem("delayTime").getNodeValue()) * 10;
                            method = node.getAttributes().getNamedItem("disposalMethod").getNodeValue();
                        } else if (name.equals("ImageDescriptor")) {
                            location = [
                                parseInt(node.getAttributes().getNamedItem("imageLeftPosition").getNodeValue()), 
                                parseInt(node.getAttributes().getNamedItem("imageTopPosition").getNodeValue())
                            ];
                        }
                    }
                    imgs.push(image);
                    delays.push(delay);
                    locations.push(location);
                    methods.push(method);
                }

                let base = new java.awt.image.BufferedImage(w, h, java.awt.image.BufferedImage.TYPE_INT_ARGB);
                let g = base.createGraphics();
                g.setComposite(java.awt.AlphaComposite.SrcOver);
                for (let i = 0; i < n; i++) {
                    g.drawImage(imgs[i], locations[i][0], locations[i][1], null);
                }

                let long = 0;
                for (let i = 0; i < n; i++) {
                    switch(methods[i] + "") {
                        case "restoreToBackgroundColor":
                            g.setComposite(java.awt.AlphaComposite.Clear);
                            g.fillRect(0, 0, w, h);
                            g.setComposite(java.awt.AlphaComposite.SrcOver);
                            break;
                        case "doNotDispose":
                            break;
                        default: 
                            throw new Error("Unknown disposal method: " + methods[i]);
                    }
                    let img = imgs[i];
                    g.drawImage(img, locations[i][0], locations[i][1], null);
                    // g.setColor(java.awt.Color.WHITE);
                    // g.fillRect(0, 0, base.getWidth() * i / n, base.getHeight() * 0.1);
                    let delay = delays[i];
                    long += delay;
                    this.frames.push(new Frame(base, delay, long));
                }

                this.duration = long;
                success = true;
                if (io0 != null) io0.close();
                io0 = null;
                if (io != null) io.close();
                io = null;
            } catch (e) {
                if (io0 != null) io0.close();
                io0 = null;
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
    
    return ENTRANCE;
})();