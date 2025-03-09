include(Resources.id("mtr:lcda/lcda_main.js"));

with (lcdaConfigs) {
    doorZPositions = [0, 5, -5, 10, -10];
    doorPosition = [0.748, 2.072];
    rotateX = 40 / 180 * Math.PI;
    finalTranslate = [0, -0.01, -0.002];

    modelSize = [1.45, 0.175];
    textureSize = [modelSize[0] * 2000, modelSize[1] * 2000];
    filletPixel = 30;
    companyNameCJK = "北武工艺";
    companyNameENG = "HOKUBUCRAFT";
    // companyLogoPng = Resources.readBufferedImage(Resources.id("your:path/to/your/company_logo.png"));
}

lcdaApply();