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
            steps{
            def max_retries = env.MAX_RETRIES.toInteger()
            def delay = env.DELAY_RETRIES.toInteger()
            def services = env.SERVICES.split(',')

            def userChoice = input(message: "Do you want to run build ?" ,
                parameters [
                  booleanParam(name: "SKIPS_BUILD" , defaultValue:true , description: "RUN build ?")
                ]
            )
            script{
                for(service in serivces){
                     for(int attempts = 1; attempts<= max_retries ; attempts++){
                       try{
                           dir(service){
                            if(!userChoice){
                              echo "skip test stage"
                            }else{
                                sh "npm run build"
                            }
                           }
                           echo "Build process of ${service} is complete"
                           break

                       }catch(Exception e){
                            echo "Attempts ${attempts}/${max_retries} failed for service"
                          if(i == max_retries){
                            error("failed to install dependency for ${service} service")
                          }
                          echo "wait for ${delay} seconds for the next retry..."
                          sleep(time: delay , utils:"SECONDS")
                       }
                     }
                }
             }
            }
        }

        stage("Run Tests") {
           steps{
            def max_retries = env.MAX_RETRIES.toInteger()
            def delay = env.DELAY_RETRIES.toInteger()
            def services = env.SERVICES.split(',')

            def userChoice = input(message: "Do you want to run TEST ?" ,
                parameters [
                  booleanParam(name: "SKIPS_TEST" , defaultValue:true , description: "RUN test ?")
                ]
            )
            script{
                for(service in serivces){
                     for(int attempts = 1; attempts<= max_retries ; attempts++){
                       try{
                           dir(service){
                            if(!userChoice){
                              echo "skip test stage"
                            }else{
                                sh "npm test"
                            }
                           }
                           echo "Test process of ${service} is complete"
                           break

                       }catch(Exception e){
                            echo "Attempts ${attempts}/${max_retries} failed for service"
                          if(i == max_retries){
                            error("failed to install dependency for ${service} service")
                          }
                          echo "wait for ${delay} seconds for the next retry..."
                          sleep(time: delay , utils:"SECONDS")
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