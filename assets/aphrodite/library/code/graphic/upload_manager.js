/**
 * 本类意在减短上传消耗的时间
 * 
 * @author Aphrodite281 QQ: 3435494979
 */

/**
 * 上传经理
 * @param {GraphicsTexture} tex 纹理对象
 */
function UploadManager(tex) {
    let last = 0;
    /**
     * 上传图片
     * @param {BufferedImage} img 图片
     * @param {Number} alpha 透明度
     */
    this.upload = (img) => {
        let th = new Thread(() => {
            let start = Date.now();
            tex.upload(img);
            last = Date.now() - start;
        }, "Upload");
        th.start();
    }

    this.lastUsed = () => last;
}