package araf_temp;

import javax.swing.JFrame;
import java.awt.*;

import java.util.HashMap;
import java.util.Map;

public class araf_jframe {

	public static Map<String, JFrame> windowMap = new HashMap<String, JFrame>();

	public static void main(String[] args) {
		if (args.length != 3) {
			return;
		}

		JFrame window = new JFrame(args[0]);

		window.setBounds(0, 0, Integer.parseInt(args[1]),Integer.parseInt(args[2]));
		
		window.setVisible(true);

		windowMap.put(args[0], window);
	}
}
//javac -encoding UTF-8 araf_jframe.java