# LCDA

> LCDA 由 Aphrodite281 开发，是一个列车LCD脚本



## 移植

移植LCDA您有两种选择，第一种是仅调整配置，第二种是完全复制。


### 仅调整配置

您需要在任意命名空间下创建您的js文件作为配置文件: 例如 `assets/mtr/deploying/lcda/qssnn.js`

```javascript
include(Resources.id("mtr:lcda/lcda_main.js"));

with (lcdaConfigs) {
    doorZPositions = [0, 5, -5, 10, -10];
    doorPosition = [0.748, 2.072];
    rotateX = 35 / 180 * Math.PI;
    finalTranslate = [0, 0.065, -0.012];

    modelSize = [1.2, 0.22];
    textureSize = [modelSize[0] * 2000, modelSize[1] * 2000];
    filletPixel = 50;
    companyNameCJK = "北武工艺";
    companyNameENG = "HOKUBUCRAFT";
    companyLogoPng = Resources.readBufferedImage(Resources.id("your:path/to/your/company_logo.png"));
}

lcdaApply();
```

接下来您需要在 `assets/mtr/mtr_custom_resources.json` 中添加以下内容（根据您的列车类型选择）

```json
    "custom_trains": {
      "lcda_qssnn": {
        "name": "QSSNN (自带模型)",
        "base_train_type": "s_train",
        "color": "2AF0AD",
        "script_files": ["assets/mtr/deploying/lcda/qssnn.js"]
      },
      "lcda_qssnn_2": {
        "name": "QSSNN (自定义模型)",
        "model": "assets/path/to/your/custom_model.obj",
        "model_properties": "assets/path/to/your/prop.json",
        "texture_id": "minecraft:textures/misc/white.png",
        "script_files": ["assets/mtr/deploying/lcda/qssnn.js"]
      }
    }
```

至此，您便完成了移植。接下来对js中的属性进行介绍：

> doorZPositions

门 Z轴的位置。

> doorPosition

门的 XY 位置。

> rotateX

门的向内偏转角度（弧度制）

> finalTranslate

最终的偏移，用于精细调整

> modelSize

模型大小，单位米（块）

> textureSize

默认的纹理大小，实际纹理大小会乘以像素密度。

> filletPixel

圆角像素

> companyNameCJK

公司名称，中文

> companyNameENG

公司名称，英文

> companyLogoPng

公司Logo，PNG格式