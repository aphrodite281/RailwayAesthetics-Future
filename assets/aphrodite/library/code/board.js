function Board(data) {
    if(data.matrices != undefined) {
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
        this.interval = data.interval? data.interval : 0;
    }else {
        throw new Error("缺少必要参数:" + data.toString() + this);
    }
    this.boards = new Map();
    

    this.addBoard = (name) => {
        this.boards.set(name, []);
        this.nowBoard = name;
        return this;
    }

    this.delBoard = (name, nowBoard) => {
        this.boards.delete(name);
        this.nowBoard = nowBoard != undefined? nowBoard : "default";
        return this;
    }

    this.setNowBoard = (name) => {
        if(!this.boards.has(name)) {
            throw new Error("不存在的画板:" + name + this);
        }
        this.nowBoard = name;
        return this;
    }

    this.addLayer = () => {
        this.boards.get(this.nowBoard).push([]);
        this.nowLayer = this.boards.get(this.nowBoard).length - 1;
        return this;
    }
    this.delLayer = () => {
        this.boards.get(this.nowBoard).pop();
        this.nowLayer = this.boards.get(this.nowBoard).length - 1;
        return this;
    }

    this.addItem = (item) => {
        this.boards.get(this.nowBoard)[this.nowLayer].push(item);
        return this;
    }

    this.delItem = (item) => {
        let index = this.boards.get(this.nowBoard)[this.nowLayer].indexOf(item);
        if(index != -1) {
            this.boards.get(this.nowBoard)[this.nowLayer].splice(index, 1);
        }
        return this;
    }

    this.tick = (matrices) => {
        let temp = new Matrices();
        if(matrices != undefined) {
            temp = matrices;
        }
        for(let i = 0; i < this.matrices.length; i++) {
            temp.pushPose();
            temp.last().multiply(this.matrices[i].last());
            for(let j = 0; j < this.boards.get(this.nowBoard).length; j++) {
                for(let k = 0; k < this.boards.get(this.nowBoard)[j].length; k++) {
                    this.boards.get(this.nowBoard)[j][k].tick(temp);
                }
                temp.translate(0, 0, this.interval);
            }
            temp.popPose();
        }
    }

    this.close = () => {
        for(let i = 0; i < this.boards.get(this.nowBoard).length; i++) {
            for(let j = 0; j < this.boards.get(this.nowBoard)[i].length; j++) {
                this.boards.get(this.nowBoard)[i][j].close();
            }
        }
    }

    this.addBoard("default");
}