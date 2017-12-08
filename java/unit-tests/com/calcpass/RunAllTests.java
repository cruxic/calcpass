package com.calcpass;

import org.junit.runner.JUnitCore;

import com.calcpass.util.Util_test;
import com.calcpass.parallel_bcrypt.ParallelBcrypt_test;


public class RunAllTests {
	public static void main(String[] args) {
		JUnitCore.main(new String[]{
			com.calcpass.util.Util_test.class.getName(),
			
		});

		
	}

}
