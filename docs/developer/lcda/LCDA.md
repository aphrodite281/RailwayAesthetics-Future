# LCDA

> LCDA 由 Aphrodite281 开发，是一个列车LCD脚本



## 移植

您需要编写一些代码并将此资源包与RailwayAesthetics-Future一起加载。
您可以下载[示例资源包](./example.zip)

### 基本信息

您需要在任意命名空间下创建您的js文件作为配置文件: 例如 `assets/mtr/deploying/lcda/qssnn.js`

```javascript
include(Resources.id("mtr:lcda/lcda_main.js"));

with (lcdaConfigs) {
    doorZPositions = [0, 5, -5, 10, -10];
    doorXYPosition = [0.6875, 2.072];
    rotateX = 35 / 180 * Math.PI;
    finalTranslate = [0, 0, -0.012];

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

| 属性 | 说明 | 默认值 |
| --- | --- | --- |
| doorZPositions | 门 Z轴的位置 | [0, 5, -5, 10, -10] |
| doorXYPosition | 门的 XY 位置 | [1.3, 1.9] |
| rotateX | 门的向内偏转角度（弧度制） | 15 / 180 * Math.PI |
| finalTranslate | 最终的偏移，用于精细调整 | [0, 0, 0] |
| modelSize | 模型大小，单位米（块） | [1600 / 2000, 350 / 2000] | [1600 / 2000, 350 / 2000] |
| textureSize | 默认的纹理大小，实际纹理大小会乘以像素密度。 | [1600, 350] |
| filletPixel | 圆角像素 | 30 | 
| companyNameCJK | 公司名称，中文 | "北武工艺" |
| companyNameENG | 公司名称，英文 | "HOKUBUCRAFT" |
| companyLogoPng | 公司Logo，PNG格式 | undefined |

> 以上属性都是可选的，如果您不需要更改，可以不修改。


### 确定参数

对于使用 `bbmodel` 的列车，您需要找到列车的模型文件、下载 `blockbench`，并使用 `blockbench` 打开模型文件。

![p1](./p1.jpg)
将坐标系改为全局，在右侧分组中找到 `roof_head` 或类似的分组。
![p2](./p2.jpg)
![p3](./p3.jpg)
选择位于此位置的块，点击枢轴居中，查看位置、旋转信息。
此时的 `-55` 即为此块的旋转角度。
比如现在应该是 `rotateX = (90 - 55) / 180 * Math.PI`
此时的 `9.0775, 34.1882` 即为此块的 XY 坐标(1m = 16k)。
比如现在应该是 `doorXYPosition = [9.0775 / 16, 34.1882 / 16]`

在这之后，如果位置不准确，您可以调整 `finalTranslate` 进行微调。
您可以根据需求设置 模型大小、纹理大小、圆角像素、公司名称、公司Logo等。

如此 您便完成了移植。