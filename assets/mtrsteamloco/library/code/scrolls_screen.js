importPackage (java.awt);

function ScrollsScreen(data) {
    if(data.uvSpeed != undefined && data.running != undefined && data.ctx != undefined && data.isTrain != undefined && data.matrices != undefined) {
        this.uvSpeed = data.uvSpeed;
        this.running = data.running;
        this.ctx = data.ctx;
        this.isTrain = data.isTrain;
        this.cars = data.cars!= undefined ? data.cars : [];
        this.display = data.display != undefined ? data.display : true;
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
    }else{
        throw new Error("缺少必要参数" + data.toString() + this);
    }


    if(data.texture instanceof GraphicsTexture) {
        this.texture = data.texture;
    }else if(data.texture.path != undefined && data.texture.size != undefined) {
        this.texture = new GraphicsTexture(data.texture.size[0], data.texture.size[1], data.texture.path);
    }else if(data.texture instanceof Array) {
        this.texture = new GraphicsTexture(data.texture[0], data.texture[1]);
    }else{
        throw new Error("无效的贴图数据" + data.texture + this);
    }
    this.path = this.texture.identifier;
    this.size = [this.texture.bufferedImage.getWidth(), this.texture.bufferedImage.getHeight()];

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
    }else if(data.model.size != undefined && data.model.renderType != undefined) {
        let builder = new RawMeshBuilder(4, data.model.renderType, this.path);
        for(let i = 0; i < 4; i++) {
            builder.vertex(new Vector3f(data.model.size[0] * (i == 0 || i == 1? 0.5 : -0.5), data.model.size[1] * (i == 0 || i == 3 ? -0.5 : 0.5), 0)).uv(i == 0 || i ==1 ? 1 : 0, i == 0 || i == 3 ? 1 : 0).normal(0, 0, 0).endVertex();
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
}

ScrollsScreen.prototype.tick = function(matrices) {
    if(!this.display) {
        return;
    }

    if(this.running) {
        let meshList = this.rawModel.meshList;
        for(let rawMesh of meshList.values()) {
            for(let i = 0 ; i < rawMesh.vertices.length ; i++) {
                rawMesh.vertices.get(i).u += this.uvSpeed[0] * Timing.delta() / this.size[0];
                rawMesh.vertices.get(i).v += this.uvSpeed[1] * Timing.delta() / this.size[1];
                //this.ctx.setDebugInfo("u",rawMesh.vertices.get(i).u);
                //this.ctx.setDebugInfo("v",rawMesh.vertices.get(i).v);
            }
        }
        this.rawModel.replaceAllTexture(this.path);
        this.model.uploadLater(this.rawModel);
    }

    let temp = matrices == undefined ? new Matrices() : matrices;
    temp.pushPose();
    
    for(let i = 0; i < this.matrices.length; i++) {
        temp.pushPose();
        temp.last().multiply(this.matrices[i].last());
        if(this.isTrain) {
            for(let car of this.cars) {
                this.ctx.drawCarModel(this.model, car, temp);
            }
        }else {
            this.ctx.drawModel(this.model, temp);
        }
        temp.popPose();
    }
    temp.popPose();
}

ScrollsScreen.prototype.close = function() {
    this.model.close();
    this.texture.close();
}