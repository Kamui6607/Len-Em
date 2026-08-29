buildscript {
    repositories {
        maven("https://repo.huaweicloud.com/repository/maven") // mirror mavenCentral (nhanh nhất ở VN)
        google()
        mavenCentral()
    }
    dependencies {
        classpath("com.android.tools.build:gradle:8.11.0")
        classpath("org.jetbrains.kotlin:kotlin-gradle-plugin:1.9.25")
    }
}

allprojects {
    repositories {
        maven("https://repo.huaweicloud.com/repository/maven")
        google()
        mavenCentral()
    }
}

tasks.register("clean").configure {
    delete("build")
}

