# ========================================
# BUILD
# ========================================
FROM maven:3.9.11-eclipse-temurin-21 AS build

WORKDIR /app

# Copier d'abord le pom pour profiter du cache des dépendances
COPY pom.xml .
RUN mvn dependency:go-offline -B

COPY src ./src
RUN mvn clean package -DskipTests -B


# ========================================
# RUNTIME
# ========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

COPY --from=build /app/target/ttes-icg-sante-1.0-SNAPSHOT.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-XX:MaxRAMPercentage=75", \
  "-XX:+UseSerialGC", \
  "-Xss512k", \
  "-XX:TieredStopAtLevel=1", \
  "-jar", "app.jar"]
