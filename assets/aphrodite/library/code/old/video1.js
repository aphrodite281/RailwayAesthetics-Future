//安装ffmpeg后可以使用下面这种方法从视频中提取声音和图片
//ffmpeg -i assets/mtrsteamloco/v/test.mp4 -vf "fps=30" -vsync 0 -f image2 assets/mtrsteamloco/v/%06d.png
//ffmpeg -i assets/mtrsteamloco/v/test.mp4 -vf "fps=30,scale=iw/2:ih/2" -vsync 0 -f image2 assets/mtrsteamloco/v/%06d.png
//ffmpeg -i assets/mtrsteamloco/v/test.mp4 -acodec libvorbis -vn -ac 1 assets/mtrsteamloco/sounds/test.ogg
//rm -r assets/mtrsteamloco/v/*
//rm -r assets/mtrsteamloco/sounds/*
//Compress-Archive -Path ./* -DestinationPath ../somethingcomforting.zip
//Compress-Archive -Path ./pack.mcmeta -DestinationPath ../abc.zip

function Video(data) {
    /**
     * 本部分为私有变量。
     */
    let texture;
    let start = false;
    let running = false;
    let frame = 0;
    let path;
    let fnum;
    let error;
    let sounds;
    let isTrain;

    this.running = () => running;
    this.frame = () => frame;

    if(data.ctx != undefined && data.matrices != undefined) {
        this.cars = data.cars!= undefined ? data.cars : [];
        this.ctx = data.ctx;
        isTrain = ctx.isTrain();
        this.matrices = [];
        for(let i = 0; i < data.matrices.length; i++) {
            if(data.matrices[i] instanceof Array) {
                let matrices= new Matrices();
                matrices.transform(data.matrices[i][0][0], data.matrices[i][0][1], data.matrices[i][0][2]);
                matrices.rotateX(data.matrices[i][1][0]);
                matrices.rotateY(data.matrices[i][1][1]);
                matrices.rotateZ(data.matrices[i][1][2]);
                this.matrices.push(matrices);
            }else if(data.matrices[i] instanceof Matrices) {
                this.matrices.push(data.matrices[i]);
            }
        }
        this.display = data.display != undefined ? data.display : true;
    }else {
        throw new Error("缺少必要参数" + data.toString() + this);
    }

    let v = data.videoInfo;
    if(v.path!= undefined && v.fps!= undefined && v.length!= undefined && v.fnum!= undefined && v.looping!= undefined && v.size != undefined) {
        path = v.path;
        fnum = v.fnum;
        texture = new GraphicsTexture(v.size[0], v.size[1]);
        this.looping = this.videoInfo.looping;
    }else{
        throw new Error("无效的视频数据" + v + this);
    }

    if(data.soundInfo.name!= undefined && data.soundInfo.pitch!= undefined && data.soundInfo.volume!= undefined && data.soundInfo.position!= undefined) {
        this.soundInfo = data.soundInfo;
        sounds = generateSound();
    }else{
        throw new Error("无效的音频数据" + data.soundInfo.toString() + this);
    }

    if(data.promptInfo != undefined) {
        if(data.promptInfo.sound!= undefined) {
            this.promptInfo = data.promptInfo
            if(data.promptInfo.sound.name != undefined && data.promptInfo.sound.pitch != undefined && data.promptInfo.sound.volume != undefined && data.promptInfo.sound.position != undefined) {
                this.promptSound = Resources.id(data.soundInfo.name);
                if(isTrain) {
                    this.ctx.playCarSound(this.promptSound, 0, 0, 0, 0, 0, 0);
                }else{
                    this.ctx.playSound(this.promptSound, 0, 0);
                }
            }else{
                throw new Error("无效的提示音数据" + data.promptInfo.sound.toString() + this);
            }
        }
        if(data.promptInfo.text != undefined) {
            if(data.promptInfo.text.content != undefined && data.promptInfo.text.actionBar != undefined) {
                this.promptText = data.promptInfo.text.content;
                this.actionBar = data.promptInfo.text.actionBar;
            }else{
                throw new Error("无效的提示文字数据" + data.promptInfo.text.toString() + this);
            }
        }
    }

    if(data.model instanceof DynamicModelHolder) {
        this.model = data.model;
        let mc = this.model.getUploadedModel();
        let rawModel = new RawModel();
        rawModel.append(mc.opaqueParts);
        rawModel.append(mc.translucentParts);
        this.rawModel = rawModel;
    }else if(data.model instanceof RawModel) {
        this.rawModel = data.model;
        this.model = new DynamicModelHolder();
        this.model.uploadLater(data.model);
    }else if(data.model.vertices != undefined && data.model.uvPoints != undefined && data.model.renderType != undefined) {
        let builder = new RawMeshBuilder(4, data.model.renderType, this.path);
        for(let i = 0; i < 4; i++) {
            builder.vertex(new Vector3f(data.model.vertices[i][0], data.model.vertices[i][1], data.model.vertices[i][2])).uv(data.model.uvPoints[i][0], data.model.uvPoints[i][1]).normal(0, 1, 0).endVertex();
        }
        let rawModel = new RawModel();
        rawModel.append(builder.getMesh());
        rawModel.triangulate();
        this.rawModel = rawModel;
        this.model = new DynamicModelHolder();
        this.model.uploadLater(rawModel);
    }else if(data.model.size != undefined && data.model.renderType != undefined && data.model.uvSize != undefined) {
        let builder = new RawMeshBuilder(4, data.model.renderType, this.path);
        let [w, h] = data.model.uvSize;
        for(let i = 0; i < 4; i++) {
            builder.vertex(new Vector3f(data.model.size[0] * (i == 0 || i == 1? 0.5 : -0.5), data.model.size[1] * (i == 0 || i == 3 ? -0.5 : 0.5), 0)).uv(i == 0 || i ==1 ? w : 0, i == 0 || i == 3 ? h : 0).normal(0, 0, 0).endVertex();
        }
        let rawModel = new RawModel();
        rawModel.append(builder.getMesh());
        rawModel.triangulate();
        this.rawModel = rawModel;
        this.model = new DynamicModelHolder();
        this.model.uploadLater(rawModel);
    }else{
        try{
            let modelCluster = data.model;
            let test = modelCluster.opaqueParts.sourceLocation;
            this.rawModel = new RawModel();
            this.rawModel.append(modelCluster.opaqueParts);
            this.rawModel.append(modelCluster.translucentParts);
            this.model = new DynamicModelHolder();
            this.model.uploadLater(this.rawModel);
        }catch(e) {
            throw new Error("无效的模型数据" + data.model + this);
        }
    }
    let thread = new Thread

    this.tick = (matrices) => {
        if(!this.display) {
            return;
        }
    
        this.frame = Math.floor((Timing.elapsed() - this.startTime) * this.videoInfo.fps) + 1;
        if(this.frame > this.videoInfo.length || this.frame <= 0) {
            running = false;
            this.stop();
        }
    
        if(!running && this.looping) {
            this.start();
        }
    
        if(!running) {
            return;
        }
    
        this.frame = Math.floor((Timing.elapsed() - this.startTime) * this.videoInfo.fps) + 1;
        this.name = this.getName();
        this.path = Resources.id(this.name);
    
        if(this.model instanceof DynamicModelHolder) {
            this.model.getUploadedModel().replaceAllTexture(this.path);
        }else{
            this.model.replaceAllTexture(this.path);
        }
    
        let temp = matrices == undefined ? new Matrices() : matrices;
        temp.pushPose();
        
        for(let i = 0; i < this.matrices.length; i++) {
            temp.pushPose();
            temp.last().multiply(this.matrices[i].last());
            if(isTrain) {
                for(let car of this.cars) {
                    this.ctx.drawCarModel(this.model, car, temp);
                }
            }else {
                this.ctx.drawModel(this.model, temp);
            }
            temp.popPose();
        }
        temp.popPose();
    
        if(isTrain) {
            if(sounds != undefined) {
                for(let sound of sounds) {
                    for(let i = 0; i < sound.length; i++) {
                        let position = this.ctx.trainExtra.lastCarPosition.copy();
                        position.add(this.soundInfo.position[i][0], this.soundInfo.position[i][1], this.soundInfo.position[i][2])
                        sound[i].setData(this.videoInfo.soundInfo.volume, this.videoInfo.soundInfo.pitch, position);
                    }
                }
            }
        }else {
            if(sounds != undefined) {
                for(let i = 0; i < this.soundInfo.position.length; i++) {
                    let position = this.ctx.entity.getTransformPosVector3f();
                    position.add(this.soundInfo.position[i][0], this.soundInfo.position[i][1], this.soundInfo.position[i][2]);
                    sounds[i].setData(this.soundInfo.volume, this.soundInfo.pitch, position);
                }
            }
        }
    }

    this.start = () => {
        this.stop();
        this.startTime = Timing.elapsed();
        this.generateSound();
        if(sounds != undefined) {
            if(isTrain) {
                for(let soundd of sounds) {
                    for(let sound of soundd) {
                        sound.play();
                    }
                }
            }else{
                for(let sound of sounds) {
                    sound.play();
                }
            }
        }
        if(this.promptSound != undefined) {
            if(isTrain) {
                for(let car of this.cars) {
                    this.ctx.playCarSound(this.promptSound, this.promptInfo.sound.volume, this.promptInfo.sound.pitch, this.promptInfo.sound.position[0], this.promptInfo.sound.position[1], this.promptInfo.sound.position[2], car);
                }
            }else{
                this.ctx.playSound(this.promptSound, this.promptInfo.sound.volume, this.promptInfo.sound.pitch);
            }
        }
        this.isStopped = false;
    }

    this.stop = () => {
        start = false;
        if(sounds != undefined) {
            if(isTrain) {
                for(let soundd of sounds) {
                    for(let sound of soundd) {
                        sound.quit();
                    }
                }
            }else{
                for(let sound of sounds) {
                    sound.quit();
                }
            }
        }
        this.isStopped = true;
    }

    this.close = () => {
        if(this.model instanceof DynamicModelHolder) {
            this.model.close();
        }
    }

    this.getName = function() {
        let name = this.frame + "";
        name = name.padStart(this.videoInfo.numFormat, "0");
        return this.videoInfo.path + name + ".png";
    }

    this.generateSound = function() {
        if(this.soundInfo.name!= undefined && this.soundInfo.pitch!= undefined && this.soundInfo.volume!= undefined && this.soundInfo.position!= undefined) {
            const source = this.videoInfo.source != undefined ? SoundHelper.getSoundSource(this.videoInfo.source) : SoundHelper.getSoundSource("block");
            sounds = [];
            if(isTrain) {
                this.ctx.playCarSound(Resources.id(this.soundInfo.name), 0, 0, 0, 0, 0, 0);
                for(let j = 0; j < this.cars.length; j++) {
                    sounds[j] = [];
                    for(let i = 0; i < this.soundInfo.position.length; i++) {
                        let sound = new TickableSound(Resources.id(this.soundInfo.name), source);
                        sound.setLooping(false);
                        let position = ctx.trainExtra.lastCarPosition.copy();
                        position.add(this.soundInfo.position[i][0], this.soundInfo.position[i][1], this.soundInfo.position[i][2])
                        sound.setData(this.videoInfo.soundInfo.volume, this.videoInfo.soundInfo.pitch, position);
                        sounds[j].push(sound);
                    }
                }
            }else{
                this.ctx.playSound(Resources.id(this.soundInfo.name), 0, 0);
                for(let i = 0; i < this.soundInfo.position.length; i++) {
                    let sound = new TickableSound(Resources.id(this.soundInfo.name), source);
                    sound.setLooping(false);
                    let position = this.ctx.entity.getTransformPosVector3f();
                    position.add(this.soundInfo.position[i][0], this.soundInfo.position[i][1], this.soundInfo.position[i][2]);
                    sound.setData(this.soundInfo.volume, this.soundInfo.pitch, position);
                    sounds.push(sound);
                }
            }
        }
    }
}