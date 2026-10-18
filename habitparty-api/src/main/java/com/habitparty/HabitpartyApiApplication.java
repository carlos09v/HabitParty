package com.habitparty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Liga o motor de tarefas em segundo plano do Spring
public class HabitpartyApiApplication {
	static {
		System.setProperty("java.net.preferIPv4Stack", "true");
	}

	public static void main(String[] args) {
		SpringApplication.run(HabitpartyApiApplication.class, args);
	}
}
