importPackage (java.lang);
importPackage (java.awt);
importPackage (java.io);
importPackage (java.awt.image);
include(Resources.id("aphrodite:library/code/scrolls_screen.js"));
include(Resources.id("aphrodite:library/code/board.js"));
include(Resources.id("aphrodite:library/code/face.js"));
include(Resources.id("aphrodite:library/code/color_int_base.js"));

const MCU = MinecraftClient;
const MCD = MTRClientData;
const RU = Resources;
const MM = ModelManager;
const GT = GraphicsTexture;
const TM = Timing;
const SH = SoundHelper;
const PH = ParticleHelper;
const TS = TickableSound;
const DM = DynamicModelHolder;
const MS = Matrices;
const M4 = Matrix4f;
const V3 = Vector3f;
const RB = RawMeshBuilder;

/*let ff = new File("aacc.txt");
ff.createNewFile();
let fw = new FileWriter(ff);
try {
    fw.write("Hello, world!");
} finally {
    fw.close();
}*/

const r = RU.id("mtrsteamloco:eyecandies/test/k.mp4");
const t = "arar-temp/videoo/";

let is = Resources.readStream(r);
let opf = new File(t + "k.mp4");
if (!opf.getParentFile().exists()) {
    opf.getParentFile().mkdirs();
}
opf.createNewFile();
let os = new FileOutputStream(opf);
try {
    let buffer = java.lang.reflect.Array.newInstance(java.lang.Byte.TYPE, 1024);
    let len = 0;
    while ((len = is.read(buffer)) > 0) {
        os.write(buffer, 0, len);
    }
    os.close();
} catch (e) {
    os.close();
    throw e;
}

//let pb = new ProcessBuilder("ffmpeg", "-i", t + "k.mp4", "-vf", "fps=30", "-vsync", "0", "-f", "image2", t + "%06d.png");
let pb = new ProcessBuilder("ffmpeg", "-i", t + "k.mp4", "-frames:v", "1", t + "1.png"); //
//ffmpeg -i assets/mtrsteamloco/v/test.mp4 -vf "fps=30" -vsync 0 -f image2 assets/mtrsteamloco/v/%06d.png
p = () => pb.start();
p();
//let th = new Thread(p, "jieya-mp4");
//th.start();
/* let br = new BufferedReader(new InputStreamReader(p.getInputStream()));
let er = new BufferedReader(new InputStreamReader(p.getErrorStream()));
let line = "";
let a = ""
while ((line = br.readLine()) != null) {
    a += line + "\n";
}
while ((line = er.readLine()) != null) {
    a += line + "\n";
}
throw new Error(a);*/