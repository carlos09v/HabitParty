package com.habitparty;

import java.util.TimeZone;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling // Liga o motor de tarefas em segundo plano do Spring
@EnableAsync
public class HabitpartyApiApplication {
	static {
		TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
		System.setProperty("java.net.preferIPv4Stack", "true");
	}

	public static void main(String[] args) {
		SpringApplication.run(HabitpartyApiApplication.class, args);
	}
}
