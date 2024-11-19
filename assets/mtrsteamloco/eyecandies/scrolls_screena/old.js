    if (hg) {
        let info = {
            ctx: ctx,
            isTrain: false,
            matrices: [new MS()],
            texture: [15, 15],
            model: {
                size: ss,
                renderType: "exterior",
                uvSize: ts
            }
        }
        let f = new Face(info);
        let tex = f.texture;
        let g = tex.graphics;
        g.setColor(new Color(cls[2]));
        g.fillRect(0, 0, 15, 15);
        g.setComposite(AlphaComposite.Src);
        g.setColor(new Color(0, 0, 0, 0));
        g.fillOval(3, 3, 12, 12);
        tex.upload();
        bb.addLayer();
        bb.addItem(f);
    }