include(Resources.id("mtr:lcda/lcda_main.js"));

with (lcdaConfigs) {
    doorZPositions = [0, 5, -5, 10, -10];
    doorXYPosition = [0.888271, 1.976];
    rotateX = (90 - (180 - 136.906)) / 180 * Math.PI;
    finalTranslate = [0, 0, 0.001];

    modelSize = [1.35, 0.18];
    textureSize = [modelSize[0] * 2000, modelSize[1] * 2000];
    filletPixel = 50;
    companyNameCJK = "北武工艺";
    companyNameENG = "HOKUBUCRAFT";
    companyLogoPng = undefined;
}

lcdaApply();