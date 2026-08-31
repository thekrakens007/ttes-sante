# ========================================
# BUILD
# ========================================
FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

COPY pom.xml .
COPY src ./src

RUN mvn clean package -DskipTests


# ========================================
# RUNTIME
# ========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/ttes-icg-sante-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]