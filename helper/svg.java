/**
 * 本程序用于将svg文件转为js文件
 * cd到本目录下后可以使用 java svg ../assets/mtr/lcda/xiaoren.svg ren 的方式调用
 * 本程序会创建../assets/mtr/lcda/xiaoren.js 文件 并以 ren 为变量名创建对象
 * 在 ren 对象中包含 width, height 属性，对应svg文件的宽和高
 * 在 ren 对象中包含 draw 方法，可以传入两个函数 fx, fy 应该为两个 lambda 函数，用于对应坐标，g 为 Grahpics2D 对象
 * 注意 请将所有对象都转换为path路径，否则不会转换
 * 
 * 暂时放弃了 svg 的圆弧不好解析为 Arc2D.Double 
 * 
 * @author Aphrodite281 QQ: 3435494979
*/
import java.util.function.Function;
import java.util.function.BiFunction;
import java.util.Map;
import java.util.HashMap;
import java.io.*;
import java.util.ArrayList;

public class svg {

    public static void main(String[] args) {
        try (FileInputStream fis = new FileInputStream(args[0]);) {
            InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
            char[] chars = new char[fis.available()];
            isr.read(chars);
            String args2 = new String(chars).replace("\"", " \" ").replaceAll("=", " ");
            String path = args[0].replace(".svg", ".js");
            String name = args[1];
            try (BufferedWriter wr = new BufferedWriter(new FileWriter(path))) {
                wr.write("const " + name + " = {");
                wr.newLine();
                ArrayList<String> arr = read(args2.split(" "), wr);
                for (int i = 0; i < arr.size() - 1; i++) {
                    wr.write(arr.get(i));
                    wr.newLine();
                }
                wr.write("    }");
                wr.newLine();
                wr.write("};");
            } catch (Exception e) {
                throw e;
            }
        } catch (Exception e) {
            System.out.println(e.getMessage());
        }
        System.out.println("done");
    }

    public static ArrayList<String> read(String[] args, BufferedWriter wr) throws Exception {
        // System.out.println("start");
        Map<Integer, Double> mp = new HashMap<>();
        mp.put(0, 0D);
        mp.put(1, 0D);
        BiFunction<String, Boolean, String> f = (s, b) -> {
            double[] d = in(s);
            double x = mp.get(0);
            double y = mp.get(1);
            String str = "fx(" + (x + d[0]) + ")," + "fy(" + (y + d[1]) + ")";
            if (b) {
                mp.put(0, x + d[0]);
                mp.put(1, y + d[1]);
            }
            return str;
        };
        boolean start = false;
        String last = "";
        ArrayList<String> arr = new ArrayList<>();
        for (int i = 0; i < args.length; i++) {
            args[i] = args[i].trim().replaceAll("\\s+", "").toLowerCase();
            // System.out.println(i + " " + args[i]);
            String str = "        ";
            if (args[i].contains(",")) {
                i--;
                args[i] = last;
            }
            if (args[i].equals("width")) {
                i += 3;
                str = "    width: " + Double.parseDouble(args[i].substring(0, args[i].length() - 2)) + ",";
                arr.add(str);
            }
            if (args[i].equals("height")) {
                i += 3;
                str = "    height: " + Double.parseDouble(args[i].substring(0, args[i].length() - 2)) + ",";
                arr.add(str);
                arr.add("    draw: (fx, fy, g) => {");
            }
            // System.out.println(i + " " + args[i] + " " + start + " " + last);
            if (args[i].equals("m")) {
                i++;
                start = true;
                str += "path.moveTo(" + f.apply(args[i], true) + ");";
                last = "l";
                String sty = args[i - 13];
                sty = sty.substring(6, 12);
                arr.add("        g.setColor(new Color(0x" + sty + "));");
                arr.add("        path = new GeneralPath();");
            }
            // System.out.println(i + " " + args[i] + " " + start + " " + last);
            if (start == false) continue;
            if (args[i].equals("l")) {
                str += "path.lineTo(";
                i++;
                str = str + f.apply(args[i], true) + ");";
                last = "l";
            }

            if (args[i].equals("a")) {
                double sx = mp.get(0);
                double sy = mp.get(1);
                i++;
                String[] strr = args[i].split(",");
                double rx = Double.parseDouble(strr[0].trim());
                double ry = Double.parseDouble(strr[1].trim());
                i++;
                int largeArcFlag  = Integer.parseInt(args[i].trim());
                i++;
                i++;
                double sweepFlag  = Double.parseDouble(args[i].trim());
                i++;
                str += "arc = new Arc2D.Double("
                str += fx(args[i], false);
            }

            if (args[i].equals("c")) {
                str += "path.curveTo(";
                for (int j = 0; j < 3; j++) {
                    i++;
                    str = str + f.apply(args[i], false) + ",";
                }
                f.apply(args[i], true);
                str = str.substring(0, str.length() - 1) + ");";
                last = "c";
            }
            if (args[i].equals("z")) {
                start = false;
                mp.put(0, 0D);
                mp.put(1, 0D);
                arr.add("        path.closePath();");
                arr.add("        g.fill(path);");
                // System.out.println("path.closePath();");
                // System.out.println("g.fill(path);");
                //continue;
            }
            arr.add(str);
        }
        return arr;
    }

    static double[] in(String ss) {
        String[] s = ss.split(",");
        double[] d = new double[s.length];
        for (int i = 0; i < s.length; i++) {
            d[i] = Double.parseDouble(s[i].trim());
        }
        return d;
    }
}