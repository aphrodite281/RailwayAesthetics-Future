importPackage (java.lang);
importPackage (java.awt);
importPackage (java.io);
importPackage (java.awt.image);

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

let pb = new ProcessBuilder("ffmpeg", "-i", t + "k.mp4", "-frames:v", "1", t + "1.png"); //
p = () => pb.start();
p();
