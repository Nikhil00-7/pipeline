pipeline {
    agent any

    tools {
        nodejs 'node22'
    }

    environment {
        PATH = "/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin"
        MAX_RETRIES = "3"
        DELAY_RETRIES = "30"
        SERVICES = "user,ride,captain,gateway"
    }

    options {
        timestamps()
        timeout(time: 1, unit: "HOURS")
    }

    parameters {
        booleanParam(name: "SKIP_TEST", defaultValue: true, description: "Skip test stage")
        booleanParam(name: "SKIP_BUILD", defaultValue: true, description: "Skip build stage")
    }

    stages {

        stage("Checkout Code") {
            steps {
                git branch: 'main', url: 'https://github.com/Nikhil00-7/pipeline.git'
            }
        }

        stage("Install Dependencies") {
            steps {
                script {
                    def services = env.SERVICES.split(",")
                    def maxRetries = env.MAX_RETRIES.toInteger()
                    def delay = env.DELAY_RETRIES.toInteger()

                    for (service in services) {
                        for (int attempt = 1; attempt <= maxRetries; attempt++) {
                            try {
                                dir(service) {
                                    sh "npm install"
                                }
                                echo "${service} dependency install successful"
                                break
                            } catch (Exception e) {
                                echo "Attempt ${attempt}/${maxRetries} failed for ${service}"
                                if (attempt == maxRetries) {
                                    error("Failed to install dependencies for ${service}")
                                }
                                echo "Retrying in ${delay} seconds..."
                                sleep(time: delay, unit: "SECONDS")
                            }
                        }
                    }
                }
            }
        }

        stage("Build Services") {
            when {
                expression { params.SKIP_BUILD == false }
            }
            steps {
                script {
                    def services = env.SERVICES.split(",")
                    def maxRetries = env.MAX_RETRIES.toInteger()
                    def delay = env.DELAY_RETRIES.toInteger()

                    for (service in services) {
                        for (int attempt = 1; attempt <= maxRetries; attempt++) {
                            try {
                                dir(service) {
                                    sh "npm run build"
                                }
                                echo "${service} build successful"
                                break
                            } catch (Exception e) {
                                echo "Attempt ${attempt}/${maxRetries} failed for ${service}"
                                if (attempt == maxRetries) {
                                    error("Build failed for ${service}")
                                }
                                sleep(time: delay, unit: "SECONDS")
                            }
                        }
                    }
                }
            }
        }

        stage("Run Tests") {
            when {
                expression { params.SKIP_TEST == false }
            }
            steps {
                script {
                    def services = env.SERVICES.split(",")
                    def maxRetries = env.MAX_RETRIES.toInteger()
                    def delay = env.DELAY_RETRIES.toInteger()

                    for (service in services) {
                        for (int attempt = 1; attempt <= maxRetries; attempt++) {
                            try {
                                dir(service) {
                                    sh "npm test"
                                }
                                echo "${service} tests passed"
                                break
                            } catch (Exception e) {
                                echo "Attempt ${attempt}/${maxRetries} failed for ${service}"
                                if (attempt == maxRetries) {
                                    error("Tests failed for ${service}")
                                }
                                sleep(time: delay, unit: "SECONDS")
                            }
                        }
                    }
                }
            }
        }

        stage("Create Artifacts") {
            steps {
                script {
                    def services = env.SERVICES.split(",")

                    for (service in services) {
                        dir(service) {
                            sh "zip -r ${service}.zip ."
                        }
                        echo "${service} artifact created"
                    }
                }
            }
        }

        stage("Archive Artifacts") {
            steps {
                archiveArtifacts artifacts: '**/*.zip', fingerprint: true
            }
        }

        stage("Build Docker Images") {
            steps {
                script {
                    def services = env.SERVICES.split(",")

                    for (service in services) {
                        dir(service) {
                            sh "docker build -t docdon0007/${service}:${env.BUILD_NUMBER} ."
                        }
                    }
                }
            }
        }

        stage("Terraform Init") {
            steps {
                dir("Terraform") {
                    sh "terraform init"
                }
            }
        }

        stage("Terraform Plan") {
            steps {
                dir("Terraform") {
                    sh "terraform plan"
                }
            }
        }
    }

    post {
        always {
            echo "Pipeline finished!"
        }

        success {
            echo "Deployment successful"
            sh "kubectl get pods || true"
        }

        failure {
            echo "Pipeline failed"
            sh "kubectl get pods || true"
        }
    }
}