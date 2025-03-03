include(Resources.id("mtr:lcda/lcda_main.js"));

doorZPositions = [0, 5, -5, 10, -10];
doorPosition = [0.748, 2.072];
rotateX = 40 / 180 * Math.PI;
finalTranslate = [0, 0, 0];

modelSize = [1.4, 0.18];
textureSize = [modelSize[0] * 2000, modelSize[1] * 2000];
filletPixel = 30;
companyNameCJK = "北武工艺";
companyNameENG = "HOKUBUCRAFT";
// companyLogoPng = Resources.readBufferedImage(Resources.id("your:path/to/your/company_logo.png"));

apply();