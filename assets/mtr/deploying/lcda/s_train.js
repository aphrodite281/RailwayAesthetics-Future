include(Resources.id("mtr:lcda/lcda_main.js"));

doorZPositions = [0, 5, -5, 10, -10];
doorPosition = [0.748, 2.072];
rotateX = 40 / 180 * Math.PI;
modelSize = [1.4, 0.18];
textureSize = [modelSize[0] * 2000, modelSize[1] * 2000];

updateMatrices();